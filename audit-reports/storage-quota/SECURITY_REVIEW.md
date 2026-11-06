# Storage Quota Security Review

## Authorization
- Presign/initiate/complete require `getCurrentUser`; object keys must start with `users/<userId>/`.
- Quota is keyed by the authenticated `userId`; no client-supplied user id is trusted.
- `/api/me/storage` returns only the caller's usage.
- Deletion remains owner-only (`file.userId === user.id`), private files remain protected.

## Server-side enforcement
- Quota is resolved from `getEntitlements`/`getSubscriptionState` (DB), never from the browser.
- Reservation is atomic via a Postgres row lock (`FOR UPDATE`), preventing concurrent bypass.
- Actual R2 `ContentLength` is verified at completion; overflow releases/deletes.
- Eligibility: zero-limit accounts receive `SUBSCRIPTION_REQUIRED` (413).
- DB/accounting errors propagate; the upload is not authorized (fail closed).

## Limits
- 50 MB video cap unchanged; validated before reservation.
- 500 MiB aggregate for paid; Free uses the existing plan/default storage limit.

## Notes
- No signed URLs are stored; quota uses only MediaFile metadata.
- No new secrets; no credentials exposed.
- R2 bucket remains private; no bucket scans on upload.