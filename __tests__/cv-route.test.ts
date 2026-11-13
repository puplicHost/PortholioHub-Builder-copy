import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getEntitlements: vi.fn(),
  checkRateLimit: vi.fn(),
  isSameOriginRequest: vi.fn(),
  extractDocxText: vi.fn(),
  extractPdfText: vi.fn(),
  isNvidiaConfigured: vi.fn(),
  extractCvWithNvidia: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/lib/entitlements', () => ({ getEntitlements: mocks.getEntitlements }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: mocks.checkRateLimit }))
vi.mock('@/lib/csrf', () => ({ isSameOriginRequest: mocks.isSameOriginRequest }))
vi.mock('@/lib/cv-import/extract-docx', () => ({ extractDocxText: mocks.extractDocxText }))
vi.mock('@/lib/cv-import/extract-pdf', () => ({ extractPdfText: mocks.extractPdfText }))
vi.mock('@/lib/cv-import/ai-provider', () => ({
  isNvidiaConfigured: mocks.isNvidiaConfigured,
  extractCvWithNvidia: mocks.extractCvWithNvidia,
}))

import { POST } from '@/app/api/cv-import/extract/route'

const FIXTURES = path.join(__dirname, 'fixtures')
const docx = fs.readFileSync(path.join(FIXTURES, 'synthetic-cv.docx'))
const SYNTHETIC_TEXT = `John Doe
Software Engineer
Cairo, Egypt

Professional Summary
Software engineer with six years of experience building web applications.

Work Experience
Senior Software Engineer | Acme Corp | Jan 2020 - Present
Built web products.

Education
BSc Computer Science | Cairo University | 2013 - 2017

Skills
JavaScript, TypeScript, React, Node.js`

function makeRequest(options: { acknowledged?: boolean; file?: File } = {}) {
  const form = new FormData()
  if (options.file) form.append('file', options.file)
  if (options.acknowledged !== false) form.append('acknowledged', 'true')
  return new Request('http://localhost/api/cv-import/extract', {
    method: 'POST',
    body: form,
    headers: { origin: 'http://localhost', host: 'localhost' },
  })
}

function docxFile() {
  return new File([docx], 'synthetic-cv.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getCurrentUser.mockResolvedValue({ id: 'user-1' })
  mocks.getEntitlements.mockResolvedValue({ state: 'ACTIVE', isFree: false })
  mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetAfterMs: 1000 })
  mocks.isSameOriginRequest.mockReturnValue(true)
  mocks.extractDocxText.mockResolvedValue(SYNTHETIC_TEXT)
  mocks.isNvidiaConfigured.mockReturnValue(false)
  mocks.extractCvWithNvidia.mockResolvedValue(null)
})

describe('POST /api/cv-import/extract', () => {
  it('rejects unauthenticated requests', async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ file: docxFile() }))
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('rejects free users before reading the file', async () => {
    mocks.getEntitlements.mockResolvedValueOnce({ state: 'NONE', isFree: true })
    const response = await POST(makeRequest({ file: docxFile() }))
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({ code: 'SUBSCRIPTION_REQUIRED' })
    expect(mocks.extractDocxText).not.toHaveBeenCalled()
  })

  it('rejects cross-site requests', async () => {
    mocks.isSameOriginRequest.mockReturnValueOnce(false)
    const response = await POST(makeRequest({ file: docxFile() }))
    expect(response.status).toBe(403)
  })

  it('requires acknowledgment before processing', async () => {
    const response = await POST(makeRequest({ acknowledged: false, file: docxFile() }))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ code: 'CONSENT_REQUIRED' })
    expect(mocks.extractDocxText).not.toHaveBeenCalled()
  })

  it('rejects unsupported file content', async () => {
    const file = new File([Buffer.from('<html>not a cv</html>')], 'cv.html', { type: 'text/html' })
    const response = await POST(makeRequest({ file }))
    expect(response.status).toBe(415)
    await expect(response.json()).resolves.toMatchObject({ code: 'UNSUPPORTED_FILE_TYPE' })
  })

  it('enforces the rate limit', async () => {
    mocks.checkRateLimit.mockResolvedValueOnce({ allowed: false, remaining: 0, resetAfterMs: 120000 })
    const response = await POST(makeRequest({ file: docxFile() }))
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBeTruthy()
  })

  it('rejects oversized files before extraction', async () => {
    const file = new File([Buffer.alloc(4 * 1024 * 1024 + 1)], 'big.pdf', { type: 'application/pdf' })
    const response = await POST(makeRequest({ file }))
    expect(response.status).toBe(413)
    await expect(response.json()).resolves.toMatchObject({ code: 'FILE_TOO_LARGE' })
    expect(mocks.extractDocxText).not.toHaveBeenCalled()
  })

  it('filters unsupported AI suggestions and falls back to local when AI is unavailable', async () => {
    mocks.isNvidiaConfigured.mockReturnValueOnce(true)
    mocks.extractCvWithNvidia.mockResolvedValueOnce({
      displayName: 'AI Name',
      skillGroups: [{ name: 'Tools', skills: ['Kubernetes'] }],
    })

    const response = await POST(makeRequest({ file: docxFile() }))
    expect(response.status).toBe(200)
    const body = await response.json() as {
      suggestions: {
        displayName: { value: string }
        professionalTitle: { value: string }
        skillGroups: Array<{ name: string; skills: string[] }>
        warnings: string[]
      }
    }
    expect(body.suggestions.displayName.value).toBe('John Doe')
    expect(body.suggestions.professionalTitle.value).toBe('Software Engineer')
    expect(JSON.stringify(body)).not.toContain('Kubernetes')
    expect(body.suggestions.warnings).toContain('AI_OUTPUT_FILTERED')
    expect(mocks.extractCvWithNvidia).toHaveBeenCalledTimes(1)

    mocks.isNvidiaConfigured.mockReturnValueOnce(true)
    mocks.extractCvWithNvidia.mockResolvedValueOnce(null)
    const fallback = await POST(makeRequest({ file: docxFile() }))
    expect(fallback.status).toBe(200)
    const fallbackBody = await fallback.json() as { suggestions: { displayName: { value: string } } }
    expect(fallbackBody.suggestions.displayName.value).toBe('John Doe')
  })

  it('returns structured suggestions only, with no-store headers and no raw text', async () => {
    const response = await POST(makeRequest({ file: docxFile() }))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('no-store')
    const body = await response.json() as {
      suggestions: {
        displayName: { value: string }
        professionalTitle: { value: string }
        skillGroups: Array<{ name: string; skills: string[] }>
        experience: unknown[]
      }
      text?: unknown
      rawText?: unknown
    }
    expect(body.suggestions.displayName.value).toBe('John Doe')
    expect(body.suggestions.professionalTitle.value).toBe('Software Engineer')
    expect(body.suggestions.skillGroups[0]).toMatchObject({
      name: 'Other Skills',
      skills: expect.arrayContaining(['JavaScript', 'React']),
    })
    expect(body.suggestions.experience.length).toBeGreaterThan(0)
    expect(body.text).toBeUndefined()
    expect(body.rawText).toBeUndefined()
    expect(mocks.extractCvWithNvidia).not.toHaveBeenCalled()
  })
})
