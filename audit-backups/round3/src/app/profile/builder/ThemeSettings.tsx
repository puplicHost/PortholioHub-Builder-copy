/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useId, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { uploadToCloudinary } from '@/lib/cloudinary'

function ColorField({
  label,
  value,
  defaultValue,
  onChange,
  hint,
}: {
  label: string
  value?: string
  defaultValue: string
  onChange: (val: string) => void
  hint?: string
}) {
  const uid = useId()
  // Normalize for swatch display: if user types "60a5fa" or "#60a5fa", format to valid hex
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
          className="h-9 w-9 shrink-0 rounded-lg border border-[var(--color-border)] shadow-sm relative overflow-hidden cursor-pointer"
          style={{ backgroundColor: swatchColor }}
          title="Click to open color picker"
        >
          <input
            id={uid}
            type="color"
            value={swatchColor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-[-10px] w-[50px] h-[50px] cursor-pointer opacity-0"
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
          className="flex-1 uppercase font-mono text-xs h-9"
        />
      </div>
      {hint && <p className="text-[10px] text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  )
}

export function ThemeSettings({ profile, updateProfile }: { profile: any, updateProfile: any }) {
  const appearance = profile.appearance || {}
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const handleAppearanceChange = (key: string, value: string) => {
    updateProfile((p: any) => ({
      ...p,
      appearance: { ...p.appearance, [key]: value }
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

  return (
    <div className="space-y-6">
      {/* Portfolio Settings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Portfolio Settings</h3>
          <Button variant="ghost" size="sm" onClick={handleResetDefaults} className="h-7 text-xs px-2 text-[var(--color-primary)] cursor-pointer">
            Reset to defaults
          </Button>
        </div>
        <div className="space-y-3">
          <div>
            <label htmlFor="theme-username" className="text-xs text-[var(--color-text-secondary)]">Username (URL)</label>
            <Input 
              id="theme-username"
              value={profile.username || ''} 
              onChange={e => updateProfile((p:any) => ({...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')}))} 
              className="mt-1" 
              placeholder="e.g. john" 
            />
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">portfoliohub.com/u/{profile.username || ''}</p>
          </div>

          <div>
            <label htmlFor="theme-color-mode" className="text-xs text-[var(--color-text-secondary)]">Default Color Mode</label>
            <select 
              id="theme-color-mode"
              value={appearance.colorMode || 'light'} 
              onChange={e => handleAppearanceChange('colorMode', e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label htmlFor="theme-font" className="text-xs text-[var(--color-text-secondary)]">Font Family</label>
            <select 
              id="theme-font"
              value={appearance.font || 'Inter'} 
              onChange={e => handleAppearanceChange('font', e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <option value="Inter">Inter</option>
              <option value="Poppins">Poppins</option>
              <option value="Raleway">Raleway</option>
              <option value="Nunito">Nunito</option>
              <option value="Lato">Lato</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Rubik">Rubik</option>
              <optgroup label="— Luxury Serif —">
                <option value="Playfair Display">Playfair Display</option>
                <option value="Cormorant Garamond">Cormorant Garamond</option>
                <option value="DM Serif Display">DM Serif Display</option>
                <option value="Bodoni Moda">Bodoni Moda</option>
                <option value="Libre Baskerville">Libre Baskerville</option>
                <option value="Lora">Lora</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* 🎨 Site Colors */}
      <div className="border-t border-[var(--color-border)] pt-6 space-y-5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <span>🎨</span> Site Colors
        </h3>

        {/* Light Mode */}
        <div className="space-y-3 p-3.5 rounded-xl border border-[var(--color-border)] bg-gray-50/50 dark:bg-gray-800/30">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">Light Mode</h4>
          <ColorField
            label="Background Color (light)"
            value={appearance.bgColorLight}
            defaultValue="#f9fafb"
            onChange={(val) => handleAppearanceChange('bgColorLight', val)}
          />
          <ColorField
            label="Text Color (light)"
            value={appearance.textColorLight}
            defaultValue="#1f2937"
            onChange={(val) => handleAppearanceChange('textColorLight', val)}
          />
        </div>

        {/* Dark Mode */}
        <div className="space-y-3 p-3.5 rounded-xl border border-[var(--color-border)] bg-gray-50/50 dark:bg-gray-800/30">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">Dark Mode</h4>
          <ColorField
            label="Background Color (dark)"
            value={appearance.bgColorDark}
            defaultValue="#111827"
            onChange={(val) => handleAppearanceChange('bgColorDark', val)}
          />
          <ColorField
            label="Text Color (dark)"
            value={appearance.textColorDark}
            defaultValue="#f3f4f6"
            onChange={(val) => handleAppearanceChange('textColorDark', val)}
          />
        </div>

        {/* Global (apply to both modes) */}
        <div className="space-y-3 p-3.5 rounded-xl border border-[var(--color-border)] bg-gray-50/50 dark:bg-gray-800/30">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">Global (apply to both modes)</h4>
          <ColorField
            label="Primary Color"
            value={appearance.primaryColor}
            defaultValue="#60a5fa"
            onChange={(val) => handleAppearanceChange('primaryColor', val)}
          />
          <ColorField
            label="Border Color"
            value={appearance.borderColor}
            defaultValue="#e5e7eb"
            onChange={(val) => handleAppearanceChange('borderColor', val)}
            hint="Controls box and card borders across the site."
          />
          <ColorField
            label="Outline / Focus Color"
            value={appearance.outlineColor}
            defaultValue="#60a5fa"
            onChange={(val) => handleAppearanceChange('outlineColor', val)}
            hint="Controls focus rings and outlines across the site."
          />
        </div>
      </div>

      {/* Language */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <h3 className="text-sm font-semibold mb-3">Language & Direction</h3>
        <div>
          <label htmlFor="theme-language" className="text-xs text-[var(--color-text-secondary)]">Portfolio Language</label>
          <select
            id="theme-language"
            value={appearance.defaultLanguage || 'en'} 
            onChange={(e) => handleAppearanceChange('defaultLanguage', e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text-primary)] focus-visible:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] cursor-pointer"
          >
            <option value="en">English (LTR)</option>
            <option value="ar">العربية (RTL)</option>
            <option value="both">Both (Multilingual Toggle)</option>
          </select>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
            Sets the primary display direction and language for your public portfolio.
          </p>
        </div>
      </div>

      {/* Branding */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <h3 className="text-sm font-semibold mb-3">Branding</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="theme-logo-url" className="text-xs text-[var(--color-text-secondary)]">Logo Image</label>
            <div className="flex gap-2 mt-1">
              <Input
                id="theme-logo-url"
                value={appearance.logoUrl || ''} 
                onChange={e => handleAppearanceChange('logoUrl', e.target.value)}
                placeholder="Image URL"
                className="flex-1"
              />
              <div className="relative overflow-hidden shrink-0">
                <Button variant="secondary" className="h-9 px-3" disabled={uploadingLogo} aria-label="Upload logo image">
                  {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
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
                  }}
                />
              </div>
            </div>
            {appearance.logoUrl && (
              <img src={appearance.logoUrl} alt="Logo Preview" className="mt-2 h-9 w-auto object-contain border border-[var(--color-border)] rounded" />
            )}
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Shown in the navbar. Leave empty to show initials.</p>
          </div>
        </div>
      </div>

      {/* Floating Buttons */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <h3 className="text-sm font-semibold mb-3">Floating Buttons</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="theme-show-scroll-top" className="text-xs text-[var(--color-text-secondary)]">Show Scroll to Top Button</label>
            <button
              type="button"
              id="theme-show-scroll-top"
              role="switch"
              aria-checked={(appearance.actionButtons || {}).showScrollToTop !== false}
              aria-label="Show scroll to top button"
              onClick={() => handleActionButtonChange('showScrollToTop', !((appearance.actionButtons || {}).showScrollToTop !== false))}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                (appearance.actionButtons || {}).showScrollToTop !== false ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  (appearance.actionButtons || {}).showScrollToTop !== false ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="theme-show-whatsapp" className="text-xs text-[var(--color-text-secondary)]">Show WhatsApp Floating Button</label>
              <button
                type="button"
                id="theme-show-whatsapp"
                role="switch"
                aria-checked={(appearance.actionButtons || {}).showWhatsapp !== false}
                aria-label="Show WhatsApp floating button"
                onClick={() => handleActionButtonChange('showWhatsapp', !((appearance.actionButtons || {}).showWhatsapp !== false))}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  (appearance.actionButtons || {}).showWhatsapp !== false ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    (appearance.actionButtons || {}).showWhatsapp !== false ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div>
              <label htmlFor="theme-whatsapp-number" className="text-xs text-[var(--color-text-secondary)]">WhatsApp Phone Number</label>
              <Input
                id="theme-whatsapp-number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={(appearance.actionButtons || {}).whatsappNumber || ''}
                onChange={e => handleActionButtonChange('whatsappNumber', e.target.value)}
                placeholder="+201234567890"
                className="mt-1"
              />
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Include country code (e.g. +20...).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
