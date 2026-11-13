import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { extractCvWithNvidia, isNvidiaConfigured } from '@/lib/cv-import/ai-provider'

const CV_TEXT = `John Doe
Software Engineer
john.doe@example.test
+20 100 123 4567

Professional Summary
Software engineer with six years of experience.
Work Experience
Senior Software Engineer | Acme Corp | Jan 2020 - Present
Skills
JavaScript, TypeScript, React`

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubEnv('NVIDIA_API_KEY', 'test-key-not-a-real-secret')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

function successfulResponse(payload: unknown) {
  return new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify(payload) } }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

describe('NVIDIA CV adapter', () => {
  it('is disabled when the key is absent', async () => {
    vi.stubEnv('NVIDIA_API_KEY', '')
    expect(isNvidiaConfigured()).toBe(false)
    await expect(extractCvWithNvidia(CV_TEXT)).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends only redacted text and returns validated fields', async () => {
    fetchMock.mockResolvedValue(successfulResponse({
      displayName: 'John Doe',
      professionalTitle: 'Software Engineer',
      location: 'Cairo, Egypt',
      bio: 'Software engineer with six years of experience.',
      skillGroups: [
        { name: 'Technical Skills', skills: ['JavaScript', 'React', 'React'] },
        { name: 'Tools', skills: ['Git'] },
      ],
      experience: [{
        jobTitle: 'Senior Software Engineer',
        companyName: 'Acme Corp',
        startDate: '2020-01',
        isCurrent: true,
        description: 'Built web products.',
      }],
      education: [],
    }))

    const result = await extractCvWithNvidia(CV_TEXT)
    expect(result).toMatchObject({
      displayName: 'John Doe',
      professionalTitle: 'Software Engineer',
      skillGroups: [
        { name: 'Technical Skills', skills: ['JavaScript', 'React'] },
        { name: 'Tools', skills: ['Git'] },
      ],
    })
    expect(result?.experience?.[0].jobTitle).toBe('Senior Software Engineer')
    expect(result?.experience?.[0].endDate).toBe('')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://integrate.api.nvidia.com/v1/chat/completions')
    const body = String(init.body || '')
    expect(body).toContain('nvidia/nemotron-3.5-bolt-e4b')
    expect(body).toContain('explicitly present')
    expect(body).toContain('Other Skills')
    expect(body).toContain('[email]')
    expect(body).not.toContain('john.doe@example.test')
    expect(body).not.toContain('test-key-not-a-real-secret')
    expect(init.redirect).toBe('error')
  })

  it('falls back silently on provider errors and invalid output', async () => {
    fetchMock.mockResolvedValue(new Response('upstream error', { status: 500 }))
    await expect(extractCvWithNvidia(CV_TEXT)).resolves.toBeNull()

    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: 'not json' } }],
    }), { status: 200 }))
    await expect(extractCvWithNvidia(CV_TEXT)).resolves.toBeNull()

    fetchMock.mockResolvedValue(successfulResponse({
      displayName: '<script>alert(1)</script>',
      skillGroups: [{ name: 'Tools', skills: ['React'] }],
    }))
    const invalid = await extractCvWithNvidia(CV_TEXT)
    expect(invalid).toBeNull()
  })

  it('falls back silently on a network timeout/abort', async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }))
    await expect(extractCvWithNvidia(CV_TEXT)).resolves.toBeNull()
  })

  it('returns null for an empty model response', async () => {
    fetchMock.mockResolvedValue(successfulResponse({}))
    await expect(extractCvWithNvidia(CV_TEXT)).resolves.toBeNull()
  })

  it('strips markup from AI skill suggestions and merges duplicate groups', async () => {
    fetchMock.mockResolvedValue(successfulResponse({
      skillGroups: [
        { name: 'Tools', skills: ['<b>React</b>', 'Vue'] },
        { name: 'Tools', skills: ['Vue', 'Docker'] },
      ],
    }))
    const result = await extractCvWithNvidia(CV_TEXT)
    expect(result?.skillGroups).toEqual([
      { name: 'Tools', skills: ['React', 'Vue', 'Docker'] },
    ])
  })

  it('rejects AI output that exceeds the skill group/skill caps', async () => {
    fetchMock.mockResolvedValue(successfulResponse({
      skillGroups: Array.from({ length: 11 }, (_, index) => ({
        name: `Group ${index + 1}`,
        skills: [`Skill ${index + 1}`],
      })),
    }))
    await expect(extractCvWithNvidia(CV_TEXT)).resolves.toBeNull()
  })
})
