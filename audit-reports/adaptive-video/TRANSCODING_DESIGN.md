# Transcoding Pipeline Design (proposed — not implemented)

## Lifecycle
1. Existing upload flow stores source in R2; quota reservation/50 MB cap unchanged.
2. After `complete`, enqueue a job with `MediaFile.id` (only if adaptive processing is enabled for the environment).
3. Worker loads the MediaFile, verifies owner/size/MIME and object key, downloads source via R2 SDK (never arbitrary URLs).
4. FFprobe validates codec/duration/resolution; invalid source → `FAILED` (original MP4 fallback).
5. FFmpeg generates renditions (no upscaling) + HLS segments + master/media playlists.
6. Uploads output to `users/<userId>/adaptive/<mediaFileId>/...` in R2; verifies each object.
7. Marks `READY` with manifest key; failure marks `FAILED` and stores a safe reason.
8. Player uses HLS when READY; otherwise existing MP4 URL.

## Processing states
`UPLOADED → QUEUED → PROCESSING → READY | FAILED` (stored on MediaFile or a new `VideoProcessingJob` table). Add `attempts`, `lastError`, `startedAt`, `finishedAt`, `outputPrefix`.

## Idempotency / retries
- Job keyed by `mediaFileId`; duplicate enqueue returns existing job.
- Worker claims jobs atomically (status + `lockedAt`); stale locks requeued after timeout.
- Output writes are idempotent (same keys overwritten); completion is a conditional update.
- Repeated completion notifications are no-ops if already READY.
- Abort/cleanup deletes partial output prefix only for FAILED jobs and only after verifying no READY reference.

## Rendition ladder (starting point; must be validated by test encodes)
| Source height | Renditions |
|---|---|
| ≤360p | 360p |
| 480p | 360p, 480p |
| 720p | 360p, 480p, 720p |
| ≥1080p | 360p, 480p, 720p, 1080p |

- Video: H.264 High profile, keyframe interval ~2–4s, segment duration 4–6s.
- Audio: AAC-LC 96–128 kbps stereo (mono for low renditions).
- No upscaling; preserve aspect ratio; even dimensions.
- Bitrate targets: 400–700 / 700–1200 / 1500–2500 / 3000–5000 kbps (verify against real content).

## DB changes (proposed migration, NOT executed)
- Option 1: extend `MediaFile` with `adaptiveStatus`, `adaptiveManifestKey`, `adaptiveOutputBytes`, `adaptiveError`, `adaptiveUpdatedAt`.
- Option 2: new `VideoProcessingJob` table (mediaFileId unique, status, attempts, error, timestamps) + `MediaFile.adaptiveManifestKey`.
- Backfill: existing rows remain `null`/legacy and keep MP4 playback.

## Why not Vercel
FFmpeg transcode of a 50 MB video is CPU/memory/time intensive; Vercel serverless limits and per-request cost make it unsafe. A container worker/queue or managed encoder is required.