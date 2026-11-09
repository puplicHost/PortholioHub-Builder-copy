/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Download, Maximize2, Minimize2, ZoomIn, ZoomOut,
  Loader2, AlertCircle, FileText,
} from 'lucide-react'

interface Props {
  id: string
  filename: string
  mimeType: string
  size: number
  lang: 'ar' | 'en'
  backHref: string | null
  contentUrl: string
  downloadUrl: string
}

type Kind = 'pdf' | 'docx' | 'spreadsheet' | 'pptx' | 'image' | 'video' | 'text' | 'other'

function ext(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

function detectKind(mime: string, name: string): Kind {
  const e = ext(name)
  if (mime === 'application/pdf' || e === 'pdf') return 'pdf'
  if (e === 'docx' || mime.includes('wordprocessingml')) return 'docx'
  if (['xlsx', 'xls', 'csv'].includes(e) || mime.includes('spreadsheet') || mime === 'text/csv') return 'spreadsheet'
  if (['pptx', 'ppt'].includes(e) || mime.includes('presentation')) return 'pptx'
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'log'].includes(e)) return 'text'
  return 'other'
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const blocked = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form', 'input', 'button']
  blocked.forEach((tag) => doc.querySelectorAll(tag).forEach((el) => el.remove()))
  doc.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim().toLowerCase()
      const unsafeScheme = /^(javascript|data|vbscript|file):/i.test(value)
      if (name.startsWith('on') || name === 'srcdoc' || ((name === 'href' || name === 'src' || name === 'srcset') && unsafeScheme)) {
        el.removeAttribute(attr.name)
      }
    }
  })
  return doc.body.innerHTML
}

const LABELS = {
  en: {
    back: 'Back to portfolio', download: 'Download', fullscreen: 'Fullscreen', exitFullscreen: 'Exit fullscreen',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', page: 'Page', of: 'of', sheet: 'Sheet', slide: 'Slide',
    loading: 'Loading preview…', error: 'Could not load the preview.', unsupported: 'In-browser preview is unavailable for this file type.',
    downloadHint: 'Use the Download button to open the original file.', retry: 'Retry', rows: 'Rows', limited: 'Showing first 200 rows.',
  },
  ar: {
    back: 'العودة إلى البورتفوليو', download: 'تنزيل', fullscreen: 'ملء الشاشة', exitFullscreen: 'إنهاء ملء الشاشة',
    zoomIn: 'تكبير', zoomOut: 'تصغير', page: 'صفحة', of: 'من', sheet: 'ورقة', slide: 'شريحة',
    loading: 'جارٍ تحميل المعاينة…', error: 'تعذر تحميل المعاينة.', unsupported: 'المعاينة داخل المتصفح غير متاحة لهذا النوع من الملفات.',
    downloadHint: 'استخدم زر التنزيل لفتح الملف الأصلي.', retry: 'إعادة المحاولة', rows: 'صفوف', limited: 'يتم عرض أول 200 صف.',
  },
} as const

