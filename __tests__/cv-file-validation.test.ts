import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MAX_CV_FILE_BYTES,
  inspectDocxZip,
  validateCvFile,
} from '@/lib/cv-import/file-validation'

const FIXTURES = path.join(__dirname, 'fixtures')
const docx = fs.readFileSync(path.join(FIXTURES, 'synthetic-cv.docx'))
const pdf = fs.readFileSync(path.join(FIXTURES, 'synthetic-cv.pdf'))
const oversizedDocx = fs.readFileSync(path.join(FIXTURES, 'oversized-docx.docx'))

describe('CV file validation', () => {
  it('accepts a valid synthetic DOCX and PDF', () => {
    expect(validateCvFile(
      docx,
      'synthetic-cv.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )).toEqual({ ok: true, kind: 'docx' })
    expect(validateCvFile(pdf, 'synthetic-cv.pdf', 'application/pdf')).toEqual({ ok: true, kind: 'pdf' })
  })

  it('rejects empty and oversized files', () => {
    expect(validateCvFile(Buffer.alloc(0), 'empty.pdf', 'application/pdf')).toEqual({
      ok: false,
      code: 'FILE_EMPTY',
    })
    expect(validateCvFile(Buffer.alloc(MAX_CV_FILE_BYTES + 1), 'big.pdf', 'application/pdf')).toEqual({
      ok: false,
      code: 'FILE_TOO_LARGE',
    })
  })

  it('rejects legacy .doc and macro documents', () => {
    const ole = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00])
    expect(validateCvFile(ole, 'old.doc', 'application/msword')).toEqual({
      ok: false,
      code: 'LEGACY_DOC',
    })
    expect(validateCvFile(pdf, 'cv.docm', 'application/octet-stream')).toEqual({
      ok: false,
      code: 'LEGACY_DOC',
    })
  })

  it('rejects unsupported content and mismatched extensions', () => {
    expect(validateCvFile(Buffer.from('<html>not a cv</html>'), 'cv.html', 'text/html')).toEqual({
      ok: false,
      code: 'UNSUPPORTED_FILE_TYPE',
    })
    expect(validateCvFile(pdf, 'cv.docx', 'application/pdf')).toEqual({
      ok: false,
      code: 'UNSUPPORTED_FILE_TYPE',
    })
  })

  it('rejects malformed DOCX archives and DOCX zip bombs', () => {
    expect(validateCvFile(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0]), 'broken.docx', 'application/zip')).toEqual({
      ok: false,
      code: 'MALFORMED_FILE',
    })
    expect(inspectDocxZip(oversizedDocx)).toEqual({
      ok: false,
      code: 'DOCX_TOO_LARGE',
    })
    expect(validateCvFile(
      oversizedDocx,
      'oversized-docx.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )).toEqual({ ok: false, code: 'DOCX_TOO_LARGE' })
  })
})
