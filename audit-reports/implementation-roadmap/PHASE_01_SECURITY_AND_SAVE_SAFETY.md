# Phase 1 — Security and Save Safety

## 1. Objective

Remove the two confirmed server-action security hazards and eliminate the confirmed save-time edit-loss path, without changing subscription policy or customer data.

## 2. Scope and Finding IDs

- **F-09 (High):** edits typed during an in-flight save can be overwritten by a stale snapshot.
- **F-18 (High):** hard-coded individual customer email in `getOrCreateProfile` migration logic.
- **F-19 (High, Likely):** unused `updateProjectPage` Server Action accepts mass-assigned page fields and can bypass the Free standalone-page restriction.

No other finding is in scope. Do not fix F-07 (Phase 6), F-17/F-28/F-48/F-49 (Phase 2), or any template work here.

## 3. Current Evidence

**Audit references:**
- `BUILDER_FUNCTIONAL_AUDIT.md` §3.2 (F-09), §2.2 (F-19, F-31 context), §1.3.
- `SECURITY_AND_ENTITLEMENTS_AUDIT.md` §3 (F-18/F-19), §2, §6.
- `MASTER_FINDINGS.md` rows F-09, F-18, F-19.
- `AUDIT_SCOPE_AND_LIMITATIONS.md` §8 (F-19 endpoint reachability unverified).

**Confirmed evidence in the current tree (re-verify before editing):**
- F-09: `BuilderClient.tsx` `handleSaveChanges` captures `const src = stateOverride ?? profile` before `await updatePortfolio(...)`, then `setProfile(nextProfile)` where `nextProfile` is built from `src` (`~1256–1365`). Edits during the await are replaced.
- F-18: `src/lib/actions/portfolio.ts` contains a condition `user.email !== '<redacted personal address>'` at approximately lines 201 and 209. The identifier must not be reproduced in code comments, reports, commits, or test fixtures.
- F-19: `updateProjectPage(id, data)` at `src/lib/actions/portfolio.ts:1105–1135` checks ownership and the **current** `showInProjects`, then passes `pageData = { ...data }` minus `items` to `prisma.projectPage.update`. It is not referenced by any UI component.

**Confidence:**
- F-09 — H (source-proven race; reproduce under throttling).
- F-18 — C.
- F-19 — H (mass assignment confirmed; Server Action reachability requires runtime/staging confirmation).

## 4. Required Investigation

Before changing code, the execution agent must:
1. Read the current `updatePortfolio`, `updateProjectPage`, `getOrCreateProfile`, `BuilderClient.handleSaveChanges`, `handleMarshal...` (save response handling) and `ProjectManager` save interactions.
2. `git grep` for `updateProjectPage` callers; confirm no UI or test depends on it.
3. Inspect the installed Next.js version and how the repo uses `'use server'` modules; determine whether an unimported exported action is exposed (verify in an isolated staging build only; do not probe production).
4. Reproduce F-09 with a slow/throttled network in staging: type after pressing Save; confirm the character loss; document before/after.
5. Search the repository for the hard-coded email and any other personal identifiers in server code (do not print the address in reports).
6. Check the current uncommitted diff to avoid overwriting in-progress work.
7. Identify whether any existing tests cover save/version behavior (`__tests__/portfolio-save-items.test.ts`, `__tests__/features-v2.test.ts`).

## 5. Implementation Requirements

### F-19 — Server Action hardening
Preferred: **delete the unused action** if investigation confirms no internal/external caller. This removes the attack surface without behavior loss.
If deletion is not acceptable:
- Introduce an explicit allow-list of writable fields (`title`, `slug`, `description`, `coverImage`, `tags`, `displayMode`, `showInProjects` only if policy allows, `showBackButton`, `backButtonLabel`, `content`, `sortOrder`), and reject unknown keys.
- Never accept `profileId`, `id`, `userId`, `createdAt`, `isPublished` (unless a publish feature is explicitly added later), or `version` from the client.
- Re-check `canManageStandaloneProjectPage` against the **requested** `showInProjects`, not only the current row. A Free user must not be able to flip a card into a standalone page.
- Validate URLs/tags/arrays consistently with `updatePortfolio`; keep ownership scoping (`profile: { userId }`).
- Confirm mutations are transactional where they touch items.

### F-18 — Remove personal identifier
- Replace the special case with default behavior for all accounts. Do not replace it with another hard-coded email or a username.
- If the account genuinely needs different behavior, use an explicit, non-PII configuration flag or an approved admin/back-office migration; do not encode it in source.
- Do not rewrite git history, rotate credentials, or contact the customer without user approval.
- Document the affected account handling in the phase report (redacted identifier or internal ticket reference only).
- Add a regression test/assertion that migration behavior is account-agnostic where practical.

