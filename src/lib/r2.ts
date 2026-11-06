import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const R2_CONFIGURED =
  !!process.env.R2_ACCOUNT_ID &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY &&
  !!process.env.R2_BUCKET_NAME &&
  !!process.env.R2_ENDPOINT

let client: S3Client | null = null

function getClient(): S3Client {
  if (client) return client
  if (!R2_CONFIGURED) throw new Error('R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT.')
  client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
  return client
}

export function getBucket(): string {
  if (!process.env.R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME is not set')
  return process.env.R2_BUCKET_NAME
}

export function getPublicBaseUrl(): string | null {
  return process.env.R2_PUBLIC_BASE_URL || null
}

export const ALLOWED_DOCUMENT_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

export const ALLOWED_VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime', // mov
])

export function isAllowedMime(mime: string): boolean {
  return ALLOWED_DOCUMENT_MIME.has(mime) || ALLOWED_VIDEO_MIME.has(mime)
}

export function isVideoMime(mime: string): boolean {
  return ALLOWED_VIDEO_MIME.has(mime)
}

export const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB (documents)
export const MAX_VIDEO_SIZE = 52_428_800 // 50 MB exactly
export const MULTIPART_THRESHOLD = 50 * 1024 * 1024 // 50 MB

export function maxSizeForMime(mime: string): number {
  return isVideoMime(mime) ? MAX_VIDEO_SIZE : MAX_FILE_SIZE
}

const VIDEO_EXT = /\.(mp4|webm|mov)$/i

export function isVideoFile(mime: string, filename: string): boolean {
  return isVideoMime(mime) || VIDEO_EXT.test(filename)
}

export function maxSizeForFile(mime: string, filename: string): number {
  return isVideoFile(mime, filename) ? MAX_VIDEO_SIZE : MAX_FILE_SIZE
}

export function buildObjectKey(userId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `users/${userId}/${uuid}-${safe}`
}

export async function presignUpload(key: string, contentType: string, expiresIn = 300): Promise<string> {
  const cmd = new PutObjectCommand({ Bucket: getBucket(), Key: key, ContentType: contentType })
  return getSignedUrl(getClient(), cmd, { expiresIn })
}

export async function presignDownload(key: string, filename?: string, expiresIn = 300): Promise<string> {
  const safeName = (filename || 'download').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  const cmd = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ResponseContentDisposition: `attachment; filename="${safeName}"`,
  })
  return getSignedUrl(getClient(), cmd, { expiresIn })
}

export async function headObject(key: string) {
  return getClient().send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }))
}

export async function getObject(key: string, range?: string) {
  return getClient().send(new GetObjectCommand({ Bucket: getBucket(), Key: key, Range: range }))
}

export async function deleteObject(key: string) {
  return getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }))
}

export async function createMultipartUpload(key: string, contentType: string) {
  const res = await getClient().send(new CreateMultipartUploadCommand({ Bucket: getBucket(), Key: key, ContentType: contentType }))
  return res.UploadId!
}

export async function presignPart(key: string, uploadId: string, partNumber: number, expiresIn = 300) {
  const cmd = new UploadPartCommand({ Bucket: getBucket(), Key: key, UploadId: uploadId, PartNumber: partNumber })
  return getSignedUrl(getClient(), cmd, { expiresIn })
}

export async function completeMultipartUpload(key: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]) {
  return getClient().send(new CompleteMultipartUploadCommand({ Bucket: getBucket(), Key: key, UploadId: uploadId, MultipartUpload: { Parts: parts } }))
}

export async function abortMultipartUpload(key: string, uploadId: string) {
  return getClient().send(new AbortMultipartUploadCommand({ Bucket: getBucket(), Key: key, UploadId: uploadId }))
}