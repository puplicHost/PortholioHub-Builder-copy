/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useId, useState } from 'react'
import { Moon, RotateCcw, Sun } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useBuilderI18n } from './i18n/BuilderI18nContext'
import { Select } from './ui/Select'

type ColorMode = 'light' | 'dark' | 'light-with-toggle' | 'dark-with-toggle'

function ColorField({
  label,
  value,
  defaultValue,
  onChange,
  hint,
  pickerLabel,
}: {
  label: string
  value?: string
  defaultValue: string
  onChange: (val: string) => void
  hint?: string
  pickerLabel: string
}) {
  const uid = useId()
  const clean = (raw: string) => {
    if (!raw) return defaultValue
    const trimmed = raw.trim()
    const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(withHash) ? withHash : defaultValue
  }

  const swatchColor = clean(value || '')

  return (
    <div className="space-y-1">
      <label htmlFor={uid} className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</label>
      <div className="flex gap-2 items-center">
        <div
          className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border)] shadow-sm cursor-pointer"
          style={{ backgroundColor: swatchColor }}
          title={pickerLabel}
        >
          <input
            id={uid}
            type="color"
            value={swatchColor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-[-10px] h-[50px] w-[50px] cursor-pointer opacity-0"
            aria-label={label}
          />
        </div>
        <Input
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            const trimmed = raw.trim()
            if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(trimmed)) {
              onChange(`#${trimmed}`)
            } else {
              onChange(raw)
            }
          }}
          placeholder={defaultValue}
          className="h-9 flex-1 font-mono text-xs uppercase"
        />
      </div>
      {hint && <p className="text-[10px] text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  )
}

