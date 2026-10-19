/* eslint-disable @typescript-eslint/no-explicit-any */
// Single source of truth for section visibility (Round 3, item 3).
//
// Historically the flag lived in TWO places and different code paths wrote
// different ones: the drag/toggle handles wrote top-level `visible`, while
// SectionManager wrote `settings.isVisible`. The template then trusted
// `visible` first, so a section hidden via SectionManager (which left
// `visible === true` behind) stayed visible on the page.
//
// To stay backward compatible with every legacy row, a section is considered
// HIDDEN when EITHER representation says false, and visible otherwise.

export function isSectionVisible(section: any): boolean {
  if (!section || typeof section !== 'object') return true
  if (section.visible === false) return false
  const settings = section.settings
  if (settings) {
    try {
      const parsed = typeof settings === 'string' ? JSON.parse(settings) : settings
      const v = parsed?.isVisible
      if (v === false || v === 'false') return false
    } catch {
      // Malformed settings — fall through and treat the section as visible.
    }
  }
  return true
}

// Returns a shallow copy of the section with the visibility written to BOTH
// representations, so every reader (template, builder list, publish check)
// agrees.
export function withSectionVisibility(section: any, visible: boolean): any {
  let prevSettings: Record<string, unknown> = {}
  const settings = section?.settings
  if (settings) {
    try {
      prevSettings = typeof settings === 'string' ? JSON.parse(settings) : settings
    } catch {
      prevSettings = {}
    }
  }
  if (!prevSettings || typeof prevSettings !== 'object') prevSettings = {}
  return { ...section, visible, settings: { ...prevSettings, isVisible: visible } }
}
