# Attachment Persistence Fix

## Root cause (confirmed)
The save sanitizer dropped relative R2 URLs. `externalUrl` was accepted only when it matched `^https?://`. R2 attachments use `/api/files/r2/<id>`, so the reference was replaced with `null` on save.

## Implemented fixes
1. `src/lib/actions/portfolio.ts` (`updatePortfolio` + `updateProjectPage`): accept `sanitized.startsWith('/')` in addition to `http(s)`, preserving R2 download references while still rejecting dangerous schemes via `sanitizeUrl`.
2. `src/app/api/files/r2/[id]/route.ts`: public files readable without auth (redirect to public base or fresh presigned GET); private files require owner login.
3. `src/lib/project-card-visuals.ts`: `ProjectItemCardMeta` persists `attachmentName/Type/Size/Id`; `sanitizeMeta` keeps them.
4. `src/app/profile/builder/BuilderClient.tsx`: `uploadProjectItemFile` stores metadata in `itemCards[index]`; UI reads `itemMeta.attachmentName`; remove clears both `externalUrl` and meta.

## Persistence contract
- ProjectItem row: `externalUrl` = `/api/files/r2/<mediaFileId>` (stable reference, not a signed URL).
- ProjectPage `content.itemCards[index]`: filename, MIME type, size, MediaFile id.
- On open: `/api/files/r2/<id>` resolves the MediaFile, checks visibility/ownership, and redirects to a fresh presigned GET (or public URL).

## Security
- No credentials exposed.
- Private files owner-only; public files readable.
- Removal clears references only; R2 object not deleted.

## Tests
- tsc: PASS.
- vitest attachment-persistence (2) + experience-reordering + portfolio-save-items: 9/9 PASS.