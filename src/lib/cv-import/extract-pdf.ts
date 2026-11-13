import { extractText, getDocumentProxy } from 'unpdf'
import { CvExtractionError } from './errors'

export const MAX_PDF_PAGES = 20

export async function extractPdfText(buffer: Buffer): Promise<{ text: string; pages: number }> {
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>> | null = null
  try {
    pdf = await getDocumentProxy(new Uint8Array(buffer))

    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new CvExtractionError('PDF_TOO_MANY_PAGES')
    }

    const result = await extractText(pdf, { mergePages: true })
    const text = Array.isArray(result.text) ? result.text.join('\n') : result.text
    return { text: text || '', pages: result.totalPages }
  } catch (error) {
    if (error instanceof CvExtractionError) throw error
    const name = (error as { name?: string })?.name || ''
    if (/password/i.test(name) || /password/i.test((error as Error)?.message || '')) {
      throw new CvExtractionError('PDF_ENCRYPTED')
    }
    throw new CvExtractionError('PDF_UNREADABLE')
  } finally {
    try {
      await (pdf as unknown as { destroy?: () => Promise<void> })?.destroy?.()
    } catch {
      /* best-effort cleanup */
    }
  }
}
