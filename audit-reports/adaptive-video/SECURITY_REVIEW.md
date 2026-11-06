# Adaptive Video — Security Review

## Required controls (design)
- Worker must load source by `MediaFile.id` from DB, verify ownership/prefix, and fetch only that R2 object — never an arbitrary URL (SSRF).
- Job creation: authenticated user, quota/size/type checks, rate limit (one active job per media file; bounded retries).
- Callbacks: HMAC-signed + timestamped or shared-secret Bearer; reject unsigned/replayed requests; idempotent.
- Output keys: server-generated under `users/<userId>/adaptive/<mediaFileId>/…`; reject client-supplied keys and `..`.
- Private manifests/segments: reuse the existing owner/public model. Prefer same-origin streaming endpoints with auth checks, or short-lived signed URLs; never store signed URLs in DB.
- Public portfolios: only published/public files; standalone/private remain protected.
- No R2 credentials in the browser; no secret/signed URL logging.
- Rate limit processing requests to prevent repeated transcode abuse.

## Current state
- Current MP4 delivery already enforces owner/public access on every request.
- No worker exists, so no callback/auth surface yet.
- 50 MB cap and quota reservation are enforced before upload.

## Risks if implemented naively
- Unauthenticated worker callback → forged READY/FAILED states.
- SSRF via a URL field.
- Public segment leakage if segments bypass the authorization route.
- Quota bypass if derived outputs are counted as user uploads or not tracked.
- Repeated transcode requests causing cost/DoS.

## Tests required later
Unauthorized job creation, invalid callback signature/replay, cross-user access, invalid object key/path traversal, private/public manifest+segment access, rate-limit behavior.