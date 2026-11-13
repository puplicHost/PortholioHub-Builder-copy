import { describe, expect, it } from 'vitest'
import { mergeCvSuggestions } from '@/lib/cv-import/merge'
import type { CvSuggestions } from '@/lib/cv-import/types'

const local: CvSuggestions = {
  displayName: { value: 'Local Name', language: 'en' },
  professionalTitle: { value: 'Local Title', language: 'en' },
  location: { value: 'Cairo, Egypt', language: 'en' },
  bio: { value: 'Local bio', language: 'en' },
  skillGroups: [{ name: 'Other Skills', skills: ['Local Skill'] }],
  experience: [{
    jobTitle: 'Local Role',
    companyName: 'Local Co',
    location: '',
    startDate: '2020-01',
    endDate: '',
    isCurrent: true,
    description: '',
  }],
  education: [{
    title: 'Local Degree',
    institution: 'Local University',
    date: '2015',
    description: '',
  }],
  language: 'en',
  warnings: ['DATES_NEED_REVIEW'],
}

describe('CV suggestion merge', () => {
  it('uses AI values where present and fills missing fields from local rules', () => {
    const merged = mergeCvSuggestions(local, {
      displayName: 'AI Name',
      skillGroups: [{ name: 'Tools', skills: ['AI Skill'] }],
    })

    expect(merged.displayName?.value).toBe('AI Name')
    expect(merged.professionalTitle?.value).toBe('Local Title')
    expect(merged.location?.value).toBe('Cairo, Egypt')
    expect(merged.bio?.value).toBe('Local bio')
    expect(merged.skillGroups).toEqual([{ name: 'Tools', skills: ['AI Skill'] }])
    expect(merged.experience[0].jobTitle).toBe('Local Role')
    expect(merged.education[0].title).toBe('Local Degree')
    expect(merged.warnings).toEqual(['DATES_NEED_REVIEW'])
  })

  it('falls back to local skill groups when AI returns none', () => {
    const merged = mergeCvSuggestions(local, { displayName: 'AI Name', skillGroups: [] })
    expect(merged.skillGroups).toEqual([{ name: 'Other Skills', skills: ['Local Skill'] }])
  })

  it('returns local suggestions unchanged when AI is unavailable', () => {
    expect(mergeCvSuggestions(local, null)).toBe(local)
  })
})
