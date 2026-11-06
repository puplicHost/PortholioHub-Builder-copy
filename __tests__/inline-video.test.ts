import { describe, expect, it } from 'vitest'
import {
  normalizeProjectCardVisual,
  normalizeProjectMediaAspect,
  aspectRatioValue,
  readProjectItemCardMeta,
  spliceProjectItemCards,
  withProjectItemCardMeta,
} from '@/lib/project-card-visuals'
import { maxSizeForMime, maxSizeForFile, isVideoFile, MAX_VIDEO_SIZE, MAX_FILE_SIZE } from '@/lib/r2'

describe('inline video card visual', () => {
  it('accepts the video visual type', () => {
    expect(normalizeProjectCardVisual('video')).toBe('video')
    expect(normalizeProjectCardVisual('image')).toBe('image')
    expect(normalizeProjectCardVisual('file-icon')).toBe('file-icon')
    expect(normalizeProjectCardVisual('none')).toBe('none')
    expect(normalizeProjectCardVisual('bogus')).toBe('image')
  })

  it('round-trips video metadata through content JSON', () => {
    const content = withProjectItemCardMeta({}, 0, {
      cardVisual: 'video',
      attachmentName: 'clip.mp4',
      attachmentType: 'video/mp4',
      attachmentSize: 12345,
      attachmentId: 'file-1',
    })
    const meta = readProjectItemCardMeta(content, 0)
    expect(meta.cardVisual).toBe('video')
    expect(meta.attachmentName).toBe('clip.mp4')
    expect(meta.attachmentType).toBe('video/mp4')
    expect(meta.attachmentSize).toBe(12345)
    expect(meta.attachmentId).toBe('file-1')
  })

  it('splices video cards without affecting neighbours', () => {
    const content = spliceProjectItemCards({}, 0, 0, [
      { cardVisual: 'video', attachmentName: 'a.mp4' },
      { cardVisual: 'image' },
    ])
    expect(readProjectItemCardMeta(content, 0).cardVisual).toBe('video')
    expect(readProjectItemCardMeta(content, 1).cardVisual).toBe('image')
  })
})

describe('media aspect ratios', () => {
  it('defaults to auto for legacy cards and validates known ratios', () => {
    expect(normalizeProjectMediaAspect(undefined)).toBe('auto')
    expect(normalizeProjectMediaAspect('16:9')).toBe('16:9')
    expect(normalizeProjectMediaAspect('9:16')).toBe('9:16')
    expect(normalizeProjectMediaAspect('bogus')).toBe('auto')
    expect(aspectRatioValue('16:9')).toBe('16 / 9')
    expect(aspectRatioValue('auto')).toBeNull()
  })

  it('persists independent image and video ratios', () => {
    const content = withProjectItemCardMeta({}, 0, {
      cardVisual: 'video',
      imageAspect: '4:3',
      videoAspect: '9:16',
    })
    const meta = readProjectItemCardMeta(content, 0)
    expect(meta.imageAspect).toBe('4:3')
    expect(meta.videoAspect).toBe('9:16')
  })
})

describe('video size limit', () => {
  it('enforces exactly 50 MB for videos', () => {
    expect(MAX_VIDEO_SIZE).toBe(52_428_800)
    expect(maxSizeForMime('video/mp4')).toBe(52_428_800)
    expect(maxSizeForMime('video/webm')).toBe(52_428_800)
    expect(maxSizeForMime('application/pdf')).toBe(MAX_FILE_SIZE)
  })

  it('detects video by extension even with a spoofed MIME', () => {
    expect(isVideoFile('application/pdf', 'clip.mp4')).toBe(true)
    expect(isVideoFile('application/octet-stream', 'clip.webm')).toBe(true)
    expect(maxSizeForFile('application/pdf', 'clip.mp4')).toBe(52_428_800)
    expect(maxSizeForFile('application/pdf', 'doc.pdf')).toBe(MAX_FILE_SIZE)
  })
})