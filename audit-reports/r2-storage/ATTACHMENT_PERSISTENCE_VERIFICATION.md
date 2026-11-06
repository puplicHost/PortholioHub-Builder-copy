# Attachment Persistence Verification

## Verified (automated, no browser)
| Check | Result | Evidence |
|---|---|---|
| R2 columns exist in DB | PASS | read-only information_schema: storage_provider, object_key, bucket, visibility, upload_status |
| Unique index exists | PASS | media_files_object_key_key |
| Save preserves itemCards | PASS | `attachment-persistence.test.ts` |
| Save preserves relative externalUrl | PASS | same test (previously null; now `/api/files/r2/file-1`); root cause was `^https?://`-only sanitizer |
| Manifest includes R2 routes | PASS | `manifest.test.ts` 2/2 |
| Public file readable without auth; private owner-only | PASS (code review) | `r2/[id]/route.ts` |
| External absolute URL preserved | PASS | same test |
| tsc --noEmit | PASS | — |
| Related unit tests | PASS | 9/9 (attachment + reordering + project items) |

## Not verified (requires browser/manual)
- PDF upload → save → refresh → reopen → Explore.
- DOCX repeat.
- Published portfolio render + open in another session.
- Remove persistence across refresh.
- Image/None mode visual regression.
- RTL/mobile layout.

## Notes
- Public files are readable without auth via `/api/files/r2/[id]`; private files remain owner-only.
- No production data or deployment changed.