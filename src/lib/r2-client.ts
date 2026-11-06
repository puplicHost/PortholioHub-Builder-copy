export interface R2UploadResult {
  id: string
  url: string
  filename: string
  mimeType: string
  size: number
  visibility: 'public' | 'private'
}

const MULTIPART_THRESHOLD = 50 * 1024 * 1024
const MAX_VIDEO_SIZE = 52_428_800 // 50 MB exactly

export async function uploadToR2(
  file: File,
  visibility: 'public' | 'private' = 'private',
  purpose: string = 'document',
  onProgress?: (percent: number) => void,
): Promise<R2UploadResult> {
  if (file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE) {
    throw new Error('Maximum video size is 50 MB')
  }
  if (file.size > MULTIPART_THRESHOLD) {
    return uploadMultipart(file, visibility, purpose, onProgress)
  }
  return uploadSingle(file, visibility, purpose, onProgress)
}

async function uploadSingle(file: File, visibility: 'public' | 'private', purpose: string, onProgress?: (percent: number) => void): Promise<R2UploadResult> {
  const presignRes = await fetch('/api/files/r2/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, mimeType: file.type, size: file.size, visibility }),
  })
  if (!presignRes.ok) throw new Error('Failed to get upload URL')
  const { uploadUrl, key } = await presignRes.json()

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress?.(Math.min(100, Math.round((e.loaded / e.total) * 100)))
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)))
    xhr.onerror = () => reject(new Error('Upload failed: network error'))
    xhr.send(file)
  })

  onProgress?.(100)
  const completeRes = await fetch('/api/files/r2/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, filename: file.name, mimeType: file.type, visibility, purpose }),
  })
  if (!completeRes.ok) throw new Error('Failed to finalize upload')
  const { file: record } = await completeRes.json()

  const url = record.visibility === 'public' && record.publicUrl ? record.publicUrl : `/api/files/r2/${record.id}`
  return { id: record.id, url, filename: record.filename, mimeType: record.mimeType, size: record.size, visibility: record.visibility }
}

async function uploadMultipart(file: File, visibility: 'public' | 'private', purpose: string, onProgress?: (percent: number) => void): Promise<R2UploadResult> {
  const initRes = await fetch('/api/files/r2/multipart/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, mimeType: file.type, size: file.size, visibility }),
  })
  if (!initRes.ok) throw new Error('Failed to initiate multipart upload')
  const { key, uploadId } = await initRes.json()

  const PART_SIZE = 10 * 1024 * 1024 // 10 MB
  const parts: { PartNumber: number; ETag: string }[] = []
  const totalParts = Math.ceil(file.size / PART_SIZE)
  let uploaded = 0

  try {
    for (let i = 0; i < totalParts; i++) {
      const start = i * PART_SIZE
      const end = Math.min(start + PART_SIZE, file.size)
      const blob = file.slice(start, end)

      // retry up to 3 times
      let etag = ''
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const presignRes = await fetch('/api/files/r2/multipart/presign-part', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, uploadId, partNumber: i + 1 }),
          })
          if (!presignRes.ok) throw new Error('Failed to presign part')
          const { url } = await presignRes.json()

          etag = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open('PUT', url)
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable && e.total > 0) {
                const partProgress = e.loaded / e.total
                const overall = ((uploaded + (end - start) * partProgress) / file.size) * 100
                onProgress?.(Math.min(99, Math.round(overall)))
              }
            }
            xhr.onload = () => {
              const et = xhr.getResponseHeader('ETag')
              if (xhr.status >= 200 && xhr.status < 300 && et) resolve(et.replace(/"/g, ''))
              else reject(new Error(`Part upload failed: ${xhr.status}`))
            }
            xhr.onerror = () => reject(new Error('Part upload network error'))
            xhr.send(blob)
          })
          break
        } catch (err) {
          if (attempt === 2) throw err
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        }
      }

      parts.push({ PartNumber: i + 1, ETag: etag })
      uploaded = end
    }

    onProgress?.(100)
    const completeRes = await fetch('/api/files/r2/multipart/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, uploadId, parts, filename: file.name, mimeType: file.type, visibility, purpose }),
    })
    if (!completeRes.ok) throw new Error('Failed to complete multipart upload')
    const { file: record } = await completeRes.json()

    const url = record.visibility === 'public' && record.publicUrl ? record.publicUrl : `/api/files/r2/${record.id}`
    return { id: record.id, url, filename: record.filename, mimeType: record.mimeType, size: record.size, visibility: record.visibility }
  } catch (err) {
    // abort on failure
    try {
      await fetch('/api/files/r2/multipart/abort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, uploadId }),
      })
    } catch {}
    throw err
  }
}