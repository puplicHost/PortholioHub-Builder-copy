'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

export function exportCsvFile(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const escapeCell = (cell: string | number | null | undefined) => {
    if (cell === null || cell === undefined) return '""'
    const str = String(cell).replace(/"/g, '""')
    return `"${str}"`
  }

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\r\n')

  // Prepend UTF-8 BOM (\uFEFF) for full Excel & Google Sheets Arabic compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

interface CsvExportButtonProps {
  filename: string
  headers: string[]
  rows: (string | number | null | undefined)[][]
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function CsvExportButton({
  filename,
  headers,
  rows,
  label = 'Export CSV',
  disabled = false,
  size = 'md',
  variant = 'secondary',
}: CsvExportButtonProps) {
  const { toast } = useToast()
  const [downloading, setDownloading] = useState(false)

  const handleExport = () => {
    if (rows.length === 0) {
      toast('info', 'No records to export')
      return
    }
    setDownloading(true)
    try {
      exportCsvFile(filename, headers, rows)
      toast('success', `Exported ${rows.length} rows to ${filename}`)
    } catch {
      toast('error', 'Failed to generate CSV export')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || downloading || rows.length === 0}
      onClick={handleExport}
      className="inline-flex items-center gap-1.5"
    >
      <Download className="h-3.5 w-3.5" />
      <span>{label}</span>
    </Button>
  )
}
