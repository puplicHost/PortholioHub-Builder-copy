# Adaptive Video — Architecture Audit

## Current architecture (verified)
- Upload: browser → `POST /api/files/r2/presign` (quota reservation + presigned PUT) → direct PUT to R2 → `POST /api/files/r2/complete` (HeadObject verify, `MediaFile` complete).
- Multipart: initiate (reservation) → presigned parts → complete (verify) / abort (release).
- Storage: private R2 bucket `portfoliohubfiles`; per-user 500 MiB aggregate quota; 50 MB per-video cap.
- Playback: `ProjectCard.tsx` (`VideoCardPreview`) → poster + Play button → `<video controls autoPlay playsInline preload="metadata">` pointing at `/api/files/r2/<id>/content` (same-origin Range/206 stream).
- Access: public files readable; private owner-only; no signed URL stored.
- Infra: Vercel Hobby (serverless functions, daily crons), Supabase Postgres, Cloudinary images, R2 videos/docs.
- No hls.js / ffmpeg / worker/queue service in the repo. No always-running compute.

## Why a single MP4 cannot be genuine ABR
R2 is object storage. One MP4 is one bitrate. HTML attributes (`preload`, `playsInline`, etc.) do not create variants. Genuine ABR requires transcoding to multiple renditions, HLS/DASH manifests + segments, a player that switches renditions, and delivery of those assets. Vercel request handlers are not a safe place for CPU-heavy FFmpeg transcoding (execution/memory/time limits), and there is no queue/worker.

## Options evaluated

### A. Cloudflare Stream
- Pros: managed encoding, ABR/HLS/DASH, signed tokens, global delivery; can keep 50 MB upload cap.
- Cons: paid service; requires explicit approval; migration/upload integration; new vendor dependency; existing R2 videos need migration or dual-path. Pricing not verified in this audit — must be confirmed from Cloudflare's current terms before adoption.
- Verdict: viable, **blocked by approval/purchase**.

### B. External transcoding service (e.g., managed FFmpeg/encoding API)
- Pros: offloads CPU, HLS output, callbacks.
- Cons: paid per minute/output; vendor lock-in; secure source transfer + callback auth; pricing not verified.
- Verdict: viable, **blocked by approval/purchase**.

### C. Dedicated FFmpeg worker + queue
- Pros: full control, can write HLS to R2, works with existing private R2 + quota, no per-minute vendor lock-in.
- Cons: requires always-running compute or a container platform + queue (e.g., Vercel doesn't fit), new infra, monitoring, retries, cleanup; operational cost/approval required.
- Verdict: recommended technically, **blocked by infrastructure approval**.

### D. Hybrid: worker only for new paid uploads; legacy MP4 unchanged
- Pros: backward compatible, gradual migration, quota-friendly.
- Cons: same worker infra requirement.
- Verdict: recommended rollout shape for Option C.

## Recommendation
Option C/D: a dedicated FFmpeg worker (container or queue-backed function service with enough CPU/time) that pulls the source from R2, transcodes to a rendition ladder, writes HLS to R2, and marks `MediaFile` READY. Keep the current MP4 player as fallback. This is the only option that preserves the private-R2 + quota architecture without a paid media vendor.

## Infrastructure required (not present)
- Worker runtime with FFmpeg (container service, or a queue + long-running compute; **not** Vercel request handlers).
- Queue/job store (Postgres table or managed queue) + retry/dead-letter handling.
- Service-to-service auth (HMAC/shared secret) for worker callbacks.
- R2 write access for derived output under a separate prefix.
- Monitoring/alerting for processing failures.

## Cost
Cloudflare Stream and external encoders are paid; exact prices were **not verified** here and must be checked against current provider terms. Option C costs depend on chosen compute (always-on vs queue-backed); no estimate is asserted without a provider choice.

## Security implications
- Worker must fetch only the user's source by MediaFile id/object key from DB, never arbitrary URLs (SSRF).
- Callbacks must be authenticated and idempotent.
- Private manifests/segments must reuse the existing owner/public authorization model (signed or proxied).
- No credentials in the browser or logs.

## Migration implications
- Existing MP4 videos must keep playing; no bulk transcode.
- New uploads can be processed once worker infra exists; `READY` videos use HLS, others keep MP4.
- No deletion of originals until verified.

## Unresolved decisions (need approval)
1. Which compute provider/queue for the FFmpeg worker (or paid Stream/encoder).
2. Whether generated renditions count toward the 500 MiB quota (see STORAGE_AND_QUOTA_IMPACT.md).
3. Rendition ladder/bitrates after test encoding.
4. Budget approval for paid services.