interface CloudinaryUploadResult {
  cloudinary_id: string
  url: string
  width: number | null
  height: number | null
  bytes: number
  format: string
}

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ''

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Upload failed: ${body}`)
  }

  const json = await res.json()

  return {
    cloudinary_id: json.public_id,
    url: json.secure_url,
    width: json.width || null,
    height: json.height || null,
    bytes: json.bytes,
    format: json.format,
  }
}

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4']
const PDF_TYPES = ['application/pdf']
const DOCUMENT_TYPES = [
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

/** Everything the Files Library accepts, matching what the storage (Cloudinary) can hold. */
export const FILE_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES, ...PDF_TYPES, ...DOCUMENT_TYPES]

/** Comma-separated MIME list used for the file input `accept` attribute. */
export const FILE_ACCEPT = FILE_TYPES.join(',')

const MAX_SIZE = 50 * 1024 * 1024 // aligned with the existing Cloudinary upload limit

export function validateFile(file: File, imagesOnly = false, allowFiles = false): string | null {
  const allowed = allowFiles ? FILE_TYPES : imagesOnly ? IMAGE_TYPES : SUPPORTED_TYPES
  if (!allowed.includes(file.type)) {
    if (allowFiles) {
      return 'Unsupported file type. Allowed: JPG, PNG, WebP, GIF, MP4, PDF and office documents.'
    }
    return imagesOnly
      ? 'Unsupported file type. Allowed: JPG, JPEG, PNG, WebP.'
      : 'Unsupported file type. Allowed: JPG, PNG, WebP, MP4.'
  }
  if (file.size > MAX_SIZE) {
    return 'File too large. Maximum size is 50MB.'
  }
  return null
}

export function getMimeCategory(mimeType: string): 'image' | 'video' | 'other' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return 'other'
}

export type FileCategory = 'image' | 'video' | 'pdf' | 'document'

/** Coarse bucket used by the Files Library filters and card icons. */
export function getFileCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf') return 'pdf'
  return 'document'
}

/** Human-readable label for a file category (used with `t()`). */
export function getFileCategoryLabel(category: FileCategory): string {
  return { image: 'Image', video: 'Video', pdf: 'PDF', document: 'Document' }[category]
}

export async function destroyCloudinaryAsset(publicId: string): Promise<boolean> {
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('Cloudinary destroy skipped: missing CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET')
    return false
  }

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = await buildCloudinaryDestroySignature(publicId, timestamp, apiSecret)

  const form = new URLSearchParams({
    public_id: publicId,
    timestamp,
    api_key: apiKey,
    signature,
  })

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) return false
    const json = (await res.json()) as { result?: string }
    return json.result === 'ok'
  } catch (err) {
    console.error('Cloudinary destroy failed:', err)
    return false
  }
}

export async function buildCloudinaryDestroySignature(
  publicId: string,
  timestamp: string,
  apiSecret: string,
): Promise<string> {
  return sha1Hex(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
}

async function sha1Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Insert Cloudinary delivery transforms (auto format/quality + capped width)
 * into an existing delivery URL. Non-Cloudinary URLs (legacy/user-typed) are
 * returned untouched, so arbitrary hosts keep working without next/image
 * remote-pattern restrictions.
 */
export function portfolioImageUrl(url: string, width: number): string {
  if (!url) return url
  try {
    const u = new URL(url)
    if (!/(^|\.)res\.cloudinary\.com$/i.test(u.hostname)) return url
    if (!u.pathname.includes('/upload/')) return url
    // Already transformed — never stack a second transformation segment.
    if (/\/upload\/[^/]*?(f_|q_|w_|c_)/.test(u.pathname)) return url
    const transforms = `f_auto,q_auto,c_limit,w_${Math.max(1, Math.round(width))}`
    u.pathname = u.pathname.replace('/upload/', `/upload/${transforms}/`)
    return u.toString()
  } catch {
    return url
  }
}
