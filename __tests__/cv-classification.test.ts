import { describe, expect, it } from 'vitest'
import { extractLocalCvSuggestions } from '@/lib/cv-import/local-extractor'
import { filterAiFieldsToCv } from '@/lib/cv-import/support'

/**
 * PortfolioHub profile fields used by the CV importer:
 * - skills      → groups of skill names
 * - experience  → jobTitle / companyName / location / dates / description
 * - education   → title / institution / date / description
 * - bio         → profile summary text
 * Projects live in `ProjectPage` rows and are not created by the importer,
 * so a project must never become a skill or a job.
 */
const CV = `Jane Doe
Frontend Developer
Cairo, Egypt

Summary
Frontend developer focused on design systems and accessible interfaces.

Experience
Senior Frontend Developer | Acme Corp | Jan 2020 - Present
Led the migration of the design system and shipped an internal tool.

Skills
Technical Skills: TypeScript, React
Tools: Git, Figma

Projects
E-commerce Platform
Built a storefront with Next.js and Stripe.
Tools: React, Next.js, Stripe

Education
BSc Computer Science | Cairo University | 2013 - 2017`

const ARABIC_CV = `أحمد علي
مطور واجهات أمامية
القاهرة، مصر

الملخص
مطور واجهات أمامية يهتم بأنظمة التصميم.

الخبرات
مطور واجهات أمامية | شركة أكمي | يناير 2020 - حتى الآن
تطوير نظام التصميم.

المهارات
المهارات التقنية: TypeScript, React`

const ARABIC_CV_WITH_PROJECT = `أحمد علي
مطور واجهات أمامية
القاهرة، مصر

الخبرات
مطور واجهات أمامية | شركة أكمي | يناير 2020 - حتى الآن
تطوير نظام التصميم.

المشاريع
مشروع المتجر الإلكتروني
بناء متجر باستخدام Next.js و Stripe.

المهارات
المهارات التقنية: TypeScript, React`

function skillNames(groups: { name: string; skills: string[] }[]): string[] {
  return groups.flatMap((group) => group.skills)
}

