import { describe, expect, it } from 'vitest'
import { extractLocalCvSuggestions } from '@/lib/cv-import/local-extractor'

const ENGLISH_CV = `John Doe
Software Engineer
Cairo, Egypt
john@example.test | +20 100 123 4567

Professional Summary
Software engineer with six years of experience building web applications and leading small teams.

Work Experience
Senior Software Engineer | Acme Corp | Jan 2020 - Present
Built React and Node.js products.
Led a team of four engineers.

Software Engineer | Beta Ltd | 2017 - 2019
Developed internal tools.

Education
BSc Computer Science | Cairo University | 2013 - 2017

Skills
JavaScript, TypeScript, React, Node.js, PostgreSQL

Certifications
AWS Certified Developer`

const ARABIC_CV = `أحمد علي
مطور برمجيات
القاهرة، مصر
ahmed@example.test

الملخص
مطور برمجيات بخبرة ست سنوات في بناء تطبيقات الويب.

الخبرات
مطور أول | شركة أكمي | يناير 2020 - حتى الآن
تطوير تطبيقات ويب.
مطور برمجيات | شركة بيتا | 2017 - 2019
تطوير أدوات داخلية.

التعليم
بكالوريوس علوم الحاسب | جامعة القاهرة | 2013 - 2017

المهارات
JavaScript، TypeScript، React، Node.js`

