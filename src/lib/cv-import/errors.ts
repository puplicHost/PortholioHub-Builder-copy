export type CvExtractionErrorCode =
  | 'PDF_ENCRYPTED'
  | 'PDF_TOO_MANY_PAGES'
  | 'PDF_UNREADABLE'
  | 'DOCX_UNREADABLE'
  | 'NO_TEXT_FOUND'

export class CvExtractionError extends Error {
  readonly code: CvExtractionErrorCode
  readonly status = 422

  constructor(code: CvExtractionErrorCode, message = 'The file could not be read.') {
    super(message)
    this.name = 'CvExtractionError'
    this.code = code
  }
}
