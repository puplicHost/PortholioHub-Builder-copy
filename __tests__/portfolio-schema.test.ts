import { describe, it, expect } from 'vitest'
import { validateSections, validateProjects, SECTION_TYPES } from '@/lib/portfolio-schema'

const hero = {
  id: 's1',
  sectionType: 'hero',
  sectionOrder: 1,
  content: { title: { en: 'Hi', ar: 'مرحبا' }, subtitle: { en: 'Dev' } },
  settings: { isVisible: true },
};

describe('portfolio content schema (Sprint F1)', () => {
  it('accepts seed-like sections', () => {
    expect(
      validateSections([
        hero,
        { id: 's2', sectionType: 'about', sectionOrder: 2, content: { text: { en: 'Bio' } }, settings: { isVisible: true } },
        { id: 's3', sectionType: 'skills', sectionOrder: 3, content: { skills: ['TS', 'Next'] }, settings: { isVisible: true } },
      ]),
    ).toEqual({ ok: true });
  });

  it('accepts the new gallery/files/contact/custom shapes', () => {
    expect(
      validateSections([
        { id: 'g', sectionType: 'gallery', sectionOrder: 1, content: { title: { en: 'Work' }, items: [{ imageUrl: 'https://x.test/a.png', caption: 'A' }] }, settings: {} },
        { id: 'f', sectionType: 'files', sectionOrder: 2, content: { items: [{ label: 'CV', url: 'https://x.test/cv.pdf' }] }, settings: {} },
        { id: 'c', sectionType: 'contact', sectionOrder: 3, content: { links: [{ type: 'whatsapp', value: '+201012345678' }] }, settings: {} },
        { id: 'u', sectionType: 'custom', sectionOrder: 4, content: { title: { en: 'Note' }, paragraphs: ['plain text'] }, settings: {} },
      ]),
    ).toEqual({ ok: true });
  });

  it('accepts DB passthrough columns on real rows', () => {    expect(
      validateSections([
        {
          id: 's1',
          pageId: 'p1',
          sectionType: 'hero',
          sectionOrder: 1,
          content: { title: { en: 'Hi' } },
          settings: { isVisible: true },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ]),
    ).toEqual({ ok: true });
  });

  it('rejects unknown types and unknown keys with paths', () => {
    const badType = validateSections([{ sectionType: 'nope', content: {} }]);
    expect(badType.ok).toBe(false);
    const badKey = validateSections([{ sectionType: 'hero', content: { title: { en: 'x' }, evilKey: 1 } }]);
    expect(badKey.ok).toBe(false);
    expect(badKey.error || '').toContain('content');
  });

  it('rejects dangerous URLs, oversize text, and overfull arrays', () => {
    expect(
      validateSections([{ sectionType: 'hero', content: { title: { en: 'x' }, backgroundImage: 'javascript:alert(1)' } }]).ok,
    ).toBe(false);
    expect(
      validateSections([{ sectionType: 'about', content: { text: { en: 'x'.repeat(2001) } } }]).ok,
    ).toBe(false);
    expect(
      validateSections(
        Array.from({ length: 31 }, (_, i) => ({ sectionType: 'about', sectionOrder: i, content: {} })),
      ),
    ).toEqual({ ok: false, error: 'sections: at most 30 sections allowed' });
    expect(
      validateSections([{
        sectionType: 'testimonials',
        content: { items: Array.from({ length: 31 }, () => ({ author: 'a', body: 'b' })) },
      }]).ok,
    ).toBe(false);
  });

  it('covers all 12 planned section types', () => {
    expect(SECTION_TYPES).toEqual(
      expect.arrayContaining(['hero', 'about', 'skills', 'experience', 'services', 'projects', 'gallery', 'files', 'testimonials', 'contact', 'footer', 'custom']),
    );
  });

  it('caps projects at 50', () => {
    expect(validateProjects(Array.from({ length: 51 }, () => ({}))).ok).toBe(false);
    expect(validateProjects([{ id: 'p1' }])).toEqual({ ok: true });
  });

  it('accepts editor-created item shapes (ids, urls, icons, platforms)', () => {
    expect(
      validateSections([
        {
          sectionType: 'gallery',
          content: {
            title: { en: 'G' },
            icon: 'image',
            items: [{ id: 'g-1', imageUrl: 'https://x.test/a.png', url: 'https://x.test/b.png', caption: 'A' }],
          },
        },
        {
          sectionType: 'files',
          content: {
            title: { en: 'F' },
            icon: 'file',
            items: [{ id: 'f-1', label: 'CV', url: 'https://x.test/c.pdf', externalUrl: 'https://x.test/c.pdf' }],
          },
        },
        {
          sectionType: 'contact',
          content: {
            title: { en: 'C' },
            icon: 'mail',
            links: [{ id: 'c-1', type: 'website', platform: 'website', value: 'https://x.test', label: 'Site' }],
          },
        },
        {
          sectionType: 'custom',
          content: { title: { en: 'N' }, icon: 'star', paragraphs: ['hi'] },
        },
        {
          sectionType: 'footer',
          content: { links: [{ id: 'l-1', platform: 'github', label: 'GH', url: 'https://x.test' }] },
        },
      ]),
    ).toEqual({ ok: true });
  });

  it('validates contact values per type', () => {
    const link = (type: string, value: string) => ({
      sectionType: 'contact',
      content: { links: [{ type, value }] },
    });
    expect(validateSections([link('website', 'https://x.test')]).ok).toBe(true);
    expect(validateSections([link('website', 'javascript:alert(1)')]).ok).toBe(false);
    expect(validateSections([link('email', 'a@b.com')]).ok).toBe(true);
    expect(validateSections([link('email', 'not-an-email')]).ok).toBe(false);
    expect(validateSections([link('phone', '+201012345678')]).ok).toBe(true);
    expect(validateSections([link('phone', 'abc')]).ok).toBe(false);
    expect(validateSections([link('github', 'octocat')]).ok).toBe(true);
  });

  it('requires localized custom titles', () => {
    expect(
      validateSections([{ sectionType: 'custom', content: { title: 'plain string', paragraphs: [] } }]).ok,
    ).toBe(false);
    expect(
      validateSections([{ sectionType: 'custom', content: { title: { en: 'N' }, paragraphs: [] } }]).ok,
    ).toBe(true);
  });
});
