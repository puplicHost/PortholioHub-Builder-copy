import { describe, expect, it } from 'vitest'
import { filterAiFieldsToCv } from '@/lib/cv-import/support'

const CV = `John Doe
Software Engineer
Cairo, Egypt

Summary
Software engineer with six years of experience.

Skills
Technical Skills: JavaScript, React, Node.js
Tools: Git, Docker

Experience
Senior Software Engineer | Acme Corp | Jan 2020 - Present
Built React products.

Education
BSc Computer Science, Cairo University`

describe('AI extraction support guard', () => {
  it('preserves original wording and language for supported values', () => {
    const result = filterAiFieldsToCv({
      displayName: 'john doe',
      professionalTitle: 'software engineer',
      location: 'Cairo, Egypt',
      bio: 'Software engineer with six years of experience.',
      skillGroups: [{
        name: 'technical skills',
        skills: ['react', 'Node.js'],
      }],
    }, CV)

    expect(result.filtered).toBe(false)
    expect(result.fields.displayName).toBe('John Doe')
    expect(result.fields.professionalTitle).toBe('Software Engineer')
    expect(result.fields.bio).toBe('Software engineer with six years of experience.')
    expect(result.fields.skillGroups).toEqual([
      { name: 'Technical Skills', skills: ['React', 'Node.js'] },
    ])
  })

  it('drops unsupported facts, paraphrases, translations, and typo-like variants', () => {
    const result = filterAiFieldsToCv({
      displayName: 'John Smith',
      professionalTitle: 'Lead Software Engineer',
      bio: 'Experienced engineer who builds modern web apps.',
      skillGroups: [{ name: 'Technical Skills', skills: ['Kubernetes', 'React'] }],
      experience: [{
        jobTitle: 'Lead Software Engineer',
        companyName: 'Acme Corp',
        location: '',
        startDate: '2020-01',
        endDate: '2022-01',
        isCurrent: false,
        description: 'Developed web applications.',
      }],
      education: [{
        title: 'MSc Computer Science',
        institution: 'Cairo University',
        date: '2015',
        description: '',
      }],
    }, CV)

    expect(result.filtered).toBe(true)
    expect(result.fields.displayName).toBeUndefined()
    expect(result.fields.professionalTitle).toBeUndefined()
    expect(result.fields.bio).toBeUndefined()
    expect(result.fields.skillGroups).toEqual([
      { name: 'Technical Skills', skills: ['React'] },
    ])
    expect(result.fields.experience).toBeUndefined()
    expect(result.fields.education).toBeUndefined()
  })

  it('uses the CV explicit category instead of an unsupported AI category', () => {
    const result = filterAiFieldsToCv({
      skillGroups: [
        { name: 'Cloud Platforms', skills: ['Docker', 'AWS'] },
        { name: 'Tools', skills: ['Git', 'Docker'] },
      ],
    }, CV)

    expect(result.filtered).toBe(true)
    expect(result.fields.skillGroups).toEqual([
      { name: 'Tools', skills: ['Docker', 'Git'] },
    ])
  })

  it('does not accept translations or typo-like variants', () => {
    const result = filterAiFieldsToCv({
      displayName: 'Jon Doe',
      professionalTitle: 'مهندس برمجيات',
      skillGroups: [{ name: 'Technical Skills', skills: ['Java Script'] }],
    }, CV)

    expect(result.filtered).toBe(true)
    expect(result.fields.displayName).toBeUndefined()
    expect(result.fields.professionalTitle).toBeUndefined()
    expect(result.fields.skillGroups).toBeUndefined()
  })

  it('maps neutral AI categories to the Other Skills group when the CV has no category', () => {
    const result = filterAiFieldsToCv({
      skillGroups: [{ name: 'General Skills', skills: ['React'] }],
    }, `John Doe\nSkills\nReact`)

    expect(result.fields.skillGroups).toEqual([
      { name: 'Other Skills', skills: ['React'] },
    ])
  })

  it('rejects partial skill names such as Node from Node.js', () => {
    const result = filterAiFieldsToCv({
      skillGroups: [{ name: 'Technical Skills', skills: ['Node'] }],
    }, CV)

    expect(result.filtered).toBe(true)
    expect(result.fields.skillGroups).toBeUndefined()
  })

  it('supports exact dates and rejects reformatted dates', () => {
    const result = filterAiFieldsToCv({
      experience: [
        {
          jobTitle: 'Senior Software Engineer',
          companyName: 'Acme Corp',
          location: '',
          startDate: 'Jan 2020',
          endDate: 'Present',
          isCurrent: true,
          description: 'Built React products.',
        },
        {
          jobTitle: 'Senior Software Engineer',
          companyName: 'Acme Corp',
          location: '',
          startDate: '2020-01',
          endDate: '2022-01',
          isCurrent: false,
          description: '',
        },
      ],
    }, CV)

    expect(result.filtered).toBe(true)
    expect(result.fields.experience).toHaveLength(2)
    expect(result.fields.experience?.[0]).toMatchObject({
      startDate: 'Jan 2020',
      endDate: 'Present',
      description: 'Built React products.',
    })
    expect(result.fields.experience?.[1]).toMatchObject({
      startDate: '',
      endDate: '',
    })
  })

  it('does not accept a summary line as the whole bio', () => {
    const result = filterAiFieldsToCv({
      bio: 'Software engineer with six years',
    }, CV)
    expect(result.fields.bio).toBeUndefined()
    expect(result.filtered).toBe(true)
  })
})
