import { describe, expect, it } from 'vitest'
import { resolveProjectId } from '@/lib/project-id-aliases'

describe('project id aliases (F-17)', () => {
  it('resolves a temporary project id to the persisted id', () => {
    expect(resolveProjectId('new-card-1', { 'new-card-1': 'real-card-1' })).toBe('real-card-1')
  })

  it('keeps a real id unchanged', () => {
    expect(resolveProjectId('real-card-1', { 'new-card-1': 'real-card-2' })).toBe('real-card-1')
  })

  it('maps multiple created cards independently', () => {
    const aliases = { 'new-a': 'real-a', 'new-b': 'real-b' }
    expect(resolveProjectId('new-a', aliases)).toBe('real-a')
    expect(resolveProjectId('new-b', aliases)).toBe('real-b')
    expect(resolveProjectId('real-a', aliases)).toBe('real-a')
  })

  it('handles empty ids and missing aliases safely', () => {
    expect(resolveProjectId(null, { a: 'b' })).toBe('')
    expect(resolveProjectId(undefined, null)).toBe('')
    expect(resolveProjectId('new-x', null)).toBe('new-x')
  })
})
