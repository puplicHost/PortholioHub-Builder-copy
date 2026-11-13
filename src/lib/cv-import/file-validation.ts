import type {
  CvFileKind,
  CvFileValidationResult,
} from './types'

export const MAX_CV_FILE_BYTES = 4 * 1024 * 1024
export const MAX_DOCX_UNCOMPRESSED_BYTES = 25 * 1024 * 1024
export const MAX_DOCX_ENTRIES = 500

const OLE_MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04])
const ZIP_EOCD = Buffer.from([0x50, 0x4b, 0x05, 0x06])
const ZIP_CENTRAL = Buffer.from([0x50, 0x4b, 0x01, 0x02])

function extensionOf(filename: string): string {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/)
  return match?.[1] ?? ''
}

function isPdfMagic(buffer: Buffer): boolean {
  // PDF readers tolerate a small amount of junk before %PDF-; the header
  // itself must still appear near the start of the file.
  const head = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('latin1')
  return head.includes('%PDF-')
}

interface DocxInspection {
  ok: boolean
  code?: 'MALFORMED_FILE' | 'MACRO_DOCUMENT' | 'DOCX_TOO_LARGE'
}

/**
 * Minimal ZIP central-directory inspection. This is intentionally not a full
 * unzip implementation: it verifies that the file looks like a DOCX and caps
 * the declared uncompressed size before any parser inflates it.
 */
export function inspectDocxZip(buffer: Buffer): DocxInspection {
  const eocd = buffer.lastIndexOf(ZIP_EOCD)
  if (eocd < 0 || eocd + 22 > buffer.length) return { ok: false, code: 'MALFORMED_FILE' }

  const totalEntries = buffer.readUInt16LE(eocd + 10)
  const centralSize = buffer.readUInt32LE(eocd + 12)
  const centralOffset = buffer.readUInt32LE(eocd + 16)

  if (totalEntries === 0 || totalEntries > MAX_DOCX_ENTRIES) {
    return { ok: false, code: totalEntries > MAX_DOCX_ENTRIES ? 'DOCX_TOO_LARGE' : 'MALFORMED_FILE' }
  }
  if (centralOffset + centralSize > buffer.length || centralSize === 0) {
    return { ok: false, code: 'MALFORMED_FILE' }
  }

  let offset = centralOffset
  let uncompressedTotal = 0
  let hasContentTypes = false
  let hasDocument = false
  let hasMacros = false

  for (let index = 0; index < totalEntries; index += 1) {
    if (offset + 46 > buffer.length) return { ok: false, code: 'MALFORMED_FILE' }
    if (!buffer.subarray(offset, offset + 4).equals(ZIP_CENTRAL)) {
      return { ok: false, code: 'MALFORMED_FILE' }
    }

    const compressedSize = buffer.readUInt32LE(offset + 20)
    const uncompressedSize = buffer.readUInt32LE(offset + 24)
    const nameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)

    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      // ZIP64 is unnecessary for a CV and would bypass the size guard.
      return { ok: false, code: 'DOCX_TOO_LARGE' }
    }

    const nameStart = offset + 46
    const nameEnd = nameStart + nameLength
    if (nameEnd > buffer.length) return { ok: false, code: 'MALFORMED_FILE' }
    const name = buffer.subarray(nameStart, nameEnd).toString('utf8').toLowerCase()

    uncompressedTotal += uncompressedSize
    if (uncompressedTotal > MAX_DOCX_UNCOMPRESSED_BYTES) {
      return { ok: false, code: 'DOCX_TOO_LARGE' }
    }

    if (name === '[content_types].xml') hasContentTypes = true
    if (name === 'word/document.xml') hasDocument = true
    if (name === 'word/vbaproject.bin') hasMacros = true

    offset = nameEnd + extraLength + commentLength
  }

  if (hasMacros) return { ok: false, code: 'MACRO_DOCUMENT' }
  if (!hasContentTypes || !hasDocument) return { ok: false, code: 'MALFORMED_FILE' }
  return { ok: true }
}

export function validateCvFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): CvFileValidationResult {
  if (buffer.length === 0) return { ok: false, code: 'FILE_EMPTY' }
  if (buffer.length > MAX_CV_FILE_BYTES) return { ok: false, code: 'FILE_TOO_LARGE' }

  const extension = extensionOf(filename)
  const mime = (mimeType || '').toLowerCase()

  if (
    extension === 'doc' ||
    extension === 'docm' ||
    mime === 'application/msword' ||
    mime === 'application/vnd.ms-word.document.macroenabled.12' ||
    buffer.subarray(0, OLE_MAGIC.length).equals(OLE_MAGIC)
  ) {
    return { ok: false, code: 'LEGACY_DOC' }
  }

  if (isPdfMagic(buffer)) {
    if (extension && extension !== 'pdf') return { ok: false, code: 'UNSUPPORTED_FILE_TYPE' }
    return { ok: true, kind: 'pdf' }
  }

  if (buffer.subarray(0, ZIP_MAGIC.length).equals(ZIP_MAGIC)) {
    if (extension && extension !== 'docx') return { ok: false, code: 'UNSUPPORTED_FILE_TYPE' }
    const inspection = inspectDocxZip(buffer)
    if (!inspection.ok) {
      return {
        ok: false,
        code: inspection.code === 'DOCX_TOO_LARGE'
          ? 'DOCX_TOO_LARGE'
          : inspection.code === 'MACRO_DOCUMENT'
            ? 'MACRO_DOCUMENT'
            : 'MALFORMED_FILE',
      }
    }
    return { ok: true, kind: 'docx' as CvFileKind }
  }

  return { ok: false, code: 'UNSUPPORTED_FILE_TYPE' }
}

export function cvFileErrorMessage(code: string): string {
  switch (code) {
    case 'FILE_EMPTY':
      return 'The file is empty.'
    case 'FILE_TOO_LARGE':
      return 'The file is larger than 4 MB.'
    case 'LEGACY_DOC':
      return 'Please save the file as DOCX or PDF.'
    case 'MACRO_DOCUMENT':
      return 'Macro-enabled documents are not supported.'
    case 'DOCX_TOO_LARGE':
      return 'The document is too large to process safely.'
    case 'MALFORMED_FILE':
      return 'The file appears to be damaged or incomplete.'
    default:
      return 'Please upload a PDF or DOCX file.'
  }
}