describe('local CV extraction', () => {
  it('extracts professional fields from an English CV', () => {
    const result = extractLocalCvSuggestions(ENGLISH_CV)

    expect(result.displayName).toMatchObject({ value: 'John Doe', language: 'en' })
    expect(result.professionalTitle).toMatchObject({ value: 'Software Engineer', language: 'en' })
    expect(result.location).toMatchObject({ value: 'Cairo, Egypt' })
    expect(result.bio?.value).toContain('six years')
    expect(result.skillGroups).toHaveLength(1)
    expect(result.skillGroups[0].name).toBe('Other Skills')
    expect(result.skillGroups[0].skills).toEqual(expect.arrayContaining(['JavaScript', 'React', 'Node.js']))
    expect(result.skillGroups[0].skills).not.toContain('AWS Certified Developer')
    expect(result.experience).toHaveLength(2)
    expect(result.experience[0]).toMatchObject({
      jobTitle: 'Senior Software Engineer',
      companyName: 'Acme Corp',
      startDate: 'Jan 2020',
      isCurrent: true,
    })
    expect(result.experience[0].endDate).toBe('Present')
    expect(result.experience[1].startDate).toBe('2017')
    expect(result.education[0]).toMatchObject({
      title: 'BSc Computer Science',
      institution: 'Cairo University',
      date: '2013 - 2017',
    })
  })

  it('extracts Arabic fields and Arabic comma-separated skills', () => {
    const result = extractLocalCvSuggestions(ARABIC_CV)

    expect(result.language).toBe('ar')
    expect(result.displayName?.value).toBe('أحمد علي')
    expect(result.professionalTitle?.value).toBe('مطور برمجيات')
    expect(result.location?.value).toBe('القاهرة، مصر')
    expect(result.skillGroups).toHaveLength(1)
    expect(result.skillGroups[0].name).toBe('مهارات أخرى')
    expect(result.skillGroups[0].skills).toEqual(expect.arrayContaining(['JavaScript', 'TypeScript', 'React']))
    expect(result.experience[0]).toMatchObject({
      jobTitle: 'مطور أول',
      companyName: 'شركة أكمي',
      startDate: 'يناير 2020',
      isCurrent: true,
    })
    expect(result.experience[0].endDate).toBe('حتى الآن')
    expect(result.education[0].institution).toBe('جامعة القاهرة')
  })

  it('preserves YYYY-MM date ranges as written', () => {
    const result = extractLocalCvSuggestions(`Jane Doe
Product Designer

Experience
Product Designer | Studio One | 2020-01 - 2022-03
Designed products.`)
    expect(result.experience[0].startDate).toBe('2020-01')
    expect(result.experience[0].endDate).toBe('2022-03')
    expect(result.experience[0].isCurrent).toBe(false)
  })

  it('groups fragmented DOCX-style experience lines into roles', () => {
    const result = extractLocalCvSuggestions(`Jane Doe
Product Designer

Experience

Senior Product Designer

Studio One

Jan 2020 - Present

Designed the core product.

Led a team of three designers.

Product Designer

Beta Studio

2017 - 2019

Built the design system.

Education

BSc Computer Science

Cairo University

2013 - 2017`)

    expect(result.experience).toHaveLength(2)
    expect(result.experience[0]).toMatchObject({
      jobTitle: 'Senior Product Designer',
      companyName: 'Studio One',
      startDate: 'Jan 2020',
      isCurrent: true,
    })
    expect(result.experience[0].description).toContain('Designed the core product')
    expect(result.experience[1]).toMatchObject({
      jobTitle: 'Product Designer',
      companyName: 'Beta Studio',
      startDate: '2017',
      endDate: '2019',
    })
    expect(result.education).toHaveLength(1)
    expect(result.education[0]).toMatchObject({
      title: 'BSc Computer Science',
      institution: 'Cairo University',
      date: '2013 - 2017',
    })
  })

  it('does not turn prose dates into invented employment ranges', () => {
    const result = extractLocalCvSuggestions(`Jane Doe
Product Designer

Experience
Product Designer | Studio One
Managed a 2020 redesign and 2023 research program.`)
    expect(result.experience).toHaveLength(1)
    expect(result.experience[0].startDate).toBe('')
    expect(result.experience[0].endDate).toBe('')
    expect(result.warnings).toContain('DATES_NEED_REVIEW')
  })

  it('omits an entry without dates, employer, or employment cue', () => {
    const result = extractLocalCvSuggestions(`Jane Doe
Product Designer

Experience
Product Designer
Redesigned the client catalogue.`)
    expect(result.experience).toHaveLength(0)
    expect(result.warnings).toContain('AMBIGUOUS_CONTENT_OMITTED')
  })

  it('keeps a role with an explicit employer cue even without dates', () => {
    const result = extractLocalCvSuggestions(`Jane Doe
Product Designer

Experience
Product Designer at Studio One
Redesigned the client catalogue.`)
    expect(result.experience).toHaveLength(1)
    expect(result.experience[0]).toMatchObject({
      jobTitle: 'Product Designer',
      companyName: 'Studio One',
      startDate: '',
    })
  })

  it('groups skills only from explicit category evidence', () => {
    const result = extractLocalCvSuggestions(`Jane Doe
Product Marketer

Skills
Technical Skills: JavaScript, React
Tools: Git, Docker
Languages: Arabic, English
Marketing Skills: SEO, Google Ads`)

    expect(result.skillGroups).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Technical Skills', skills: ['JavaScript', 'React'] }),
      expect.objectContaining({ name: 'Tools', skills: ['Git', 'Docker'] }),
      expect.objectContaining({ name: 'Languages', skills: ['Arabic', 'English'] }),
      expect.objectContaining({ name: 'Marketing Skills', skills: ['SEO', 'Google Ads'] }),
    ]))
    expect(result.skillGroups).toHaveLength(4)
  })

  it('groups Arabic skills from explicit category headings', () => {
    const result = extractLocalCvSuggestions(`أحمد علي
مطور

المهارات
المهارات التقنية: JavaScript, React
الأدوات: Git, Docker
اللغات: العربية، الإنجليزية`)

    expect(result.skillGroups).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'المهارات التقنية', skills: ['JavaScript', 'React'] }),
      expect.objectContaining({ name: 'الأدوات', skills: ['Git', 'Docker'] }),
      expect.objectContaining({ name: 'اللغات', skills: ['العربية', 'الإنجليزية'] }),
    ]))
  })

  it('uses a general group when no category evidence exists', () => {
    const result = extractLocalCvSuggestions(`Jane Doe
Product Designer

Skills
JavaScript, React, Communication`)
    expect(result.skillGroups).toHaveLength(1)
    expect(result.skillGroups[0]).toMatchObject({
      name: 'Other Skills',
      skills: ['JavaScript', 'React', 'Communication'],
    })
  })

  it('deduplicates a skill across groups while preserving its first group', () => {
    const result = extractLocalCvSuggestions(`Jane Doe
Engineer

Skills
Tools: Git, JavaScript
Technical Skills: JavaScript, React`)

    expect(result.skillGroups).toEqual([
      { name: 'Tools', skills: ['Git', 'JavaScript'] },
      { name: 'Technical Skills', skills: ['React'] },
    ])
  })

  it('keeps every skill when categories exceed the group limit', () => {
    const categories = Array.from({ length: 11 }, (_, index) => `Category ${index + 1}: Skill ${index + 1}`)
    const result = extractLocalCvSuggestions(`Jane Doe
Engineer

Skills
${categories.join('\n')}`)

    expect(result.skillGroups.length).toBeLessThanOrEqual(10)
    expect(result.skillGroups.some((group) => group.name === 'Other Skills')).toBe(true)
    const names = result.skillGroups.flatMap((group) => group.skills)
    expect(names).toHaveLength(11)
    expect(new Set(names).size).toBe(11)
  })

  it('strips markup from suggested text and ignores sensitive attributes', () => {
    const result = extractLocalCvSuggestions(`Jane Doe
Product Designer

Summary
<script>alert(1)</script> Designer with 8 years of experience.
Date of birth: 1990-01-01
Nationality: Example`)

    expect(result.bio?.value || '').not.toContain('<')
    expect(result.bio?.value || '').not.toContain('>')
    expect(JSON.stringify(result)).not.toContain('1990-01-01')
    expect(JSON.stringify(result)).not.toContain('Nationality')
  })

  it('returns no scalar suggestions when the document is empty or unrecognizable', () => {
    const result = extractLocalCvSuggestions('   ')
    expect(result.displayName).toBeNull()
    expect(result.professionalTitle).toBeNull()
    expect(result.experience).toEqual([])
    expect(result.education).toEqual([])
  })
})
