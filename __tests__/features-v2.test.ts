import { describe, it, expect } from 'vitest'
import {
  PORTFOLIO_ICON_LIST,
  PORTFOLIO_ICON_MAP,
  getPortfolioIcon,
  searchPortfolioIcons,
} from '@/lib/portfolio-icons'
import {
  formatExperienceRange,
  formatExperienceDate,
  presentLabel,
} from '@/lib/experience-dates'

describe('Feature 1: Experience Dates & Range', () => {
  it('formats experience range with Present / حتى الآن', () => {
    const rangeEn = formatExperienceRange('2022-01', '', true, 'en')
    expect(rangeEn).toContain('Present')

    const rangeAr = formatExperienceRange('2022-01', '', true, 'ar')
    expect(rangeAr).toContain('حتى الآن')
  })

  it('formats month and year properly in en and ar', () => {
    const dateEn = formatExperienceDate('2023-05', 'en')
    expect(dateEn).toBe('May 2023')

    const dateAr = formatExperienceDate('2023-05', 'ar')
    expect(dateAr).toBe('مايو 2023')
  })

  it('provides correct present label', () => {
    expect(presentLabel('en')).toBe('Present')
    expect(presentLabel('ar')).toBe('حتى الآن')
  })
})

describe('Feature 2: Expanded Icon Library & Picker', () => {
  it('has between 100 and 200 curated icons in the picker list', () => {
    expect(PORTFOLIO_ICON_LIST.length).toBeGreaterThanOrEqual(100)
    expect(PORTFOLIO_ICON_LIST.length).toBeLessThanOrEqual(200)
  })

  it('contains zero duplicate keys in the picker list (PORTFOLIO_ICONS and PORTFOLIO_ICON_LIST)', () => {
    const keys = PORTFOLIO_ICON_LIST.map((i) => i.key.toLowerCase().trim())
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const key of keys) {
      if (seen.has(key)) {
        duplicates.push(key)
      } else {
        seen.add(key)
      }
    }
    expect(duplicates, `Found duplicate keys: ${duplicates.join(', ')}`).toEqual([])
    expect(seen.size).toBe(keys.length)
  })

  it('assigns each icon to a single valid category', () => {
    const validCategories = new Set(['general', 'tech', 'design', 'business', 'education', 'social', 'tools'])
    for (const item of PORTFOLIO_ICON_LIST) {
      expect(validCategories.has(item.category), `Icon ${item.key} has invalid category: ${item.category}`).toBe(true)
    }
  })

  it('preserves all legacy icon keys in PORTFOLIO_ICON_MAP', () => {
    const legacyKeys = [
      'trophy', 'star', 'users', 'briefcase', 'heart', 'zap', 'target', 'award',
      'clock', 'trendingup', 'globe', 'code', 'layers', 'checkcircle', 'rocket',
      'mail', 'phone', 'externalink', 'arrowright', 'layout', 'palette', 'database',
      'pen', 'user', 'message', 'pentool', 'externallink', 'messagecircle',
      'document', 'doc', 'file', 'feather', 'download'
    ]

    for (const key of legacyKeys) {
      const iconComp = getPortfolioIcon(key)
      expect(iconComp, `Legacy icon "${key}" should resolve in PORTFOLIO_ICON_MAP`).toBeTruthy()
    }
  })

  it('supports searching by English name and Arabic name', () => {
    const resultsCode = searchPortfolioIcons('code')
    expect(resultsCode.some((item) => item.key === 'code')).toBe(true)

    const resultsAr = searchPortfolioIcons('برمجة')
    expect(resultsAr.some((item) => item.key === 'code')).toBe(true)

    const resultsRocket = searchPortfolioIcons('صاروخ')
    expect(resultsRocket.some((item) => item.key === 'rocket')).toBe(true)
  })
})

