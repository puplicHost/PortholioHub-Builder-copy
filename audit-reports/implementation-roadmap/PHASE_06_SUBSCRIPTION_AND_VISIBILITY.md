# Phase 6 — Subscription and Visibility

## 1. Objective

Ensure Pro→Free transitions never trap users in an unsaveable Builder, and make public portfolio visibility follow one explicit, documented policy across home and project routes.

## 2. Scope and Finding IDs

- **F-07 (Critical):** a downgraded user with Editorial selected cannot save any content.
- **F-35 (Low/Medium):** home and project routes apply different subscription visibility rules.

Both require product-policy approval. Do not guess the intended business behavior.

## 3. Current Evidence

**Audit references:** `SECURITY_AND_ENTITLEMENTS_AUDIT.md` §2, §7; `CROSS_SYSTEM_INTEGRATION_AUDIT.md` §4–§6; `TEMPLATE_EDITORIAL_AUDIT.md` §2.3; `MASTER_FINDINGS.md` rows F-07/F-35.

**Confirmed evidence:**
- F-07: `updatePortfolio` rejects any Free save whose raw `appearance` contains `template:'editorial-marketing'` (`actions/portfolio.ts:455–468`). The Builder sends the full appearance on every save (`BuilderClient.tsx:1296–1310`), so all saves fail until Classic is applied via the Templates modal.
- F-35: `src/lib/visibility.ts` documents PUBLISHED + not hidden + ACTIVE/GRACE, but `u/[username]/page.tsx:35–48` only checks PUBLISHED/not hidden; the project detail route uses `isPortfolioVisible` + `canViewLockedSections` (`projects/[slug]/page.tsx:36–40`).
- `getSubscriptionState` treats SUSPENDED (`canceledAt`) as Free immediately; GRACE is paid.

**Confidence:** F-07 C (behavior), desired downgrade UX requires approval. F-35 C (inconsistency), policy requires approval.

## 4. Required Investigation

1. Enumerate every save path that sends `appearance` (Builder save, template apply, any admin/legacy path) and every guard that reads `template`.
2. Confirm whether a “save that preserves the existing template without changing it” can be distinguished safely server-side from “activation attempt”.
3. Review subscription states and transitions (NONE/ACTIVE/GRACE/EXPIRED/SUSPENDED) and the meaning of `canceledAt`.
4. Decide public visibility policy with the user:
   - Free published portfolios publicly visible, with project pages Pro-only; or
   - Subscription-gated home and project pages.
5. Check `stripLockedSectionsForFree`, footer/contact fallbacks and paid content preservation.
6. Inspect Builder subscription bootstrapping (`builder/page.tsx` catches failures and defaults to Free).
7. Search existing subscription tests (`entitlements`, `subscription-actions`, `subscription-permissions`) for expected semantics.

## 5. Implementation Requirements

### F-07 — Downgrade save behavior
Choose and implement an approved option:
- **Option A (recommended):** the server permits a save that keeps the **same** Pro template while the user is Free, but rejects adding/changing to a Pro template. Non-template edits remain possible. Public rendering may continue with the saved template (presentation-only) or fall back per policy.
- **Option B:** on downgrade, automatically switch the stored template to Classic (only with explicit user approval and a documented, reversible data change).
- **Option C:** UI-guided migration on Builder open (clear prompt + one-click “Switch to Classic to keep editing”), with safe server behavior until the user acts.

Requirements for any option:
- Do not silently downgrade if subscription lookup fails; fail closed without corrupting data.
- Never allow a Free user to **activate/select** Editorial via UI or crafted payload.
- Preserve all content and appearance keys; switching back after re-upgrade remains possible.
- Keep the template entitlement guard authoritative server-side.
- Add a clear, specific error/toast if a save is rejected; generic “save failed” is not acceptable.

### F-35 — Visibility policy
- Codify the approved rule in one helper (or two clearly named helpers if home and project pages intentionally differ) and use it in both routes.
- If Free portfolios should be public: update `isPortfolioVisible`/comments/contract and keep project pages Pro-only.
- If home pages are subscription-gated: apply the same check to the home route; ensure locked-section stripping and 404/upgrade UX are coherent.
- Document the decision, including expired/grace/suspended behavior.
- Do not leak paid-only content in either case.

### Constraints
- No schema change; no subscription/payment rule changes without approval.
- Do not modify customer records automatically as part of this phase.
- Keep `GRACE` behavior consistent with the approved policy.
- Preserve all existing uncommitted work.

### Edge cases
- Pro→Free→re-upgrade without losing the saved template.
- Downgrade while the Builder is open in two tabs.
- Subscription lookup throws.
- Free user with legacy standalone pages (preserved content; hidden publicly).
- Editorial template with Free-locked sections (strip consistently).
- Admin suspension vs natural expiry.

## 6. Security and Data Safety Considerations

- Entitlement checks must remain server-side and fail closed.
- A crafted request must not activate a Pro template or bypass locked sections.
- Do not accept client-provided plan/state.
- No production customer updates; use synthetic subscription rows in staging.
- Any automatic template change is customer data — requires explicit approval, backup/rollback plan, and documentation.

## 7. Testing Requirements

**Unit/integration (mocked subscriptions):**
- Free save with unchanged Editorial template behaves per approved option; activation/change still rejected.
- Pro save works; GRACE works; SUSPENDED/EXPIRED per policy.
- Subscription lookup failure: save rejected safely (no partial write), no silent template change.
- Visibility helper matrix for home/project with NONE/ACTIVE/GRACE/EXPIRED/SUSPENDED + published/draft/hidden.
- Locked-section stripping remains intact.

**Manual staging:**
- Synthetic users: Pro→Free (with Editorial saved) → edit/save; re-upgrade; Free→Pro; grace; suspension.
- Public home/project behavior for each state.
- Two-tab save/conflict during downgrade.

Record commands/results; verification requires approval.

## 8. Definition of Done

- Approved F-07 policy implemented; downgraded users can save without bypassing Pro activation.
- Approved F-35 policy implemented consistently; one documented contract.
- No entitlement leak or silent customer-data change.
- Tests/manual recorded; user accepts.

## 9. Out of Scope

- F-01/F-02 template defaults and appearance (Phase 4).
- F-09 save-state race (Phase 1); F-07 implementation must not reintroduce edit loss.
- F-12/F-34 page publish/navigation (Phase 3).
- F-27/F-38 UX (Phase 7); F-40–F-44 performance (Phase 8).

## 10. Completion Report Requirements

`progress/PHASE_06_IMPLEMENTATION_REPORT.md`: approved policy decisions, guard changes, visibility contract, files changed, transition matrix.
`PHASE_06_TEST_REPORT.md`: subscription-state tests, save/activation matrix, manual staging results.
`PHASE_06_BLOCKERS.md`: unresolved policy questions, required approvals, any customer-data action deferred.

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
