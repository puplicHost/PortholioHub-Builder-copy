/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useId, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { getPortfolioLang } from '@/lib/portfolio-language'
import { useBuilderI18n } from './i18n/BuilderI18nContext'
import { Select } from './ui/Select'
import { FileButton } from './ui/FileButton'

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

export function ThemeSettings({ profile, updateProfile }: { profile: any, updateProfile: any }) {
  const { t } = useBuilderI18n()
  const appearance = profile.appearance || {}
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const handleAppearanceChange = (key: string, value: string) => {
    updateProfile((p: any) => ({
      ...p,
      appearance: { ...p.appearance, [key]: value }
    }))
  }

  const handleLanguageChange = (value: string) => {
    updateProfile((p: any) => ({
      ...p,
      appearance: { ...p.appearance, n: value, defaultLanguage: value }
    }))
  }

  const handleResetDefaults = () => {
    updateProfile((p: any) => ({
      ...p,
      appearance: {
        ...p.appearance,
        primaryColor: '#60a5fa',
        borderColor: '#e5e7eb',
        outlineColor: '#60a5fa',
        bgColorLight: '#f9fafb',
        textColorLight: '#1f2937',
        bgColorDark: '#111827',
        textColorDark: '#f3f4f6',
        font: 'Inter'
      }
    }))
  }

  const handleActionButtonChange = (key: string, value: any) => {
    updateProfile((p: any) => ({
      ...p,
      appearance: {
        ...p.appearance,
        actionButtons: { ...(p.appearance?.actionButtons || {}), [key]: value }
      }
    }))
  }

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return
    setUploadingLogo(true)
    try {
      const result = await uploadToCloudinary(file)
      handleAppearanceChange('logoUrl', result.url)
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingLogo(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t('theme.portfolioSettings')}</h3>
          <Button variant="ghost" size="sm" onClick={handleResetDefaults} className="h-7 px-2 text-xs text-[var(--color-primary)] cursor-pointer">
            {t('theme.resetDefaults')}
          </Button>
        </div>
        <div className="space-y-3">
          <div>
            <label htmlFor="theme-username" className="text-xs text-[var(--color-text-secondary)]">{t('theme.username')}</label>
            <Input
              id="theme-username"
              value={profile.username || ''}
              onChange={e => updateProfile((p: any) => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
              className="mt-1"
              placeholder={t('placeholder.username')}
            />
            <p className="mt-1 text-[10px] text-[var(--color-text-muted)]" dir="ltr">portfoliohub.com/u/{profile.username || ''}</p>
          </div>

          <div>
            <label htmlFor="theme-color-mode" className="text-xs text-[var(--color-text-secondary)]">{t('theme.defaultColorMode')}</label>
            <Select
              id="theme-color-mode"
              className="mt-1"
              value={appearance.colorMode || 'light'}
              onChange={(value) => handleAppearanceChange('colorMode', value)}
              options={[
                { value: 'light', label: t('theme.light') },
                { value: 'dark', label: t('theme.dark') },
              ]}
            />
          </div>

          <div>
            <label htmlFor="theme-font" className="text-xs text-[var(--color-text-secondary)]">{t('theme.fontFamily')}</label>
            <Select
              id="theme-font"
              className="mt-1"
              value={appearance.font || 'Inter'}
              onChange={(value) => handleAppearanceChange('font', value)}
              options={[
                { value: 'Inter', label: 'Inter' },
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
      </div>

      <div className="space-y-5 border-t border-[var(--color-border)] pt-6">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <span>🎨</span> {t('theme.siteColors')}
        </h3>

        <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-gray-50/50 p-3.5 dark:bg-gray-800/30">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">{t('theme.lightMode')}</h4>
          <ColorField
            label={t('theme.bgLight')}
            value={appearance.bgColorLight}
            defaultValue="#f9fafb"
            onChange={(val) => handleAppearanceChange('bgColorLight', val)}
            pickerLabel={t('misc.openColorPicker')}
          />
          <ColorField
            label={t('theme.textLight')}
            value={appearance.textColorLight}
            defaultValue="#1f2937"
            onChange={(val) => handleAppearanceChange('textColorLight', val)}
            pickerLabel={t('misc.openColorPicker')}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-gray-50/50 p-3.5 dark:bg-gray-800/30">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">{t('theme.darkMode')}</h4>
          <ColorField
            label={t('theme.bgDark')}
            value={appearance.bgColorDark}
            defaultValue="#111827"
            onChange={(val) => handleAppearanceChange('bgColorDark', val)}
            pickerLabel={t('misc.openColorPicker')}
          />
          <ColorField
            label={t('theme.textDark')}
            value={appearance.textColorDark}
            defaultValue="#f3f4f6"
            onChange={(val) => handleAppearanceChange('textColorDark', val)}
            pickerLabel={t('misc.openColorPicker')}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-gray-50/50 p-3.5 dark:bg-gray-800/30">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">{t('theme.global')}</h4>
          <ColorField
            label={t('theme.primaryColor')}
            value={appearance.primaryColor}
            defaultValue="#60a5fa"
            onChange={(val) => handleAppearanceChange('primaryColor', val)}
            pickerLabel={t('misc.openColorPicker')}
          />
          <ColorField
            label={t('theme.borderColor')}
            value={appearance.borderColor}
            defaultValue="#e5e7eb"
            onChange={(val) => handleAppearanceChange('borderColor', val)}
            hint={t('theme.borderHint')}
            pickerLabel={t('misc.openColorPicker')}
          />
          <ColorField
            label={t('theme.outlineColor')}
            value={appearance.outlineColor}
            defaultValue="#60a5fa"
            onChange={(val) => handleAppearanceChange('outlineColor', val)}
            hint={t('theme.outlineHint')}
            pickerLabel={t('misc.openColorPicker')}
          />
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] pt-6">
        <h3 className="mb-3 text-sm font-semibold">{t('theme.languageDirection')}</h3>
        <div>
          <label htmlFor="theme-language" className="text-xs text-[var(--color-text-secondary)]">{t('theme.portfolioLanguage')}</label>
          <Select
            id="theme-language"
            className="mt-1"
            value={getPortfolioLang(appearance)}
            onChange={handleLanguageChange}
            options={[
              { value: 'en', label: t('theme.englishLtr') },
              { value: 'ar', label: t('theme.arabicRtl') },
              { value: 'both', label: t('theme.both') },
            ]}
          />
          <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
            {t('theme.languageHint')}
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] pt-6">
        <h3 className="mb-3 text-sm font-semibold">{t('theme.branding')}</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="theme-logo-url" className="text-xs text-[var(--color-text-secondary)]">{t('theme.logoImage')}</label>
            <div className="mt-1 flex gap-2">
              <Input
                id="theme-logo-url"
                value={appearance.logoUrl || ''}
                onChange={e => handleAppearanceChange('logoUrl', e.target.value)}
                placeholder={t('placeholder.imageUrl')}
                className="flex-1"
              />
              <FileButton
                accept="image/*"
                disabled={uploadingLogo}
                onFiles={(files) => void handleLogoUpload(files?.[0])}
                aria-label={t('theme.uploadLogoAria')}
                className="h-10 shrink-0 px-3 text-xs"
              >
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingLogo ? t('common.uploading') : t('common.upload')}
              </FileButton>
            </div>
            {appearance.logoUrl && (
              <img src={appearance.logoUrl} alt={t('misc.logoPreview')} className="mt-2 h-9 w-auto rounded border border-[var(--color-border)] object-contain" />
            )}
            <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{t('theme.logoHint')}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] pt-6">
        <h3 className="mb-3 text-sm font-semibold">{t('theme.floatingButtons')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="theme-show-scroll-top" className="text-xs text-[var(--color-text-secondary)]">{t('theme.showScrollTop')}</label>
            <button
              type="button"
              id="theme-show-scroll-top"
              role="switch"
              aria-checked={(appearance.actionButtons || {}).showScrollToTop !== false}
              aria-label={t('theme.showScrollTopAria')}
              onClick={() => handleActionButtonChange('showScrollToTop', !((appearance.actionButtons || {}).showScrollToTop !== false))}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                (appearance.actionButtons || {}).showScrollToTop !== false ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  (appearance.actionButtons || {}).showScrollToTop !== false
                    ? 'translate-x-0 ltr:translate-x-4 rtl:-translate-x-4'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="theme-show-whatsapp" className="text-xs text-[var(--color-text-secondary)]">{t('theme.showWhatsapp')}</label>
              <button
                type="button"
                id="theme-show-whatsapp"
                role="switch"
                aria-checked={(appearance.actionButtons || {}).showWhatsapp !== false}
                aria-label={t('theme.showWhatsappAria')}
                onClick={() => handleActionButtonChange('showWhatsapp', !((appearance.actionButtons || {}).showWhatsapp !== false))}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  (appearance.actionButtons || {}).showWhatsapp !== false ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    (appearance.actionButtons || {}).showWhatsapp !== false
                      ? 'translate-x-0 ltr:translate-x-4 rtl:-translate-x-4'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div>
              <label htmlFor="theme-whatsapp-number" className="text-xs text-[var(--color-text-secondary)]">{t('theme.whatsappNumber')}</label>
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
        </div>
      </div>
    </div>
  )
}