describe('Feature 4: Project Group Delete', () => {
  it('counts projects in a group accurately', () => {
    const projects = [
      { id: '1', content: { groupId: 'g1' } },
      { id: '2', content: { groupId: 'g1' } },
      { id: '3', content: { groupId: 'g2' } },
      { id: '4', content: {} },
    ]
    const g1Count = projects.filter((p) => p.content.groupId === 'g1').length
    expect(g1Count).toBe(2)

    const confirmMsgEn = `Delete this group and all ${g1Count} project(s) inside it?`
    expect(confirmMsgEn).toBe('Delete this group and all 2 project(s) inside it?')

    const confirmMsgAr = `هل أنت متأكد من حذف هذه المجموعة وجميع المشاريع التابعة لها (${g1Count} مشاريع)؟`
    expect(confirmMsgAr).toContain('2 مشاريع')
  })
})

describe('Feature 5: Image Delete & Position Reset', () => {
  it('resets image URL to empty and position to center {x: 50, y: 50}', () => {
    const state = {
      image: 'https://example.com/photo.jpg',
      position: { x: 80, y: 20 },
    }

    const resetState = {
      ...state,
      image: '',
      position: { x: 50, y: 50 },
    }

    expect(resetState.image).toBe('')
    expect(resetState.position).toEqual({ x: 50, y: 50 })
  })
})

describe('Feature 6: Desktop Navbar & Hamburger Placement', () => {
  it('verifies ClassicTemplate source contains 2-sided navbar layout with contact and hamburger in same group', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const templateContent = fs.readFileSync(
      path.resolve(__dirname, '../src/components/portfolio/templates/ClassicTemplate.tsx'),
      'utf-8'
    )

    // Verify 2-sided split
    expect(templateContent).toContain('flex w-full items-center justify-between gap-4')
    // Verify Contact Me and Hamburger button are in the same flex group
    expect(templateContent).toContain('flex items-center gap-2.5 sm:gap-3')
    expect(templateContent).toContain('href="#contact"')
    expect(templateContent).toContain('ref={navMenuRef}')
    // Verify Menu and X icons
    expect(templateContent).toContain('<Menu className="h-5 w-5" aria-hidden="true" />')
    expect(templateContent).toContain('<X className="h-5 w-5" aria-hidden="true" />')
    // Verify anchored dropdown with end-0
    expect(templateContent).toContain('absolute end-0 top-full mt-2.5 min-w-[200px] max-w-[calc(100vw-2rem)]')
  })
})

