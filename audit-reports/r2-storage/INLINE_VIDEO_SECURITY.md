# Inline Video Security Review

## Size enforcement
- 50 MB (`52,428,800` bytes) enforced client-side and server-side.
- Completion verifies actual R2 `ContentLength` (does not trust client size); oversized object is deleted and rejected.

## Type enforcement
- Server allowlist includes MP4, WEBM, MOV; Builder picker restricts to MP4/WEBM.
- MIME is validated server-side on presign/initiate/complete.

## Authorization
- Video playback uses `/api/files/r2/[id]/content`; authorization is applied on every request.
- Public files readable; private files require owner session (`file.userId === user.id`), otherwise 404.
- Object keys are never accepted from the client; access is by MediaFile id.

## URLs
- No signed URLs stored in DB/content. Content route streams via server SDK; download route generates fresh 5-minute presigned GET.
- R2 credentials remain server-side; bucket stays private.

## Content safety
- Video is rendered by the browser's native media element; no scripts or external players.
- No external video URLs are used as sources; only persisted MediaFile references.

## Risks
- Streaming large videos through Vercel functions consumes bandwidth/time; monitor limits.
- MOV files may fail to play in some browsers (codec-dependent) — documented limitation; fallback is download.
- No malware scanning of uploaded videos; existing upload validation (MIME/size) applies.