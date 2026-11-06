# Storage & Quota Impact

## Current quota (verified)
- Paid: 500 MiB aggregate R2 quota (524,288,000 bytes).
- Free: existing plan/default storage limit.
- 50 MB per-video cap.
- Accounting = sum of `MediaFile.size` where `storageProvider='r2'` and `uploadStatus='complete'`, plus active pending reservations. One row per uploaded file.

## Rendition accounting options
### 1. Source-only quota (recommended)
- User's 500 MiB counts only the uploaded source; generated renditions are platform overhead.
- Fair to users, no quota surprise; platform bears derived storage cost.
- Requires ensuring generated outputs are NOT inserted as normal `MediaFile` rows counted by `getStorageUsage` (store under a separate prefix/table or flag).

### 2. Total output quota
- Counts source + all renditions/segments.
- Can exceed the 500 MiB quota by several times after processing; users could be blocked by platform-generated files. Not recommended without a larger quota/policy change.

### 3. Separate derived-media allowance
- Source counts against 500 MiB; derived outputs have a documented platform allowance.
- Effectively option 1 with an explicit platform budget; requires monitoring/cost controls.

## Recommendation
Adopt **Option 1/3**: source uploads keep the current 500 MiB accounting; derived HLS output is platform-managed and excluded from user quota, with a separate storage budget/monitoring. This preserves the existing quota definition and avoids counting both source and outputs as user uploads.

## Cleanup
- On FAILED processing, delete partial output prefix.
- On source deletion, delete derived prefix (verify no READY references).
- Never delete source until successful verification.
- Existing daily cron behavior unchanged unless a dedicated cleanup job is approved.

## Impact on existing implementation
- No change to `getStorageUsage` if derived output is stored outside `MediaFile` or with a flag excluded from the aggregate.
- A new column/table is needed to track adaptive status/prefix (migration prepared, not executed).
- Existing videos: no re-upload, no accounting change.

## Open policy decision
Confirm with product owner whether derived renditions are platform overhead (recommended) before implementation.