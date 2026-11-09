# PortfolioHub Remediation Roadmap — Execution Guide

**Status:** planning only. No application code, tests, schema, database, environment file or deployment was changed to produce this folder.
**Audit source:** `audit-reports/comprehensive-system-audit/` (read-only evidence).
**This folder:** `audit-reports/implementation-roadmap/`.

## 1. What this roadmap is

This is a sequential, gated remediation plan for the findings in `MASTER_FINDINGS.md` (F-01 … F-49) plus a small set of explicitly labelled follow-up accessibility/UX items derived from `UX_ACCESSIBILITY_PERFORMANCE_AUDIT.md`.

It is written for a separate AI coding agent. Each phase document is self-contained enough to execute without reconstructing the original audit, but the audit remains the evidence source.

## 2. Why eight phases

The order follows risk and dependency:

1. **Security and save safety** — remove exploitable actions and the only confirmed path that can silently lose edits.
2. **Data integrity** — stabilize identities and relationships before UI changes expand the number of writes.
3. **Builder core** — restore missing workflows and navigation while the data layer is stable.
4. **Editorial integration** — the largest design/config work; depends on stable save/data behavior and template selection UX.
5. **Classic/shared template fixes** — correct shared rendering after the Editorial design contract is settled.
6. **Subscription/visibility** — policy-sensitive transitions; must be decided with the user, not guessed.
7. **UX/accessibility/responsive** — polish and cross-cutting usability after functional behavior is correct.
8. **Performance/final quality** — measure, optimize only what is proven, and run the final cross-system regression.

## 3. Correct execution order

`PHASE_01 → PHASE_02 → PHASE_03 → PHASE_04 → PHASE_05 → PHASE_06 → PHASE_07 → PHASE_08`

**Do not start Phase 2 until Phase 1 has been implemented, verified, documented, and explicitly accepted by the user. Apply the same rule to every subsequent phase.**

Do not bundle phases to "save time." Do not start a phase whose dependency is still open unless the user explicitly accepts the risk in writing.

## 4. How to read a phase document

Every phase has the same sections:

1. Objective
2. Scope and Finding IDs
3. Current Evidence
4. Required Investigation
5. Implementation Requirements
6. Security and Data Safety Considerations
7. Testing Requirements
8. Definition of Done
9. Out of Scope
10. Completion Report Requirements

Read the phase document **and** the referenced audit sections before touching code. Treat audit findings' confidence labels as binding:
- **Confirmed / C** — source-proven; still re-verify against the current tree.
- **T / H** — test- or strongly-evidenced; reproduce safely before changing.
- **U** — hypothesis; measure/prove first, never present as a confirmed bug.

## 5. Mandatory safety rules (applies to every phase)

PortfolioHub is a LIVE production SaaS application containing real customer data.

The execution agent MUST:

1. Read this roadmap, the current phase document, and relevant project instructions before starting.
2. Execute only the current phase.
3. Inspect the actual current source code before implementing each finding.
4. Preserve all existing uncommitted work.
5. Never use `git reset`, destructive checkout, broad reverts, or overwrite unrelated work.
6. Never assume localhost or `NODE_ENV=development` proves the database is isolated.
7. Verify the database target before any database-related command.
8. Never write to production customer data.
9. Never run production SQL migrations, resets, reseeds or destructive scripts without explicit user approval.
10. Never deploy automatically.
11. Use isolated environments and synthetic test data only when database testing is necessary.
12. Never install or upgrade dependencies without explicit approval.
13. Do not use Playwright or browser automation unless the user explicitly authorizes it.
14. Do not silently change subscription, payment, customer-data or business rules.
15. Do not delete or rewrite existing customer content to simplify implementation.
16. Do not remove legacy compatibility behavior without proving it is safe.
17. Do not treat a passing TypeScript check as proof that a feature works.
18. Report blockers honestly rather than bypassing safety checks.

If an implementation requires production access, a migration, a product/policy decision, or a potentially destructive operation: **STOP and request user approval.**

## 6. Required workflow for every phase

1. Read the current phase document.
2. Read the referenced audit evidence.
3. Inspect the working tree and existing changes (`git status`, `git diff` read-only).
4. Confirm environment and data safety.
5. Reproduce or verify the finding using safe methods.
6. Write a short implementation plan for the phase (in the phase progress report).
7. Implement only the approved scope.
8. Run appropriate targeted tests.
9. Run relevant TypeScript/ESLint/build checks **only after explicit user approval** (per project instructions, verification commands require approval).
10. Review the diff for unintended changes.
11. Document all results.
12. Stop and wait for explicit user acceptance before starting the next phase.

## 7. Progress reporting

Create a `progress/` subfolder (create when Phase 1 starts). For every phase write:

- `PHASE_XX_IMPLEMENTATION_REPORT.md` — scope, files changed, decisions, deviations, evidence.
- `PHASE_XX_TEST_REPORT.md` — commands run, outputs, manual checks, pass/fail; explicitly state anything not run.
- `PHASE_XX_BLOCKERS.md` — blockers, open questions, required approvals, policy decisions.

Do not modify the original audit reports. If a finding turns out to be wrong, document the correction in the phase report and request an audit update rather than silently deleting the finding.

## 8. Verification and acceptance

A phase is **complete only when**:
- every in-scope finding is implemented or explicitly deferred with user approval;
- targeted tests pass (or the report states precisely what could not be run);
- TypeScript/ESLint/build results are recorded after approval;
- the diff has been reviewed for unrelated changes;
- manual checks required by the phase are completed (or assigned to the user with exact steps);
- the phase report and test report are written;
- the user explicitly accepts the phase.

Code changes alone are never completion.

## 9. Folder map

- `README.md` — this file.
- `MASTER_ROADMAP.md` — eight-phase overview, coverage matrix, gates, overlaps, decisions.
- `PHASE_01_SECURITY_AND_SAVE_SAFETY.md` … `PHASE_08_PERFORMANCE_AND_FINAL_QUALITY.md`.
- `progress/` — execution reports created per phase.

## 10. Final rule

**Do not start Phase 2 until Phase 1 has been implemented, verified, documented, and explicitly accepted by the user. Apply the same rule to every subsequent phase.**
