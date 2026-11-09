# Phase 2 — Implementation Report

## Objective
Stabilize project-card identities/references and make profile retrieval read-only.

## Findings investigated
F-17, F-28, F-48, F-49.

## Root causes
- F-17: `ProjectManager` kept the temporary `new-…` id after the save response remapped the row.
- F-28/F-49: deletion-by-omission removed target rows without clearing incoming `linkedPageSlug`/`page_link` references.
- F-48: `getOrCreateProfile` inserted/deleted page sections while serving a read.

## Implementation
- Added `src/lib/project-id-aliases.ts` and passed a temp→real id map from Builder save responses into `ProjectManager`; all edits resolve through the alias.
- `updatePortfolio` now records deleted project slugs and, in the same transaction:
  - clears incoming `linkType/linkedPageSlug` on surviving cards,
  - skips `page_link` items targeting deleted rows,
  - preserves http(s) external links and R2 attachments,
  - deletes only the omitted project rows.
- Client card deletion clears local references immediately so the Builder does not show dead destinations.
- Removed the entire runtime section migration block from `getOrCreateProfile`; existing profiles are returned as stored. New-profile creation is unchanged. Phase 1's generic client-section behavior is preserved (the hard-coded identifier is gone).

## Files changed
`src/lib/project-id-aliases.ts`, `src/app/profile/builder/ProjectManager.tsx`, `src/app/profile/builder/BuilderClient.tsx`, `src/lib/actions/portfolio.ts`, `__tests__/phase2-profile-read.test.ts`, `__tests__/phase2-project-id-aliases.test.ts`, `__tests__/portfolio-save-items.test.ts`.

## Compatibility / data safety
- No schema or migration changes.
- No automatic repair or bulk cleanup of legacy references was performed.
- Legacy profiles missing sections are no longer auto-repaired on read; content is preserved untouched rather than silently mutated. This is documented in the blockers.
- Free standalone-page protection remains intact.

## Status
F-17: **fixed** (edits resolve aliases; editor identity no longer targets a dead id).
F-28: **fixed at server and Builder-state level**.
F-48: **fixed** (read path performs no writes).
F-49: **fixed via shared deletion cleanup**; card→card linking policy remains allowed but now safe on deletion.

## Remaining risks
- Legacy profiles that depended on read-time section insertion will no longer be auto-repaired; an explicit migration decision is required.
- Manual staging verification of multi-card saves and deletion is outstanding.