### F-09 — Save state merge
- Stop replacing the entire builder state with a snapshot captured before the request. On success, merge **server-owned metadata** (version, temp→real section/project ids, slugs/titles returned) into the latest state using a functional `setProfile(prev => ...)`.
- Preserve fields the user edited during the request. If a server-side transformation must override a user value (e.g. canonical slug), define the precedence explicitly and surface it.
- Keep the existing optimistic-concurrency semantics: `expectedVersion`, `VERSION_CONFLICT` modal, rollback-on-failure, and the existing validation.
- Do not disable editing during save as the only fix; that is a UX regression. If a temporary lock is used, it must be justified and reversible.
- Ensure the saved snapshot/dirty calculation reflects the actual persisted state, not the stale captured snapshot.
- Handle new sections/projects created during the save (temp ids) without dropping concurrent edits to those rows.

### Constraints
- No schema/migration changes.
- Do not alter subscription/entitlement semantics; F-07 is Phase 6.
- Do not change paste/validation behavior or the save payload shape unless required for the merge fix.
- Preserve all existing uncommitted source work.

### Edge cases
- Save fails/conflicts while the user typed: local edits must remain and the conflict modal must still work.
- New card/page created, then edited during save; server returns a real id and slug.
- Multiple rapid saves: second save must not start while first is saving (existing guard) and must serialize correctly.
- `stateOverride` used by `handleApplyTemplate`: keep the template-apply flow working; if the merge changes, re-verify Apply.

## 6. Security and Data Safety Considerations

- Treat every Server Action as a public mutation endpoint; never rely on UI hiding.
- Do not run the crafted-action verification against production. Use an isolated staging deployment and a throwaway account.
- Redact the personal identifier everywhere.
- Do not remove ownership checks; if deleting `updateProjectPage`, ensure no legitimate flow depends on it (no caller in source).
- No database writes from tests; use mocks for save-flow unit tests.

## 7. Testing Requirements

**Unit/integration (Vitest, mocked Prisma/auth/subscriptions):**
- Save-state merge preserves edits made during an in-flight promise (simulate a deferred response and a state update).
- Version/temp-id merge still updates version and remaps ids.
- Conflict path leaves local state untouched.
- `updateProjectPage` (if kept) rejects `profileId`, unknown fields and Free `showInProjects:false`; if deleted, assert no exports/callers remain.
- Account-agnostic migration logic (or a documented configuration path).

**Regression:**
- Existing `portfolio-save-items.test.ts`, `features-v2.test.ts`, `entitlements.test.ts` must still pass.
- Template apply still saves only the intended snapshot semantics (verify after merge changes).

**Manual (staging):**
- Throttled network + typing during save (F-09).
- Save a new project card, save, then edit it again — note this is F-17 (Phase 2); do not claim fixed here, but ensure Phase 1 changes don't worsen it.
- Crafted `updateProjectPage` invocation only on staging; confirm rejection/deletion (F-19).

**Commands:** Run targeted tests and TypeScript/ESLint/build only after explicit user approval and after confirming the DB target if anything touches a database. Record exact commands/output in the phase test report.

## 8. Definition of Done

- F-19 surface removed or fully allow-listed and entitlement-safe; no unused unsafe mutation endpoint if deletion was chosen.
- F-18 personal identifier removed from source and no new PII introduced; affected-account handling documented and approved.
- F-09 save merge implemented; edits during save survive; conflict/version behavior preserved; tests recorded.
- Diff reviewed; no unrelated changes; no schema/migration changes.
- `progress/PHASE_01_IMPLEMENTATION_REPORT.md`, `PHASE_01_TEST_REPORT.md`, and `PHASE_01_BLOCKERS.md` written.
- User explicitly accepts the phase.

## 9. Out of Scope

- F-07 downgrade save block, F-35 visibility (Phase 6).
- F-17 stale card editor, F-28/F-49 link cleanup, F-48 read-path migrations (Phase 2).
- F-11 slug propagation, F-12 View Page, F-10 undo/redo (Phase 3).
- Any Editorial/Classic appearance or layout work (Phases 4–5).
- Performance work (Phase 8).

## 10. Completion Report Requirements

Create under `audit-reports/implementation-roadmap/progress/`:
- **Implementation report:** findings addressed, files/functions changed, decisions (delete vs allow-list), PII handling (redacted), deviations, risks, follow-ups.
- **Test report:** exact commands, outputs, pass/fail, manual steps and results, anything not run and why.
- **Blockers:** policy questions, missing access, unexpected dependencies, required approvals.
Do not edit audit reports.

## Mandatory safety rules (repeat — applies to this phase)

PortfolioHub is a LIVE production SaaS application with real customer data. The execution agent MUST:
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
