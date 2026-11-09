# Phase 8 — Performance and Final Quality

## 1. Objective

Measure performance before optimizing, resolve proven bundle/CLS/revalidation issues, decide media-retention cleanup, remove or document dead appearance fields, and run the final cross-system regression after all earlier phases are accepted.

## 2. Scope and Finding IDs

- **F-40 (Low / hypothesis):** possible unnecessary Classic template loading when Editorial is selected.
- **F-41 (Low):** R2 objects are not deleted when related DB records are deleted.
- **F-42 (Low):** missing image `width`/`height` may cause layout shift.
- **F-43 (Low):** admin preview may serve stale data after saves.
- **F-44 (Low):** dead/partially dead appearance fields (`theme`, `layout`, `hideBadge`, `publicTheme`, `logoUrl`, `footerBg/footerText` controls).
- Final cross-system regression assessment.

Do not fix earlier findings here. If the final regression finds a defect, report it against its owning phase and stop/coordinate.

## 3. Current Evidence

**Audit references:** `UX_ACCESSIBILITY_PERFORMANCE_AUDIT.md` §4–§6; `TEMPLATE_EDITORIAL_AUDIT.md` §1–§2; `AUDIT_SCOPE_AND_LIMITATIONS.md` §8; `MASTER_FINDINGS.md` rows F-40–F-44.

**Evidence/confidence:**
- F-40: `u/[username]/page.tsx:4` statically imports `ClassicTemplate`; Editorial is dynamically imported at `111–113`. Whether the unused client chunk is actually shipped/downloaded is **unverified**; RSC may exclude the unrendered branch. **U — measure.**
- F-41: project/page/item deletion removes DB rows but no R2 object cleanup; presign/viewer routes are separate. **C** (storage lifecycle gap; policy needed).
- F-42: Editorial/Classic `<img>` tags generally lack intrinsic dimensions; some wrappers enforce aspect ratios. **C** (analytical CLS risk; measure).
- F-43: `updatePortfolio` revalidates `/profile/builder` and `/u/{username}` only; admin preview route is not revalidated. **C** (staleness; severity low).
- F-44: schema/Appearance contains fields with no Builder control/renderer use. **C** (dead surface; removal policy).

## 4. Required Investigation

1. Measure the public route for a Classic and an Editorial portfolio (bundle network + Lighthouse/CWV if tooling available). Do not infer from imports alone.
2. Inventory R2 object lifecycles vs DB rows/media records; inspect presign/complete/delete routes and storage-quota code.
3. Measure CLS on public and builder preview pages (if authorized); identify which images shift.
4. Test admin preview after a save (with cache/revalidation behavior) in staging.
5. Inventory dead/partially dead appearance fields and their consumers before removing anything.
6. Run the final regression matrix across both templates, plans, languages, and subscription states.

## 5. Implementation Requirements

### F-40 — Bundle/performance (measurement first)
- Document baseline: route JS transferred, LCP, CLS, INP where measurable, for Classic and Editorial.
- Only if the Editorial route ships Classic client code unnecessarily: split both templates behind dynamic imports or route-level presentational boundaries, preserving SSR and template fallback.
- Do not remove the Classic fallback path. Do not introduce a loading flash that breaks previews.
- If measurement shows no problem, record “no action required” with numbers; close the hypothesis.

### F-41 — Media lifecycle
- Define the approved retention policy:
  - immediate delete when no references remain (risky; requires reference audit), or
  - delayed garbage collection, or
  - manual/admin cleanup.
- Do not implement destructive object deletion without user approval and a rollback/backup plan.
- Ensure shared media (used by multiple items/pages) is not deleted while referenced.
- Log cleanup; make it idempotent and testable.
- If only documentation/decision is approved, deliver that and mark implementation deferred.

### F-42 — Image dimensions/CLS
- Add intrinsic `width`/`height` (or CSS aspect-ratio wrappers) to images lacking them; preserve responsive sizing.
- Verify no distortion; honor existing aspect/fit settings.
- Measure CLS before/after; do not claim improvement without numbers.

### F-43 — Admin preview freshness
- Ensure admin support preview reflects recent saves; revalidate the preview path or force dynamic fetching appropriate to the app’s architecture.
- Do not weaken access control.
- Test with staging saves.

### F-44 — Dead appearance fields
- For each field (`theme`, `layout`, `hideBadge`, `publicTheme`, `logoUrl`, `footerBg/footerText`, any others found): either expose a supported control or remove/deprecate it with migration-free documentation.
- Do not remove legacy fields if stored customer JSON may still use them; the renderer can ignore them safely. Prefer documenting over data migration.
- Keep `appearance` validation tolerant.

### Final quality gate
- Re-run the full regression matrix from earlier phases:
  - Classic and Editorial public pages (Free/Pro/grace/expired).
  - Template switching preserving content/appearance.
  - Project/page linking, slug rename, deletion cleanup.
  - Attachments/video/viewer access.
  - Preview vs public (desktop/mobile, RTL/EN/AR).
  - Accessibility checks from Phase 7.
- Verify no phase regressed another. Document every check.

## 6. Security and Data Safety Considerations

- Performance tooling must not send production data externally without approval.
- R2 cleanup is destructive; require approval, backups, reference checks, and isolated staging before any real deletion.
- Admin preview changes must not bypass authorization.
- No dependency upgrades without approval.
- Final regression must not use production customer data.

## 7. Testing Requirements

**Measurement:**
- Record baseline vs post-change bundle sizes and CWV (tool/date/environment).
- CLS before/after.
- Admin preview freshness test.

**Unit/integration:**
- Route template split logic if changed.
- Media reference/cleanup helper tests (no real R2 calls; mocks).
- Revalidation behavior where testable.
- Appearance field inventory/type checks.

**Manual (staging, approved):**
- Full cross-system regression matrix; both templates; plans; languages; mobile/desktop; project/page links.
- Verify no visual regressions from image dimensions.
- Final accessibility spot-check.

## 8. Definition of Done

- F-40 measured; fixed only if proven, with numbers.
- F-41 policy decided; safe implementation or documented deferral.
- F-42 measured and addressed/documented.
- F-43 behavior verified/fixed.
- F-44 fields documented or cleaned up without data loss.
- Final regression checklist complete; all results recorded; user accepts release readiness (deployment remains out of scope).

## 9. Out of Scope

- All functional/security fixes from Phases 1–7 (must already be accepted).
- New product features, redesigns, dependency upgrades.
- Deployment, production migrations, production data operations.

## 10. Completion Report Requirements

`progress/PHASE_08_IMPLEMENTATION_REPORT.md`: measurements, decisions (especially R2 retention), files changed, final regression results.
`PHASE_08_TEST_REPORT.md`: exact commands/tools, bundle/CWV/CLS numbers, tests, manual matrix, environment.
`PHASE_08_BLOCKERS.md`: unmeasured items, deferred cleanup, required approvals, residual risks.
Additionally write a short `FINAL_RELEASE_READINESS.md` in `progress/` summarizing accepted phases, residual known issues, and the fact that no deployment was performed.

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
