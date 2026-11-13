import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getEntitlements } from '@/lib/entitlements'
import { checkRateLimit } from '@/lib/rate-limit'
import { isSameOriginRequest } from '@/lib/csrf'
import { MAX_CV_FILE_BYTES, validateCvFile, cvFileErrorMessage } from '@/lib/cv-import/file-validation'
import { extractDocxText } from '@/lib/cv-import/extract-docx'
import { extractPdfText } from '@/lib/cv-import/extract-pdf'
import { CvExtractionError } from '@/lib/cv-import/errors'
import { normalizeCvText } from '@/lib/cv-import/normalize'
import { extractLocalCvSuggestions } from '@/lib/cv-import/local-extractor'
import { extractCvWithNvidia, isNvidiaConfigured } from '@/lib/cv-import/ai-provider'
import { mergeCvSuggestions } from '@/lib/cv-import/merge'
import { filterAiFieldsToCv } from '@/lib/cv-import/support'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  Pragma: 'no-cache',
}

const EXTRACTION_TIMEOUT_MS = 20_000

async function withTimeout<T>(promise: Promise<T>, ms: number, code: 'PDF_UNREADABLE' | 'DOCX_UNREADABLE'): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new CvExtractionError(code)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function errorResponse(code: string, message: string, status: number, extraHeaders?: Record<string, string>) {
  return NextResponse.json(
    { code, message },
    { status, headers: { ...NO_STORE_HEADERS, ...(extraHeaders || {}) } },
  )
}

async function enforceRateLimit(userId: string): Promise<NextResponse | null> {
  const short = await checkRateLimit(`cv-import:user:${userId}:short`, 5, 15 * 60 * 1000)
  if (!short.allowed) {
    return errorResponse(
      'RATE_LIMITED',
      'Too many CV imports. Please wait before trying again.',
      429,
      { 'Retry-After': String(Math.max(1, Math.ceil(short.resetAfterMs / 1000))) },
    )
  }
  const daily = await checkRateLimit(`cv-import:user:${userId}:day`, 20, 24 * 60 * 60 * 1000)
  if (!daily.allowed) {
    return errorResponse(
      'RATE_LIMITED',
      'Daily CV import limit reached. Please try again tomorrow.',
      429,
      { 'Retry-After': String(Math.max(1, Math.ceil(daily.resetAfterMs / 1000))) },
    )
  }
  return null
}

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) {
    return errorResponse('CSRF_REJECTED', 'Cross-site request rejected', 403)
  }

  const user = await getCurrentUser()
  if (!user) return errorResponse('UNAUTHORIZED', 'Please log in first', 401)

  try {
    const entitlements = await getEntitlements(user.id)
    if (entitlements.isFree) {
      return errorResponse('SUBSCRIPTION_REQUIRED', 'CV import requires a paid plan', 403)
    }
  } catch {
    return errorResponse('SERVICE_UNAVAILABLE', 'Could not verify your plan. Please try again.', 503)
  }

  try {
    const limited = await enforceRateLimit(user.id)
    if (limited) return limited
  } catch {
    return errorResponse('SERVICE_UNAVAILABLE', 'Could not verify the request limit. Please try again.', 503)
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return errorResponse('VALIDATION_ERROR', 'Invalid upload request', 400)
  }

  if (form.get('acknowledged') !== 'true') {
    return errorResponse('CONSENT_REQUIRED', 'Please acknowledge the CV processing notice first', 400)
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return errorResponse('FILE_EMPTY', 'Please choose a CV file', 400)
  }
  if (file.size > MAX_CV_FILE_BYTES) {
    return errorResponse('FILE_TOO_LARGE', 'The file is larger than 4 MB', 413)
  }

  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch {
    return errorResponse('FILE_UNREADABLE', 'The file could not be read', 422)
  }

  const validation = validateCvFile(buffer, file.name || '', file.type || '')
  if (!validation.ok) {
    const status = validation.code === 'FILE_TOO_LARGE' || validation.code === 'DOCX_TOO_LARGE' ? 413 : 415
    return errorResponse(validation.code, cvFileErrorMessage(validation.code), status)
  }

  let rawText = ''
  try {
    if (validation.kind === 'pdf') {
      const result = await withTimeout(extractPdfText(buffer), EXTRACTION_TIMEOUT_MS, 'PDF_UNREADABLE')
      rawText = result.text
    } else {
      rawText = await withTimeout(extractDocxText(buffer), EXTRACTION_TIMEOUT_MS, 'DOCX_UNREADABLE')
    }
  } catch (error) {
    if (error instanceof CvExtractionError) {
      const message = error.code === 'PDF_ENCRYPTED'
        ? 'This PDF is password protected. Remove the password and try again.'
        : error.code === 'PDF_TOO_MANY_PAGES'
          ? 'This PDF has too many pages to process.'
          : 'We could not read this file. Try another PDF or DOCX.'
      return errorResponse(error.code, message, 422)
    }
    return errorResponse('FILE_UNREADABLE', 'We could not read this file. Try another PDF or DOCX.', 422)
  }

  const normalized = normalizeCvText(rawText)
  if (normalized.text.length < 40) {
    return errorResponse(
      'NO_TEXT_FOUND',
      'We could not find readable text in this file. Scanned PDFs are not supported.',
      422,
    )
  }

  const local = extractLocalCvSuggestions(normalized.text, { truncated: normalized.truncated })
  let suggestions = local

  if (isNvidiaConfigured()) {
    const ai = await extractCvWithNvidia(normalized.text)
    if (ai) {
      const supported = filterAiFieldsToCv(ai, normalized.text, local.skillGroups)
      suggestions = mergeCvSuggestions(local, supported.fields)
      if (supported.filtered) {
        suggestions = {
          ...suggestions,
          warnings: [...new Set([...suggestions.warnings, 'AI_OUTPUT_FILTERED' as const])],
        }
      }
    }
  }

  return NextResponse.json(
    { ok: true, suggestions },
    { status: 200, headers: NO_STORE_HEADERS },
  )
}
