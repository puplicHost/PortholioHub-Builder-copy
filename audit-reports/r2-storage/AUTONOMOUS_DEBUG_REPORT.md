# Autonomous Debug Report — R2 Document Attachments

## Confirmed root cause
The server-side project item sanitizer in `src/lib/actions/portfolio.ts` accepted only absolute `http(s)` URLs for `externalUrl`:

```
: (/^https?:\/\//i.test(sanitized) ? sanitized : null)
```

R2 attachments are persisted as site-relative URLs (`/api/files/r2/<mediaFileId>`), so on save they were converted to `null`. After refresh, the item had no `externalUrl`, so the filename/Explore action disappeared. The MediaFile record and R2 object were unaffected; only the project-item reference was dropped.

## Secondary finding
`GET /api/files/r2/[id]` required authentication before reading the file, so public portfolio visitors could not open public attachments. It now allows public files without auth and requires owner auth for private files.

## Files changed
- `src/lib/actions/portfolio.ts` — allow site-relative URLs for project item `externalUrl` in `updatePortfolio` and `updateProjectPage`.
- `src/app/api/files/r2/[id]/route.ts` — public files readable without auth; private files owner-only.
- `src/lib/project-card-visuals.ts` — persist `attachmentName`, `attachmentType`, `attachmentSize`, `attachmentId` in `itemCards` meta (already added in prior fix).
- `src/app/profile/builder/BuilderClient.tsx` — persist/read attachment metadata via `itemCards`; Explore gated on persisted data (prior fix).

## Database schema
Read-only inspection confirms the R2 columns exist in `media_files`: `storage_provider`, `object_key`, `bucket`, `visibility`, `upload_status`; unique index `media_files_object_key_key` present. No migration required at this time.

## Tests executed
- `tsc --noEmit`: PASS.
- `vitest` attachment-persistence: 2/2 PASS (itemCards preserved; relative externalUrl persisted; external URL preserved).
- `vitest` experience-reordering + portfolio-save-items: 9/9 PASS.

## Not verified
- Browser end-to-end PDF/DOCX save→refresh→reopen→publish (no browser automation per instruction).
- Live R2 upload through the app UI (credentials configured; no synthetic authenticated session used).

## Production changes
None. No SQL, migration, deployment, or customer data changes.