# Phase 2 — Data Integrity and Persistence

## 1. Objective

Make project/page identities and relationships stable across save/reload/delete, and remove destructive mutations from the profile read path.

## 2. Scope and Finding IDs

- **F-17 (High):** the card editor keeps a temporary `new-…` id after save remaps it, so later edits silently do nothing.
- **F-28 (Medium):** deleting a project card by omission does not clear `linkedPageSlug` references in surviving cards.
- **F-48 (Medium):** `getOrCreateProfile` deletes duplicate sections and inserts sections while serving a read.
- **F-49 (Low):** card→card linking is allowed by the fallback selector and inherits the same dangling-reference risk (overlaps F-28).

## 3. Current Evidence

**Audit references:** `BUILDER_FUNCTIONAL_AUDIT.md` §3.2/§5 (F-17, F-48), §2.2 (F-28, F-49); `CROSS_SYSTEM_INTEGRATION_AUDIT.md` §2, §7; `MASTER_FINDINGS.md` rows F-17/F-28/F-48/F-49.

**Confirmed evidence (re-verify against current tree):**
- F-17: `ProjectManager.tsx` local `editingItem` holds `new-…`; `updateEditingCard` matches `proj.id === editingItem.id` (`~588–600`). `BuilderClient.tsx` remaps `profile.projectPages` ids after save (`~1311–1365`) but does not sync the child editor.
- F-28: card deletion removes the row locally (`ProjectManager.tsx:570–588`); `updatePortfolio` deletes omitted rows (`actions/portfolio.ts:636–644`) without clearing references. `deleteProjectPage` does clear references (`1274–1290`) but is not used for cards.
- F-48: `getOrCreateProfile` performs `delete`/`create`/`update` on page sections during load (`actions/portfolio.ts:44–250`), including duplicate experience/client deletion and auto-insertion.
- F-49: card editor falls back to all project pages for the page selector when no content pages exist (`ProjectManager.tsx:1068–1085`), permitting card→card links.

**Confidence:** F-17 C; F-28 C; F-48 C; F-49 C (behavior), with product intent undecided.

## 4. Required Investigation

1. Trace all save-response remaps (sections, project pages, slugs, titles) and every consumer that holds a stale id (`ProjectManager`, `BuilderClient` right panel, `activePage`, selected section).
2. Enumerate all deletion paths for project pages/cards/items and every reference type (`linkedPageSlug`, `page_link` item `externalUrl`, `linkedFromProjectId`, `itemCards` metadata).
3. Inspect `getOrCreateProfile` migration conditions and whether any data is read before deletion. Identify what would happen on two concurrent Builder tabs.
4. Check whether the affected account's special case (F-18 fixed in Phase 1) changes migration expectations; use a non-production staging DB or mocks.
5. Determine whether card→card linking is a supported product feature (check legacy data assumptions/docs) or an accidental fallback. This is a product decision (see §5).
6. Search existing tests: `portfolio-save-items.test.ts` covers project save omission; no tests cover reference cleanup or editor remount.

## 5. Implementation Requirements

### F-17 — Stable editor identity
- After a successful save, update the open card/page editor to the real id and server-returned slug/title, or remount the editor keyed by the real id.
- Do not lose edits made in the form; if the id changes during save, merge the user's form values onto the saved row.
- Ensure `activePage` and the right panel continue to reference the real page.
- Cover new cards, new standalone pages, and temp sections affected by the same remap patterns (sections already remap selected id; verify).
- Backward compatibility: existing real ids must keep working unchanged.

### F-28 / F-49 — Reference integrity
- On any project row deletion (card or page), clear or null references in the same transaction:
  - `content.linkType`/`content.linkedPageSlug` on surviving cards,
  - `page_link` items whose `externalUrl` equals the deleted slug,
  - any `linkedFromProjectId` links if used.
- Decide F-49 policy with the user:
  - **Option A (preferred unless product says otherwise):** do not offer card rows as link targets; only standalone content pages. Legacy card→card links remain but are cleaned on deletion.
  - **Option B:** keep support and ensure deletion cleanup handles it.
- Do not delete the target page's content/items when only a card is deleted; only clear incoming references.
- If a card references a page and the page is later deleted, use the existing page-deletion cleanup path; ensure both paths share one helper.

