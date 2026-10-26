import { describe, it, expect } from 'vitest'
import { validateSections } from '@/lib/portfolio-schema'
import { isSectionVisible } from '@/lib/section-visibility'
import { sanitizeUrl } from '@/lib/urls'

describe('Clients / Brands Section', () => {
  describe('Schema & Backward Compatibility', () => {
    it('validates old portfolios without a clients section', () => {
      const oldSections = [
        {
          id: 'hero-1',
          sectionType: 'hero',
          sectionOrder: 1,
          content: { title: { en: 'Hello', ar: 'مرحبا' } },
        },
        {
          id: 'projects-1',
          sectionType: 'projects',
          sectionOrder: 2,
          content: { title: { en: 'Projects', ar: 'المشاريع' } },
        },
      ]

      const check = validateSections(oldSections)
      expect(check.ok).toBe(true)
    })

    it('validates a clients section with default settings and empty items', () => {
      const sections = [
        {
          id: 'clients-1',
          sectionType: 'clients',
          sectionOrder: 3,
          visible: false,
          settings: { isVisible: false },
          content: {
            title: { en: 'Clients', ar: 'العملاء' },
            description: { en: 'Brands I have worked with', ar: 'علامات تجارية عملت معها' },
            showTitleUnderline: true,
            logoShape: 'circle',
            logoSize: 'md',
            grayscale: false,
            items: [],
          },
        },
      ]

      const check = validateSections(sections)
      expect(check.ok).toBe(true)
    })

    it('validates clients section with items containing valid URLs', () => {
      const sections = [
        {
          id: 'clients-1',
          sectionType: 'clients',
          sectionOrder: 3,
          content: {
            title: { en: 'Our Clients', ar: 'عملاؤنا' },
            logoShape: 'rounded',
            logoSize: 'lg',
            grayscale: true,
            items: [
              {
                id: 'c1',
                name: 'Acme Corp',
                logoUrl: 'https://res.cloudinary.com/demo/image/upload/sample.png',
                url: 'https://acme.com',
              },
              {
                id: 'c2',
                name: 'Globex',
                logoUrl: 'https://example.com/logo.svg',
                url: '',
              },
            ],
          },
        },
      ]

      const check = validateSections(sections)
      expect(check.ok).toBe(true)
    })

    it('rejects unsafe javascript: URLs in client items', () => {
      const sections = [
        {
          id: 'clients-1',
          sectionType: 'clients',
          sectionOrder: 3,
          content: {
            items: [
              {
                id: 'c1',
                name: 'Bad Actor',
                logoUrl: 'javascript:alert(1)',
                url: 'javascript:alert(2)',
              },
            ],
          },
        },
      ]

      const check = validateSections(sections)
      expect(check.ok).toBe(false)
    })
  })

  describe('Visibility & Renderability Logic', () => {
    const hasRenderableClients = (section: any) => {
      if (section?.sectionType !== 'clients') return true
      const items = Array.isArray(section.content?.items) ? section.content.items : []
      return items.some((item: any) => Boolean(item?.logoUrl))
    }

    const isSectionRenderable = (section: any) => {
      if (!section || !isSectionVisible(section)) return false
      if (section.sectionType === 'hero') return false
      const c = section.content || {}
      switch (section.sectionType) {
        case 'clients': {
          const items = Array.isArray(c.items) ? c.items : []
          return items.some((item: any) => Boolean(item?.logoUrl))
        }
        default:
          return true
      }
    }

    it('is hidden when empty (no items with logoUrl)', () => {
      const section = {
        id: 'sec-clients',
        sectionType: 'clients',
        visible: true,
        settings: { isVisible: true },
        content: { items: [] },
      }

      expect(hasRenderableClients(section)).toBe(false)
      expect(isSectionRenderable(section)).toBe(false)
    })

    it('is hidden when items exist but none have logoUrl', () => {
      const section = {
        id: 'sec-clients',
        sectionType: 'clients',
        visible: true,
        settings: { isVisible: true },
        content: {
          items: [{ id: '1', name: 'No Logo Corp', logoUrl: '' }],
        },
      }

      expect(hasRenderableClients(section)).toBe(false)
      expect(isSectionRenderable(section)).toBe(false)
    })

    it('is visible when visible=true and has at least one item with logoUrl', () => {
      const section = {
        id: 'sec-clients',
        sectionType: 'clients',
        visible: true,
        settings: { isVisible: true },
        content: {
          items: [
            {
              id: '1',
              name: 'Valid Client',
              logoUrl: 'https://example.com/logo.png',
            },
          ],
        },
      }

      expect(hasRenderableClients(section)).toBe(true)
      expect(isSectionRenderable(section)).toBe(true)
    })

    it('is hidden when visible=false even if items exist', () => {
      const section = {
        id: 'sec-clients',
        sectionType: 'clients',
        visible: false,
        settings: { isVisible: false },
        content: {
          items: [
            {
              id: '1',
              name: 'Valid Client',
              logoUrl: 'https://example.com/logo.png',
            },
          ],
        },
      }

      expect(isSectionRenderable(section)).toBe(false)
    })
  })

  describe('Item Link & URL Safety', () => {
    it('determines link vs non-link based on sanitized http/https URL', () => {
      const sanitizeHttpUrl = (raw: unknown) => {
        const s = sanitizeUrl(raw)
        return /^https?:\/\//i.test(s) ? s : ''
      }

      const clientWithUrl = {
        name: 'Acme',
        url: 'https://acme.com',
        logoUrl: 'https://acme.com/logo.png',
      }
      const clientWithoutUrl = {
        name: 'Private Corp',
        url: '',
        logoUrl: 'https://acme.com/logo.png',
      }
      const clientWithBadUrl = {
        name: 'Dangerous',
        url: 'javascript:alert(1)',
        logoUrl: 'https://acme.com/logo.png',
      }

      expect(sanitizeHttpUrl(clientWithUrl.url)).toBe('https://acme.com')
      expect(sanitizeHttpUrl(clientWithoutUrl.url)).toBe('')
      expect(sanitizeHttpUrl(clientWithBadUrl.url)).toBe('')
    })

    it('normalizes bare domains to https://', () => {
      const raw = 'acme.com'
      const sanitized = sanitizeUrl(raw)
      expect(sanitized).toBe('https://acme.com')
      expect(/^https?:\/\//i.test(sanitized)).toBe(true)
    })
  })

  describe('Idempotent Insertion & Safety Constraints', () => {
    function migrateSections(sections: any[], userEmail: string) {
      if (userEmail === 'bousla421@gmail.com') {
        return { sections, migrated: false }
      }

      let next = [...sections]
      let migrated = false

      const clientSections = next.filter((s: any) => s.sectionType === 'clients')

      if (clientSections.length > 1) {
        const kept = clientSections[0]
        next = next.filter((s: any) => s.sectionType !== 'clients' || s.id === kept.id)
        migrated = true
      } else if (clientSections.length === 0 && next.length > 0) {
        const projects = next.find((s: any) => s.sectionType === 'projects')
        const testimonials = next.find((s: any) => s.sectionType === 'testimonials')
        const footer = next.find((s: any) => s.sectionType === 'footer')
        const insertOrder = projects
          ? (projects.sectionOrder || 0) + 1
          : testimonials
            ? (testimonials.sectionOrder || 0)
            : footer
              ? (footer.sectionOrder || 0)
              : next.reduce((max: number, s: any) => Math.max(max, s.sectionOrder || 0), 0) + 1

        next = next.map((s: any) =>
          (s.sectionOrder || 0) >= insertOrder ? { ...s, sectionOrder: (s.sectionOrder || 0) + 1 } : s,
        )
        next.push({
          id: 'clients-auto',
          sectionType: 'clients',
          sectionOrder: insertOrder,
          visible: false,
          settings: { isVisible: false },
          content: {
            title: { en: 'Clients', ar: 'العملاء' },
            description: { en: '', ar: '' },
            showTitleUnderline: true,
            logoShape: 'circle',
            logoSize: 'md',
            grayscale: false,
            items: [],
          },
        })
        migrated = true
      }

      return { sections: next, migrated }
    }

    it('inserts clients section exactly once after projects when missing', () => {
      const initial = [
        { id: '1', sectionType: 'hero', sectionOrder: 1 },
        { id: '2', sectionType: 'projects', sectionOrder: 2 },
        { id: '3', sectionType: 'footer', sectionOrder: 3 },
      ]

      const res1 = migrateSections(initial, 'user@example.com')
      expect(res1.migrated).toBe(true)
      expect(res1.sections.filter((s) => s.sectionType === 'clients').length).toBe(1)

      const clientsSec = res1.sections.find((s) => s.sectionType === 'clients')
      expect(clientsSec?.sectionOrder).toBe(3)
      expect(clientsSec?.visible).toBe(false)
      expect(clientsSec?.settings?.isVisible).toBe(false)
    })

    it('is strictly idempotent: running migration twice results in exactly one clients section', () => {
      const initial = [
        { id: '1', sectionType: 'hero', sectionOrder: 1 },
        { id: '2', sectionType: 'projects', sectionOrder: 2 },
        { id: '3', sectionType: 'footer', sectionOrder: 3 },
      ]

      const step1 = migrateSections(initial, 'user@example.com')
      const step2 = migrateSections(step1.sections, 'user@example.com')

      expect(step2.migrated).toBe(false)
      expect(step2.sections.filter((s) => s.sectionType === 'clients').length).toBe(1)
    })

    it('deduplicates if multiple clients sections already exist', () => {
      const withDuplicates = [
        { id: '1', sectionType: 'projects', sectionOrder: 1 },
        { id: 'c1', sectionType: 'clients', sectionOrder: 2 },
        { id: 'c2', sectionType: 'clients', sectionOrder: 3 },
        { id: 'f', sectionType: 'footer', sectionOrder: 4 },
      ]

      const res = migrateSections(withDuplicates, 'user@example.com')
      expect(res.migrated).toBe(true)
      expect(res.sections.filter((s) => s.sectionType === 'clients').length).toBe(1)
      expect(res.sections.find((s) => s.sectionType === 'clients')?.id).toBe('c1')
    })

    it('NEVER touches bousla421@gmail.com data', () => {
      const initial = [
        { id: '1', sectionType: 'hero', sectionOrder: 1 },
        { id: '2', sectionType: 'projects', sectionOrder: 2 },
        { id: '3', sectionType: 'footer', sectionOrder: 3 },
      ]

      const res = migrateSections(initial, 'bousla421@gmail.com')
      expect(res.migrated).toBe(false)
      expect(res.sections.filter((s) => s.sectionType === 'clients').length).toBe(0)
      expect(res.sections).toEqual(initial)
    })
  })

  describe('Header Layout & Card Sizing (Fix 1 & Fix 2)', () => {
    function computeClientsHeader(c: any, lang: string = 'en') {
      const t = (val: any) => (typeof val === 'string' ? val : val?.[lang] || '')
      const titleText = (c.title === undefined || c.title === null)
        ? (lang === 'ar' ? 'العملاء' : 'Clients')
        : (t(c.title)?.trim() || '')
      const descText = t(c.description)?.trim() || ''
      const showUnderline = c.showTitleUnderline !== false

      if (!titleText && !descText) return null

      return {
        hasHeader: true,
        title: titleText || null,
        showUnderline: titleText ? showUnderline : false,
        description: descText || null,
        descHasTopMargin: Boolean(titleText && descText),
      }
    }

    function computeCardClasses(logoShape: string = 'circle', logoSize: string = 'md') {
      const isCircle = logoShape === 'circle'
      const shapeClass =
        logoShape === 'rounded'
          ? 'rounded-2xl'
          : logoShape === 'square'
            ? 'rounded-md'
            : 'rounded-full'

      const sizeClass =
        logoSize === 'sm'
          ? 'w-[60px] h-[60px] cq-md:w-[72px] cq-md:h-[72px]'
          : logoSize === 'lg'
            ? 'w-[112px] h-[112px] cq-md:w-[144px] cq-md:h-[144px]'
            : 'w-[88px] h-[88px] cq-md:w-[112px] cq-md:h-[112px]'

      const paddingClass = isCircle
        ? logoSize === 'sm'
          ? 'p-2 cq-md:p-2.5'
          : logoSize === 'lg'
            ? 'p-4 cq-md:p-5'
            : 'p-3 cq-md:p-4'
        : logoSize === 'sm'
          ? 'p-1.5 cq-md:p-2'
          : logoSize === 'lg'
            ? 'p-2.5 cq-md:p-3'
            : 'p-2 cq-md:p-2.5'

      return { shapeClass, sizeClass, paddingClass }
    }

    it('stacked header: renders both title and description with spacing when both present', () => {
      const header = computeClientsHeader({
        title: { en: 'Our Valued Clients', ar: 'عملاؤنا' },
        description: { en: 'Trusted by global companies', ar: 'موثوق من شركات عالمية' },
        showTitleUnderline: true,
      })
      expect(header).not.toBeNull()
      expect(header?.title).toBe('Our Valued Clients')
      expect(header?.description).toBe('Trusted by global companies')
      expect(header?.showUnderline).toBe(true)
      expect(header?.descHasTopMargin).toBe(true)
    })

    it('stacked header: renders title only with no description and no empty space', () => {
      const header = computeClientsHeader({
        title: { en: 'Partners', ar: 'الشركاء' },
        description: { en: '', ar: '' },
      })
      expect(header).not.toBeNull()
      expect(header?.title).toBe('Partners')
      expect(header?.description).toBeNull()
      expect(header?.descHasTopMargin).toBe(false)
    })

    it('stacked header: renders description only with no top margin and no title', () => {
      const header = computeClientsHeader({
        title: { en: '', ar: '' },
        description: { en: 'Some description text', ar: 'نص توضيحي' },
      })
      expect(header).not.toBeNull()
      expect(header?.title).toBeNull()
      expect(header?.showUnderline).toBe(false)
      expect(header?.description).toBe('Some description text')
      expect(header?.descHasTopMargin).toBe(false)
    })

    it('stacked header: renders no header at all when both title and description are blank', () => {
      const header = computeClientsHeader({
        title: { en: '', ar: '' },
        description: { en: '', ar: '' },
      })
      expect(header).toBeNull()
    })

    it('card sizes: sm=60/72px, md=88/112px, lg=112/144px', () => {
      const sm = computeCardClasses('rounded', 'sm')
      expect(sm.sizeClass).toBe('w-[60px] h-[60px] cq-md:w-[72px] cq-md:h-[72px]')

      const md = computeCardClasses('rounded', 'md')
      expect(md.sizeClass).toBe('w-[88px] h-[88px] cq-md:w-[112px] cq-md:h-[112px]')

      const lg = computeCardClasses('rounded', 'lg')
      expect(lg.sizeClass).toBe('w-[112px] h-[112px] cq-md:w-[144px] cq-md:h-[144px]')
    })

    it('card padding: circle uses ~14% padding', () => {
      const sm = computeCardClasses('circle', 'sm')
      expect(sm.paddingClass).toBe('p-2 cq-md:p-2.5')

      const md = computeCardClasses('circle', 'md')
      expect(md.paddingClass).toBe('p-3 cq-md:p-4')

      const lg = computeCardClasses('circle', 'lg')
      expect(lg.paddingClass).toBe('p-4 cq-md:p-5')
    })

    it('card padding: rounded and square use ~8-10% padding', () => {
      const sm = computeCardClasses('rounded', 'sm')
      expect(sm.paddingClass).toBe('p-1.5 cq-md:p-2')

      const md = computeCardClasses('square', 'md')
      expect(md.paddingClass).toBe('p-2 cq-md:p-2.5')

      const lg = computeCardClasses('rounded', 'lg')
      expect(lg.paddingClass).toBe('p-2.5 cq-md:p-3')
    })
  })
})