export function FileViewer(props: Props) {
  const { filename, mimeType, size, lang, backHref, contentUrl, downloadUrl } = props
  const t = LABELS[lang]
  const kind = useMemo(() => detectKind(mimeType, filename), [mimeType, filename])
  const containerRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen()
        setFullscreen(true)
      } else {
        await document.exitFullscreen()
        setFullscreen(false)
      }
    } catch {
      setFullscreen((v) => !v)
    }
  }, [])

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  return (
    <div ref={containerRef} dir={lang === 'ar' ? 'rtl' : 'ltr'} className="flex min-h-screen flex-col bg-[var(--color-page)] text-[var(--color-text-primary)]">
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-3 py-2 backdrop-blur">
        {backHref && (
          <Link href={backHref} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t.back}
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{filename}</p>
          <p className="text-[11px] text-[var(--color-text-muted)]">{mimeType || 'file'} · {formatSize(size)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} aria-label={t.zoomOut} title={t.zoomOut} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-[var(--color-surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
            <ZoomOut className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.1))} aria-label={t.zoomIn} title={t.zoomIn} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-[var(--color-surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
            <ZoomIn className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? t.exitFullscreen : t.fullscreen} title={fullscreen ? t.exitFullscreen : t.fullscreen} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-[var(--color-surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
            {fullscreen ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
          </button>
          <a href={downloadUrl} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 text-sm font-semibold text-[var(--on-primary)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
            <Download className="h-4 w-4" aria-hidden="true" />
            {t.download}
          </a>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-2 sm:p-4">
        <ViewerBody kind={kind} contentUrl={contentUrl} filename={filename} mimeType={mimeType} zoom={zoom} lang={lang} />
      </main>
    </div>
  )
}

function ViewerBody({ kind, contentUrl, filename, mimeType, zoom, lang }: {
  kind: Kind; contentUrl: string; filename: string; mimeType: string; zoom: number; lang: 'ar' | 'en'
}) {
  const t = LABELS[lang]
  if (kind === 'pdf') {
    return (
      <iframe
        src={contentUrl}
        title={filename}
        className="mx-auto h-[calc(100vh-96px)] w-full max-w-6xl rounded-xl border border-[var(--color-border)] bg-white"
      />
    )
  }
  if (kind === 'image') {
    return (
      <div className="flex h-full items-center justify-center overflow-auto">
        <img
          src={contentUrl}
          alt={filename}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          className="max-h-[calc(100vh-120px)] max-w-full rounded-lg object-contain transition-transform"
        />
      </div>
    )
  }
  if (kind === 'video') {
    return (
      <div className="mx-auto max-w-5xl">
        <video src={contentUrl} controls preload="metadata" className="w-full rounded-xl border border-[var(--color-border)] bg-black">
          {t.unsupported}
        </video>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">{t.downloadHint}</p>
      </div>
    )
  }
  if (kind === 'docx') return <DocxViewer contentUrl={contentUrl} zoom={zoom} lang={lang} />
  if (kind === 'spreadsheet') return <SpreadsheetViewer contentUrl={contentUrl} lang={lang} />
  if (kind === 'text') return <TextViewer contentUrl={contentUrl} lang={lang} />
  if (kind === 'pptx') return <Fallback filename={filename} mimeType={mimeType} lang={lang} note={lang === 'ar' ? 'عرض العروض التقديمية داخل المتصفح غير متاح حاليًا. نزّل الملف لفتحه في PowerPoint.' : 'In-browser PPTX rendering is not available yet. Download the file to open it in PowerPoint.'} />
  return <Fallback filename={filename} mimeType={mimeType} lang={lang} />
}

function Loading({ lang }: { lang: 'ar' | 'en' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-[var(--color-text-muted)]" role="status" aria-live="polite">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <p className="text-sm">{LABELS[lang].loading}</p>
    </div>
  )
}

function ErrorState({ lang, onRetry }: { lang: 'ar' | 'en'; onRetry: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center" role="alert">
      <AlertCircle className="h-7 w-7 text-[var(--color-danger)]" aria-hidden="true" />
      <p className="text-sm text-[var(--color-text-muted)]">{LABELS[lang].error}</p>
      <button type="button" onClick={onRetry} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold hover:border-[var(--color-primary)]">
        {LABELS[lang].retry}
      </button>
    </div>
  )
}

function Fallback({ filename, mimeType, lang, note }: { filename: string; mimeType: string; lang: 'ar' | 'en'; note?: string }) {
  const t = LABELS[lang]
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-xl flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
      <FileText className="h-10 w-10 text-[var(--color-text-muted)]" aria-hidden="true" />
      <p className="text-base font-semibold">{filename}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{mimeType || 'file'}</p>
      <p className="text-sm text-[var(--color-text-muted)]">{note || t.unsupported}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{t.downloadHint}</p>
    </div>
  )
}

function DocxViewer({ contentUrl, zoom, lang }: { contentUrl: string; zoom: number; lang: 'ar' | 'en' }) {
  const [html, setHtml] = useState('')
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  const load = useCallback(async () => {
    setState('loading')
    try {
      const res = await fetch(contentUrl)
      if (!res.ok) throw new Error('fetch failed')
      const buf = await res.arrayBuffer()
      const mammoth = await import('mammoth')
      const result = await mammoth.convertToHtml({ arrayBuffer: buf })
      setHtml(sanitizeHtml(result.value))
      setState('ready')
    } catch {
      setState('error')
    }
  }, [contentUrl])

  useEffect(() => { void load() }, [load])

  if (state === 'loading') return <Loading lang={lang} />
  if (state === 'error') return <ErrorState lang={lang} onRetry={() => void load()} />
  return (
    <div className="mx-auto max-w-4xl overflow-auto rounded-xl border border-[var(--color-border)] bg-white p-6">
      <div
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        className="prose prose-sm max-w-none text-black [&_table]:border-collapse [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-gray-300 [&_th]:px-2 [&_th]:py-1"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

function SpreadsheetViewer({ contentUrl, lang }: { contentUrl: string; lang: 'ar' | 'en' }) {
  const [rows, setRows] = useState<string[][]>([])
  const [sheets, setSheets] = useState<string[]>([])
  const [active, setActive] = useState(0)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [workbook, setWorkbook] = useState<unknown>(null)
  const t = LABELS[lang]

  const load = useCallback(async () => {
    setState('loading')
    try {
      const res = await fetch(contentUrl)
      if (!res.ok) throw new Error('fetch failed')
      const buf = await res.arrayBuffer()
      const XLSX = await import('xlsx')
      const wb = XLSX.read(buf, { type: 'array' })
      setWorkbook(wb)
      const names = wb.SheetNames || []
      setSheets(names)
      setActive(0)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [contentUrl])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!workbook || !sheets[active]) return
    import('xlsx').then((XLSX) => {
      const wb = workbook as { Sheets: Record<string, unknown> }
      const ws = wb.Sheets[sheets[active]]
      const data = XLSX.utils.sheet_to_json<string[]>(ws as never, { header: 1, blankrows: false, defval: '' })
      setRows((data as unknown as string[][]).slice(0, 200).map((r) => (Array.isArray(r) ? r.map(String) : [])))
    })
  }, [workbook, sheets, active])

  if (state === 'loading') return <Loading lang={lang} />
  if (state === 'error') return <ErrorState lang={lang} onRetry={() => void load()} />

  return (
    <div className="mx-auto max-w-6xl">
      {sheets.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1" role="tablist" aria-label={t.sheet}>
          {sheets.map((name, i) => (
            <button
              key={name}
              role="tab"
              aria-selected={active === i}
              onClick={() => setActive(i)}
              className={`min-h-[36px] rounded-md px-3 text-xs font-semibold ${active === i ? 'bg-[var(--color-primary)] text-[var(--on-primary)]' : 'border border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="overflow-auto rounded-xl border border-[var(--color-border)] bg-white">
        <table className="min-w-full border-collapse text-xs text-black">
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className={r === 0 ? 'bg-gray-100 font-semibold' : ''}>
                {row.map((cell, c) => (
                  <td key={c} className="max-w-[280px] truncate border border-gray-200 px-2 py-1">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">{t.limited}</p>
    </div>
  )
}

function TextViewer({ contentUrl, lang }: { contentUrl: string; lang: 'ar' | 'en' }) {
  const [text, setText] = useState('')
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  const load = useCallback(async () => {
    setState('loading')
    try {
      const res = await fetch(contentUrl)
      if (!res.ok) throw new Error('fetch failed')
      setText(await res.text())
      setState('ready')
    } catch {
      setState('error')
    }
  }, [contentUrl])

  useEffect(() => { void load() }, [load])

  if (state === 'loading') return <Loading lang={lang} />
  if (state === 'error') return <ErrorState lang={lang} onRetry={() => void load()} />
  return (
    <pre className="mx-auto max-w-5xl overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs leading-relaxed" dir="ltr">
      {text}
    </pre>
  )
}