### F-48 — Read-path purity / migrations
- Make `getOrCreateProfile` side-effect free, or move mutations into an explicit, approved migration/admin action.
- Preferred: extract a one-time, idempotent migration function with a clear trigger and dry-run; the Builder read returns current DB state untouched.
- If a lightweight repair is retained, it must be non-destructive, idempotent, not delete user rows, and must not run on every read. **Deleting duplicate sections requires explicit user approval and a backup/export plan.**
- Remove any dependence on the deleted F-18 special case.
- Handle concurrent tabs: no double-insert of the same section; use a uniqueness/guard or a safe upsert strategy.
- Document the migration trigger, rollback, and data backup requirements.

### Constraints
- No Prisma schema change is expected; if one becomes necessary, stop and request approval.
- Do not change page/card content or appearance.
- Preserve anonymous/public behavior and existing URLs.
- Keep the existing optimistic-version model.

### Edge cases
- Deleting a card that is referenced by another card's item-based `page_link` (not just top-level link).
- Renaming slugs is Phase 3 (F-11); do not conflate, but share the reference helper if sensible.
- A page referenced by multiple cards; all must be cleared.
- New card saved with an auto-generated slug; ensure id/slug remap is consistent in editor and preview.
- Legacy rows with `content.linkType` missing but top-level `linkType` present.

## 6. Security and Data Safety Considerations

- All cleanup must be scoped to the owner's profile and run inside the existing transaction.
- No production migration or duplicate deletion without explicit approval; use synthetic staging data.
- Never delete a customer's standalone page because a card was removed.
- Back up/export before any migration that deletes rows.
- Do not expose internal ids in public DTOs beyond existing behavior.

## 7. Testing Requirements

**Unit/integration (mocked Prisma):**
- Deleting a card clears every incoming reference type in the same transaction.
- Deleting a page keeps the existing cleanup behavior (regression).
- Editor remap: after save response changes ids, subsequent updates target the real row (test the state/merge helper; component test only if the project supports it — no Playwright by default).
- Migration function is idempotent; read path performs no writes (assert no Prisma mutation calls).
- Concurrent-tab simulation: two reads do not duplicate sections.

**Regression:** `portfolio-save-items.test.ts`; project/page save flows; public project route still resolves links; no orphaned items.
**Manual staging:** create/link/delete card and page combinations; verify no 404 links, no lost content, no duplicate sections on repeated Builder loads.
Run tests/typecheck/lint/build only after explicit approval.

## 8. Definition of Done

- F-17: post-save edits apply to the real card/page; verified.
- F-28/F-49: all incoming references cleared on relevant deletions; policy decision recorded.
- F-48: read path no longer mutates, or mutations are explicitly approved, non-destructive, and documented.
- Tests recorded; no schema/migration without approval; user accepts the phase.

## 9. Out of Scope

- F-09/F-18/F-19 (Phase 1; must be accepted first).
- F-11 slug rename propagation (Phase 3) — reference helper may be shared but the slug-change UX is Phase 3.
- F-07/F-35 (Phase 6), F-12/F-34 (Phase 3).
- Template appearance/layout work (Phase 4–5), performance (Phase 8).

## 10. Completion Report Requirements

`progress/PHASE_02_IMPLEMENTATION_REPORT.md`, `PHASE_02_TEST_REPORT.md`, `PHASE_02_BLOCKERS.md`: list reference types handled, migration decision/trigger/rollback, editor remap approach, tests/manual results, and any deferred policy.

## Mandatory safety rules (repeat — applies to this phase)

1. Read this roadmap, this phase, and project instructions first.
2. Execute only this phase.
3. Inspect actual source before changing each finding.
4. Preserve all existing uncommitted work.
5. Never use `git reset`, destructive checkout, broad reverts, or overwrite unrelated work.
6. Never assume localhost/`NODE_ENV=development` proves DB isolation.
7. Verify the database target before any DB-related command.
8. Never write to production customer data.
9. Never run production SQL migrations/resets/reseeds/destructive scripts without explicit approval.
10. Never deploy automatically.
11. Use isolated environments and synthetic data for DB testing.
12. Never install/upgrade dependencies without explicit approval.
13. No Playwright/browser automation without explicit authorization.
14. Do not silently change subscription/payment/customer-data/business rules.
15. Do not delete/rewrite customer content to simplify implementation.
16. Do not remove legacy compatibility without proof it is safe.
17. A passing TypeScript check is not proof a feature works.
18. Report blockers honestly; do not bypass safety checks.

If production access, a migration, a policy decision, or a destructive operation is required: **STOP and request user approval.**
