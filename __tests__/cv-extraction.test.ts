import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { extractDocxText } from '@/lib/cv-import/extract-docx'
import { extractPdfText } from '@/lib/cv-import/extract-pdf'
import { extractLocalCvSuggestions } from '@/lib/cv-import/local-extractor'
import { normalizeCvText } from '@/lib/cv-import/normalize'

const FIXTURES = path.join(__dirname, 'fixtures')

describe('CV text extraction', () => {
  it('extracts readable text from the synthetic DOCX', async () => {
    const text = await extractDocxText(fs.readFileSync(path.join(FIXTURES, 'synthetic-cv.docx')))
    expect(text).toContain('John Doe')
    expect(text).toContain('Professional Summary')
    expect(text).toContain('BSc Computer Science')
  })

  it('extracts readable text from the synthetic PDF', async () => {
    const result = await extractPdfText(fs.readFileSync(path.join(FIXTURES, 'synthetic-cv.pdf')))
    expect(result.pages).toBe(1)
    expect(result.text).toContain('John Doe')
    expect(result.text).toContain('Senior Software Engineer')
    expect(result.text).toContain('JavaScript')
  })

  it('produces professional suggestions from extracted DOCX text', async () => {
    const raw = await extractDocxText(fs.readFileSync(path.join(FIXTURES, 'synthetic-cv.docx')))
    const normalized = normalizeCvText(raw)
    const suggestions = extractLocalCvSuggestions(normalized.text, { truncated: normalized.truncated })

    expect(suggestions.displayName?.value).toBe('John Doe')
    expect(suggestions.professionalTitle?.value).toBe('Software Engineer')
    expect(suggestions.location?.value).toBe('Cairo, Egypt')
    expect(suggestions.bio?.value).toContain('six years')
    expect(suggestions.skillGroups[0].name).toBe('Other Skills')
    expect(suggestions.skillGroups[0].skills).toContain('React')
    expect(suggestions.experience.length).toBeGreaterThanOrEqual(2)
    expect(suggestions.experience[0].jobTitle).toBe('Senior Software Engineer')
    expect(suggestions.experience[0].isCurrent).toBe(true)
    expect(suggestions.experience[0].description).toContain('Built React')
    expect(suggestions.education[0].institution).toBe('Cairo University')
  })
})
