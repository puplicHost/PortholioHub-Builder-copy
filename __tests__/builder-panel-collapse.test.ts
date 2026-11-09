import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(
  resolve(process.cwd(), 'src/app/profile/builder/BuilderClient.tsx'),
  'utf8',
)

describe('Builder side-panel collapse wiring', () => {
  it('tracks left and right panel state independently', () => {
    expect(source).toContain('const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)')
    expect(source).toContain('const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)')
    expect(source).toContain('onClick={() => setLeftPanelCollapsed((v) => !v)}')
    expect(source).toContain('onClick={() => setRightPanelCollapsed((v) => !v)}')
  })

  it('removes each desktop aside only when its own panel is collapsed', () => {
    expect(source).toMatch(/\{!leftPanelCollapsed && \(\s*<aside\s+id="builder-left-panel"/)
    expect(source).toMatch(/\{!rightPanelCollapsed && \(\s*<aside\s+id="builder-right-panel"/)
  })

  it('exposes accessible expanded state and reopen controls', () => {
    expect(source).toContain('aria-expanded={!leftPanelCollapsed}')
    expect(source).toContain('aria-expanded={!rightPanelCollapsed}')
    expect(source).toContain('aria-controls="builder-left-panel"')
    expect(source).toContain('aria-controls="builder-right-panel"')
    expect(source).toContain("t('labels.openSections')")
    expect(source).toContain("t('labels.openEditor')")
  })
})