describe('CV field classification', () => {
  it('does not turn a project into work experience or general skills', () => {
    const result = extractLocalCvSuggestions(CV)

    expect(result.experience).toHaveLength(1)
    expect(result.experience[0]).toMatchObject({
      jobTitle: 'Senior Frontend Developer',
      companyName: 'Acme Corp',
      startDate: 'Jan 2020',
      endDate: 'Present',
    })

    expect(skillNames(result.skillGroups)).not.toContain('Next.js')
    expect(skillNames(result.skillGroups)).not.toContain('Stripe')
    expect(JSON.stringify(result)).not.toContain('E-commerce Platform')
    expect(JSON.stringify(result)).not.toContain('Built a storefront')
  })

  it('keeps a clearly listed skill in Skills', () => {
    const result = extractLocalCvSuggestions(CV)

    expect(result.skillGroups).toEqual([
      { name: 'Technical Skills', skills: ['TypeScript', 'React'] },
      { name: 'Tools', skills: ['Git', 'Figma'] },
    ])
  })

  it('keeps a clearly stated employment role in Experience', () => {
    const result = extractLocalCvSuggestions(CV)

    expect(result.experience[0].jobTitle).toBe('Senior Frontend Developer')
    expect(result.experience[0].companyName).toBe('Acme Corp')
    expect(result.experience[0].description).toContain('Led the migration of the design system')
  })

  it('omits project entries with a projects-not-supported warning', () => {
    const result = extractLocalCvSuggestions(CV)

    expect(result.warnings).toContain('PROJECTS_NOT_SUPPORTED')
    expect(result.experience.map((item) => item.jobTitle)).not.toContain('E-commerce Platform')
    expect(skillNames(result.skillGroups)).not.toContain('Next.js')
  })

  it('keeps an Arabic project out of experience and skills', () => {
    const result = extractLocalCvSuggestions(ARABIC_CV_WITH_PROJECT)

    expect(result.experience).toHaveLength(1)
    expect(result.experience[0].jobTitle).toBe('مطور واجهات أمامية')
    expect(skillNames(result.skillGroups)).toEqual(['TypeScript', 'React'])
    expect(result.warnings).toContain('PROJECTS_NOT_SUPPORTED')
  })

  it('omits an ambiguous entry instead of reassigning it', () => {
    const result = extractLocalCvSuggestions(`Jane Doe
Product Designer

Experience
Product Designer
Redesigned the client catalogue.`)

    expect(result.experience).toEqual([])
    expect(result.warnings).toContain('AMBIGUOUS_CONTENT_OMITTED')
  })

  it('omits a duty sentence listed under Skills', () => {
    const result = extractLocalCvSuggestions(`Jane Doe
Product Designer

Skills
Managed a team of four engineers`)

    expect(skillNames(result.skillGroups)).toEqual([])
    expect(result.experience).toEqual([])
  })

  it('preserves the original wording and language', () => {
    const result = extractLocalCvSuggestions(ARABIC_CV)

    expect(result.language).toBe('ar')
    expect(result.displayName?.value).toBe('أحمد علي')
    expect(result.professionalTitle?.value).toBe('مطور واجهات أمامية')
    expect(result.bio?.value).toContain('أنظمة التصميم')
    expect(result.experience[0]).toMatchObject({
      jobTitle: 'مطور واجهات أمامية',
      companyName: 'شركة أكمي',
      startDate: 'يناير 2020',
      endDate: 'حتى الآن',
    })
    expect(result.skillGroups).toEqual([
      { name: 'المهارات التقنية', skills: ['TypeScript', 'React'] },
    ])
  })

  it('applies the same category rules to AI output', () => {
    const result = filterAiFieldsToCv({
      displayName: 'Jane Doe',
      professionalTitle: 'Frontend Developer',
      location: 'Cairo, Egypt',
      bio: 'Frontend developer focused on design systems and accessible interfaces.',
      skillGroups: [
        { name: 'Technical Skills', skills: ['TypeScript', 'React'] },
        { name: 'Web', skills: ['Next.js', 'Stripe'] },
      ],
      experience: [
        {
          jobTitle: 'Senior Frontend Developer',
          companyName: 'Acme Corp',
          location: '',
          startDate: 'Jan 2020',
          endDate: 'Present',
          isCurrent: true,
          description: 'Led the migration of the design system and shipped an internal tool.',
        },
        {
          jobTitle: 'E-commerce Platform',
          companyName: 'Acme Corp',
          location: '',
          startDate: '2021',
          endDate: '',
          isCurrent: false,
          description: 'Built a storefront with Next.js and Stripe.',
        },
      ],
      education: [
        {
          title: 'BSc Computer Science',
          institution: 'Cairo University',
          date: '2013 - 2017',
          description: '',
        },
      ],
    }, CV)

    expect(result.filtered).toBe(true)
    expect(result.fields.skillGroups).toEqual([
      { name: 'Technical Skills', skills: ['TypeScript', 'React'] },
    ])
    expect(result.fields.experience).toHaveLength(1)
    expect(result.fields.experience?.[0].jobTitle).toBe('Senior Frontend Developer')
    expect(result.fields.education).toHaveLength(1)
    expect(result.fields.education?.[0].institution).toBe('Cairo University')
  })

  it('drops an AI employer that the CV never states', () => {
    const result = filterAiFieldsToCv({
      experience: [{
        jobTitle: 'Senior Frontend Developer',
        companyName: 'Globex',
        location: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
      }],
    }, CV)

    expect(result.filtered).toBe(true)
    expect(result.fields.experience).toBeUndefined()
  })

  it('drops an AI education entry that is not an education entry', () => {
    const result = filterAiFieldsToCv({
      education: [{
        title: 'E-commerce Platform',
        institution: 'Acme Corp',
        date: '2021',
        description: '',
      }],
    }, CV)

    expect(result.filtered).toBe(true)
    expect(result.fields.education).toBeUndefined()
  })

  it('gives the AI and the local fallback the same classification result', () => {
    const local = extractLocalCvSuggestions(CV)
    const ai = filterAiFieldsToCv({
      skillGroups: [
        { name: 'Technical Skills', skills: ['TypeScript', 'React'] },
        { name: 'Tools', skills: ['Git', 'Figma'] },
      ],
      experience: [{
        jobTitle: 'Senior Frontend Developer',
        companyName: 'Acme Corp',
        location: '',
        startDate: 'Jan 2020',
        endDate: 'Present',
        isCurrent: true,
        description: 'Led the migration of the design system and shipped an internal tool.',
      }],
      education: [{
        title: 'BSc Computer Science',
        institution: 'Cairo University',
        date: '2013 - 2017',
        description: '',
      }],
    }, CV)

    expect(ai.fields.skillGroups).toEqual(local.skillGroups)
    expect(ai.fields.experience).toEqual(local.experience)
    expect(ai.fields.education).toEqual(local.education)
  })

  it('does not copy a work-history role into the profile title', () => {
    const result = filterAiFieldsToCv({
      professionalTitle: 'Senior Frontend Developer',
      location: 'Cairo, Egypt',
    }, CV)

    expect(result.filtered).toBe(true)
    expect(result.fields.professionalTitle).toBeUndefined()
    expect(result.fields.location).toBe('Cairo, Egypt')
  })

  it('never invents facts that the CV does not contain', () => {
    const result = filterAiFieldsToCv({
      professionalTitle: 'Lead Frontend Architect',
      location: 'Berlin, Germany',
      skillGroups: [{ name: 'Technical Skills', skills: ['Kubernetes'] }],
    }, CV)

    expect(result.fields.professionalTitle).toBeUndefined()
    expect(result.fields.location).toBeUndefined()
    expect(result.fields.skillGroups).toBeUndefined()
  })
})