function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
        checked ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-0 ltr:translate-x-4 rtl:-translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export function ThemeSettings({ profile, updateProfile }: { profile: any, updateProfile: any }) {
  const { t } = useBuilderI18n()
  const appearance = profile.appearance || {}
  const [colorTab, setColorTab] = useState<'light' | 'dark'>('light')

  const defaultColorMode: ColorMode = appearance.defaultColorMode || 'dark-with-toggle'
  const showToggleOption = defaultColorMode.includes('with-toggle')

  const handleAppearanceChange = (key: string, value: any) => {
    updateProfile((p: any) => ({
      ...p,
      appearance: { ...p.appearance, [key]: value },
    }))
  }

  const handleDefaultColorModeChange = (mode: ColorMode) => {
    updateProfile((p: any) => ({
      ...p,
      appearance: { ...p.appearance, defaultColorMode: mode },
    }))
  }

  const handleActionButtonChange = (key: string, value: any) => {
    updateProfile((p: any) => ({
      ...p,
      appearance: {
        ...p.appearance,
        actionButtons: { ...(p.appearance?.actionButtons || {}), [key]: value },
      },
    }))
  }

  const handleResetDefaults = () => {
    updateProfile((p: any) => ({
      ...p,
      appearance: {
        ...p.appearance,
        primaryColor: '#38BDF8',
        accentColor: '#818CF8',
        outlineColor: '#38BDF8',
        bgColorLight: '#F0F9FF',
        bgColorDark: '#111827',
        cardBackground: '#FFFFFF',
        cardBackgroundDark: '#374151',
        textColorLight: '#0F172A',
        textColorDark: '#E5E7EB',
        mutedText: '#64748B',
        mutedTextDark: '#858688',
        borderColor: '#BAE6FD',
        borderColorDark: '#4B5563',
        showThemeToggle: true,
        defaultColorMode: 'dark-with-toggle',
        font: 'Cairo',
      },
    }))
  }

  const modeButtonClass = (mode: ColorMode) =>
    `flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
      defaultColorMode === mode
        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
    }`

  return (
    <div className="space-y-6">
      {/* Section 1: Portfolio Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <span>⚙️</span> {t('theme.portfolioSettings')}
          </h3>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] dark:hover:bg-white/5"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            {t('theme.resetDefaults')}
          </button>
        </div>

        <div>
          <label htmlFor="theme-username" className="text-xs font-medium text-[var(--color-text-secondary)]">
            {t('theme.username')}
          </label>
          <Input
            id="theme-username"
            dir="ltr"
            value={profile.username || ''}
            onChange={(e) =>
              updateProfile((p: any) => ({ ...p, username: e.target.value.toLowerCase() }))
            }
            placeholder="your-name"
            maxLength={30}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="mt-1 font-mono text-xs"
          />
          <p className="mt-1 truncate text-[10px] text-[var(--color-text-muted)]" dir="ltr">
            portfoliohub.com/u/
            <span className="font-medium text-[var(--color-text-secondary)]">
              {profile.username || 'username'}
            </span>
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            {t('theme.defaultColorMode')}
          </label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={modeButtonClass('light')}
              onClick={() => handleDefaultColorModeChange('light')}
              aria-pressed={defaultColorMode === 'light'}
              title={t('theme.lightOnly')}
            >
              <Sun className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t('theme.light')}
            </button>
            <button
              type="button"
              className={modeButtonClass('dark')}
              onClick={() => handleDefaultColorModeChange('dark')}
              aria-pressed={defaultColorMode === 'dark'}
              title={t('theme.darkOnly')}
            >
              <Moon className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t('theme.dark')}
            </button>
            <button
              type="button"
              className={modeButtonClass('light-with-toggle')}
              onClick={() => handleDefaultColorModeChange('light-with-toggle')}
              aria-pressed={defaultColorMode === 'light-with-toggle'}
              title={t('theme.lightToggle')}
            >
              <Sun className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <Moon className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t('theme.lightToggle')}
            </button>
            <button
              type="button"
              className={modeButtonClass('dark-with-toggle')}
              onClick={() => handleDefaultColorModeChange('dark-with-toggle')}
              aria-pressed={defaultColorMode === 'dark-with-toggle'}
              title={t('theme.darkToggle')}
            >
              <Moon className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <Sun className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t('theme.darkToggle')}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-[var(--color-text-muted)]">
            {t('theme.toggleLetsVisitorsSwitch')}
          </p>
        </div>

        <div>
          <label htmlFor="theme-font" className="text-xs font-medium text-[var(--color-text-secondary)]">
            {t('theme.fontFamily')}
          </label>
          <Select
            id="theme-font"
            className="mt-1"
            value={appearance.font || 'Inter'}
            onChange={(value) => handleAppearanceChange('font', value)}
            options={[
              { value: 'Inter', label: 'Inter' },
              { value: 'Cairo', label: 'Cairo' },
              { value: 'Poppins', label: 'Poppins' },
              { value: 'Raleway', label: 'Raleway' },
              { value: 'Nunito', label: 'Nunito' },
              { value: 'Lato', label: 'Lato' },
              { value: 'Montserrat', label: 'Montserrat' },
              { value: 'Rubik', label: 'Rubik' },
              {
                label: t('theme.luxurySerif'),
                options: [
                  { value: 'Playfair Display', label: 'Playfair Display' },
                  { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
                  { value: 'DM Serif Display', label: 'DM Serif Display' },
                  { value: 'Bodoni Moda', label: 'Bodoni Moda' },
                  { value: 'Libre Baskerville', label: 'Libre Baskerville' },
                  { value: 'Lora', label: 'Lora' },
                ],
              },
            ]}
          />
        </div>
      </div>

      {/* Section 2: Colors (Light / Dark tabs) */}
      <div className="space-y-4 border-t border-[var(--color-border)] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <span>🎨</span> {t('theme.siteColors')}
          </h3>
          <div
            role="tablist"
            aria-label={t('theme.siteColors')}
            className="flex items-center rounded-lg border border-[var(--color-border)] p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={colorTab === 'light'}
              onClick={() => setColorTab('light')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                colorTab === 'light'
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Sun className="h-3.5 w-3.5" aria-hidden="true" />
              {t('theme.lightMode')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={colorTab === 'dark'}
              onClick={() => setColorTab('dark')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                colorTab === 'dark'
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Moon className="h-3.5 w-3.5" aria-hidden="true" />
              {t('theme.darkMode')}
            </button>
          </div>
        </div>

        {colorTab === 'light' ? (
          <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-gray-50/50 p-3.5 dark:bg-gray-800/30">
            <ColorField
              label={t('theme.bgLight')}
              value={appearance.bgColorLight}
              defaultValue="#F0F9FF"
              onChange={(val) => handleAppearanceChange('bgColorLight', val)}
              pickerLabel={t('misc.openColorPicker')}
            />
            <ColorField
              label={t('theme.cardBackground')}
              value={appearance.cardBackground}
              defaultValue="#FFFFFF"
              onChange={(val) => handleAppearanceChange('cardBackground', val)}
              pickerLabel={t('misc.openColorPicker')}
            />
            <ColorField
              label={t('theme.textLight')}
              value={appearance.textColorLight}
              defaultValue="#0F172A"
              onChange={(val) => handleAppearanceChange('textColorLight', val)}
              pickerLabel={t('misc.openColorPicker')}
            />
            <ColorField
              label={t('theme.mutedText')}
              value={appearance.mutedText}
              defaultValue="#64748B"
              onChange={(val) => handleAppearanceChange('mutedText', val)}
              pickerLabel={t('misc.openColorPicker')}
            />
            <ColorField
              label={t('theme.borderColor')}
              value={appearance.borderColor}
              defaultValue="#BAE6FD"
              onChange={(val) => handleAppearanceChange('borderColor', val)}
              hint={t('theme.borderHint')}
              pickerLabel={t('misc.openColorPicker')}
            />
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-gray-50/50 p-3.5 dark:bg-gray-800/30">
            <ColorField
              label={t('theme.bgDark')}
              value={appearance.bgColorDark}
              defaultValue="#111827"
              onChange={(val) => handleAppearanceChange('bgColorDark', val)}
              pickerLabel={t('misc.openColorPicker')}
            />
            <ColorField
              label={t('theme.cardBackgroundDark')}
              value={appearance.cardBackgroundDark}
              defaultValue="#374151"
              onChange={(val) => handleAppearanceChange('cardBackgroundDark', val)}
              pickerLabel={t('misc.openColorPicker')}
            />
            <ColorField
              label={t('theme.textDark')}
              value={appearance.textColorDark}
              defaultValue="#E5E7EB"
              onChange={(val) => handleAppearanceChange('textColorDark', val)}
              pickerLabel={t('misc.openColorPicker')}
            />
            <ColorField
              label={t('theme.mutedTextDark')}
              value={appearance.mutedTextDark}
              defaultValue="#858688"
              onChange={(val) => handleAppearanceChange('mutedTextDark', val)}
              pickerLabel={t('misc.openColorPicker')}
            />
            <ColorField
              label={t('theme.borderColorDark')}
              value={appearance.borderColorDark}
              defaultValue="#4B5563"
              onChange={(val) => handleAppearanceChange('borderColorDark', val)}
              pickerLabel={t('misc.openColorPicker')}
            />
          </div>
        )}
      </div>

      {/* Section 3: Primary & Accent */}
      <div className="space-y-4 border-t border-[var(--color-border)] pt-6">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <span>✨</span> {t('theme.accentAndPrimary')}
        </h3>
        <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-gray-50/50 p-3.5 dark:bg-gray-800/30">
          <ColorField
            label={t('theme.primaryColor')}
            value={appearance.primaryColor}
            defaultValue="#38BDF8"
            onChange={(val) => handleAppearanceChange('primaryColor', val)}
            pickerLabel={t('misc.openColorPicker')}
          />
          <ColorField
            label={t('theme.accentColor')}
            value={appearance.accentColor}
            defaultValue="#818CF8"
            onChange={(val) => handleAppearanceChange('accentColor', val)}
            hint={t('theme.accentColorDesc')}
            pickerLabel={t('misc.openColorPicker')}
          />
          <ColorField
            label={t('theme.outlineColor')}
            value={appearance.outlineColor}
            defaultValue="#38BDF8"
            onChange={(val) => handleAppearanceChange('outlineColor', val)}
            hint={t('theme.outlineHint')}
            pickerLabel={t('misc.openColorPicker')}
          />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            {t('theme.gradientPreview')}
          </span>
          <div
            className="h-14 w-full rounded-xl border border-[var(--color-border)]"
            style={{
              backgroundImage: `linear-gradient(135deg, ${appearance.primaryColor || '#38BDF8'}, ${appearance.accentColor || '#818CF8'})`,
            }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Section 4: Floating Buttons */}
      <div className="space-y-4 border-t border-[var(--color-border)] pt-6">
        <h3 className="text-sm font-semibold">{t('theme.floatingButtons')}</h3>

        <div className="flex items-center justify-between gap-3">
          <label htmlFor="theme-show-scroll-top" className="text-xs text-[var(--color-text-secondary)]">
            {t('theme.showScrollTop')}
          </label>
          <Toggle
            id="theme-show-scroll-top"
            label={t('theme.showScrollTopAria')}
            checked={(appearance.actionButtons || {}).showScrollToTop !== false}
            onChange={(next) => handleActionButtonChange('showScrollToTop', next)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="theme-show-whatsapp" className="text-xs text-[var(--color-text-secondary)]">
              {t('theme.showWhatsapp')}
            </label>
            <Toggle
              id="theme-show-whatsapp"
              label={t('theme.showWhatsappAria')}
              checked={(appearance.actionButtons || {}).showWhatsapp !== false}
              onChange={(next) => handleActionButtonChange('showWhatsapp', next)}
            />
          </div>
          <div>
            <label htmlFor="theme-whatsapp-number" className="text-xs text-[var(--color-text-secondary)]">
              {t('theme.whatsappNumber')}
            </label>
            <Input
              id="theme-whatsapp-number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              value={(appearance.actionButtons || {}).whatsappNumber || ''}
              onChange={e => handleActionButtonChange('whatsappNumber', e.target.value)}
              placeholder="+201234567890"
              className="mt-1"
            />
            <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{t('theme.whatsappHint')}</p>
          </div>
        </div>

        {showToggleOption && (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="theme-show-toggle" className="text-xs text-[var(--color-text-secondary)]">
                {t('theme.themeToggleInNavbar')}
              </label>
              <Toggle
                id="theme-show-toggle"
                label={t('theme.themeToggleInNavbar')}
                checked={appearance.showThemeToggle !== false}
                onChange={(next) => handleAppearanceChange('showThemeToggle', next)}
              />
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {t('theme.themeToggleInNavbarHint')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