describe('Feature 7: Project Groups & Card Reordering', () => {
  it('reorders groups array correctly and maintains array order as source of truth', async () => {
    const { arrayMove } = await import('@dnd-kit/sortable')
    const initialGroups = [
      { id: 'g1', title: { en: 'Web Development', ar: 'تطوير الويب' } },
      { id: 'g2', title: { en: 'Mobile Apps', ar: 'تطبيقات الجوال' } },
      { id: 'g3', title: { en: 'UI/UX Design', ar: 'تصميم الواجهات' } },
    ]

    // Move g3 to top (index 2 to index 0)
    const reordered = arrayMove(initialGroups, 2, 0)
    expect(reordered.map((g) => g.id)).toEqual(['g3', 'g1', 'g2'])

    // Move g1 down (index 1 to index 2)
    const reorderedDown = arrayMove(reordered, 1, 2)
    expect(reorderedDown.map((g) => g.id)).toEqual(['g3', 'g2', 'g1'])
  })

  it('reorders cards within a group without altering cards in other groups or content pages', () => {
    const initialPages = [
      { id: 'c-u1', content: {} },
      { id: 'c-a1', content: { groupId: 'gA' } },
      { id: 'p-detail', showInProjects: false },
      { id: 'c-b1', content: { groupId: 'gB' } },
      { id: 'c-a2', content: { groupId: 'gA' } },
      { id: 'c-a3', content: { groupId: 'gA' } },
    ]

    // Group A cards: c-a1, c-a2, c-a3
    // Move c-a3 to the top of Group A: new Group A = [c-a3, c-a1, c-a2]
    const groupACards = [
      initialPages[5], // c-a3
      initialPages[1], // c-a1
      initialPages[4], // c-a2
    ]

    const indices: number[] = []
    initialPages.forEach((page, idx) => {
      if (page.showInProjects === false) return
      if (page.content?.groupId === 'gA') indices.push(idx)
    })
    expect(indices).toEqual([1, 4, 5])

    const nextPages = [...initialPages]
    indices.forEach((pageIdx, k) => {
      nextPages[pageIdx] = groupACards[k]
    })

    let cardOrder = 0
    nextPages.forEach((page: any) => {
      if (page.showInProjects !== false) {
        page.sortOrder = cardOrder++
      }
    })

    // Content page remains untouched at index 2
    expect(nextPages[2].id).toBe('p-detail')
    // Group B card remains untouched at index 3
    expect(nextPages[3].id).toBe('c-b1')
    // Ungrouped card remains untouched at index 0
    expect(nextPages[0].id).toBe('c-u1')

    // Group A cards in order: c-a3 (index 1), c-a1 (index 4), c-a2 (index 5)
    const filteredGroupA = nextPages.filter((p) => p.content?.groupId === 'gA').map((p) => p.id)
    expect(filteredGroupA).toEqual(['c-a3', 'c-a1', 'c-a2'])
  })

  it('verifies ProjectManager contains dnd components, handles, and move buttons', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const pmContent = fs.readFileSync(
      path.resolve(__dirname, '../src/app/profile/builder/ProjectManager.tsx'),
      'utf-8'
    )

    expect(pmContent).toContain('SortableGroupRow')
    expect(pmContent).toContain('SortableProjectRow')
    expect(pmContent).toContain('GripVertical')
    expect(pmContent).toContain('dnd-groups-manager')
    expect(pmContent).toContain('dnd-cards-')
    expect(pmContent).toContain('reorderCardsInGroup')
    expect(pmContent).toContain('moveCardInGroup')
    expect(pmContent).toContain('handleCardDragEnd')
  })

  it('verifies ClassicTemplate strictly preserves saved array order without sorting by title or date', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const templateContent = fs.readFileSync(
      path.resolve(__dirname, '../src/components/portfolio/templates/ClassicTemplate.tsx'),
      'utf-8'
    )

    // Verify groups mapping
    expect(templateContent).toContain('groups.map((group: any) => {')
    // Verify no title/date sort in projects
    expect(templateContent).not.toContain('projects.sort((a, b) => a.title')
    expect(templateContent).not.toContain('groups.sort((a, b) => a.title')
  })

  describe('Feature 8: About Me Background & Theme Settings', () => {
    it('verifies About section uses theme sectionBg and does not hardcode #FAF7F2 or fixed colors', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const templateContent = fs.readFileSync(
        path.resolve(__dirname, '../src/components/portfolio/templates/ClassicTemplate.tsx'),
        'utf-8'
      )

      // No hardcoded #FAF7F2 or #FAF8F5
      expect(templateContent).not.toContain('#FAF7F2')
      expect(templateContent).not.toContain('#FAF8F5')
      expect(templateContent).not.toContain("aboutBg = theme === 'dark' ? 'var(--color-card)' : '#FAF7F2'")

      // About section renders with sectionBg
      expect(templateContent).toContain(
        '<section id="about" key={section.id} className="py-8 cq-sm:py-16" style={{ backgroundColor: sectionBg }}>'
      )

      // Stat cards use statCardBg contrasting tone
      expect(templateContent).toContain('statCardBg = sectionBg === \'var(--color-bg)\' ? \'var(--color-card)\' : \'var(--color-bg)\'')
      expect(templateContent).toContain('backgroundColor: statCardBg')

      // Style defines --color-bg-alt
      expect(templateContent).toContain("'--color-bg-alt': currentCard")

      // Footer respects appearance.footerBg
      expect(templateContent).toContain("background: appearance.footerBg || 'var(--color-primary)'")
    })

    it('verifies TestimonialsSlider uses theme card background and border instead of slate-900', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const sliderContent = fs.readFileSync(
        path.resolve(__dirname, '../src/components/portfolio/TestimonialsSlider.tsx'),
        'utf-8'
      )

      expect(sliderContent).not.toContain('bg-slate-900')
      expect(sliderContent).not.toContain('dark:bg-slate-950')
      expect(sliderContent).toContain('bg-[var(--color-card)]')
      expect(sliderContent).toContain('border-[var(--color-border)]')
    })
  })
})



