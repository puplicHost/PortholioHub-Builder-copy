import mammoth from 'mammoth'
import { CvExtractionError } from './errors'

export async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return typeof result?.value === 'string' ? result.value : ''
  } catch {
    throw new CvExtractionError('DOCX_UNREADABLE')
  }
}
