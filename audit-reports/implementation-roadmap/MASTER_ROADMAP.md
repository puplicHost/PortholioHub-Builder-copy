# Master Roadmap — Eight Phases

Source evidence: `audit-reports/comprehensive-system-audit/MASTER_FINDINGS.md` (F-01…F-49), with supporting reports.
Execution rule: one phase at a time; each phase must be implemented, verified, documented and explicitly accepted before the next starts.

## 1. Phase overview

| Phase | Name | Objective | Finding IDs | Primary user-facing improvement | Depends on | Main risks | Manual verification | Definition of Done |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Security and Save Safety | Remove exploitable server-action behavior and stop save-time edit loss | F-09, F-18, F-19 | Saves never silently drop keystrokes; unused dangerous action gone; no hard-coded PII | — | Breaking a save flow; over-broad action removal; PII history handling | Throttled-network save; crafted action test (staging) | Security findings closed; save merge tested; reports written; user accepts |
| 2 | Data Integrity and Persistence | Stabilize IDs and relationships; make read paths pure | F-17, F-28, F-48, F-49 | Editing a new card after save works; deleting a card does not leave dead links; opening Builder no longer mutates data | Phase 1 | Migration removal could skip needed legacy repairs; reference cleanup deleting wrong rows | Synthetic duplicate sections; card deletion/link flows | Relationship tests pass; migration path approved; no data loss; user accepts |
| 3 | Builder Core Functionality | Restore missing section creation, undo/redo, slug propagation, View Page, page publish, preview navigation | F-06, F-10, F-11, F-12, F-34, F-46 | Users can add Contact/Gallery/Files; links survive slug rename; there is a real View Page; preview stays in Builder | Phases 1–2 | New UI scope creep; removing undo vs implementing history decision; route changes | Staging Builder walkthrough | Each workflow demonstrated; tests/checks recorded; user accepts |
| 4 | Editorial Template Integration | Make Editorial truly Builder-configurable and preview-consistent | F-01, F-02, F-03, F-04, F-05, F-08, F-15, F-20–F-26, F-29, F-30, F-33, F-36, F-37, F-39, F-45, F-47 | Settings actually affect Editorial; layouts/order/actions work; mobile preview is truthful; Arabic/a11y polish | Phases 1–3 | Re-skinning existing customers; schema drift; over-scoping the visual redesign | Full visual matrix desktop/mobile/RTL; reference review | Compatibility matrix satisfied; Classic unchanged; tests/manual recorded; user accepts |
| 5 | Classic and Shared Template Fixes | Fix Classic content/link defects and make project detail presentation coherent | F-13, F-14, F-16 | Photo-less testimonials appear; phone/WhatsApp links work; project pages match selected template | Phase 4 (design tokens), Phase 3 (links) | Accidentally changing Classic look; detail-page redesign scope | Classic + Editorial project page walkthrough | Findings fixed; Classic regression checked; user accepts |
| 6 | Subscription and Visibility | Make downgrade/visibility behavior safe and policy-consistent | F-07, F-35 | Downgraded users can still save safely; public visibility follows one rule | Phases 1–5 | Entitlement bypass; paid content leakage; policy guesswork | Synthetic subscriptions: Pro→Free→Pro, grace, suspend | Approved policy implemented; transition tests; user accepts |
| 7 | UX, Accessibility and Responsive Quality | Clarify template preview state, fix type/seed drift, footer source; close remaining a11y/responsive gaps | F-27, F-31, F-32, F-38 + UX follow-ups (link names, drawer Escape, contrast measurement) | Predictable preview/apply; correct defaults; accessible links/dialogs | Phases 4–6 | Re-fixing earlier areas; inconsistent copy; a11y regressions | Keyboard/screen-reader/contrast checks | UX/a11y checklist passes; no duplicate fixes; user accepts |
| 8 | Performance and Final Quality | Measure and only then optimize; media lifecycle; final regression | F-40, F-41, F-42, F-43, F-44 | Proven performance wins, storage cleanup policy, no CLS/stale preview; release-quality review | Phases 1–7 | Optimizing a non-problem; destructive storage cleanup | Bundle/CWV measurements; admin preview; final regression | Measurements documented; only proven issues fixed; final acceptance |

## 2. Master checklist

- [ ] Phase 1 accepted
- [ ] Phase 2 accepted
- [ ] Phase 3 accepted
- [ ] Phase 4 accepted
- [ ] Phase 5 accepted
- [ ] Phase 6 accepted
- [ ] Phase 7 accepted
- [ ] Phase 8 accepted

## 3. Finding coverage (F-01 … F-49)

| Finding | Severity | Phase | One-line scope |
| --- | --- | --- | --- |
| F-01 | Critical | 4 | Editorial ignores appearance tokens |
| F-02 | Critical | 4 | No template-specific defaults; misleading reset |
| F-03 | Critical | 4 | Experience/skills/projects layout modes ignored |
| F-04 | Critical/High | 4 | Editorial preview uses viewport queries in a container frame |
| F-05 | High | 4 | Editorial ignores section order |
| F-06 | Critical | 3 | No UI to create Contact/Gallery/Files |
| F-07 | Critical | 6 | Downgraded Editorial user cannot save |
| F-08 | High | 4 | Missing Editorial floating actions/WhatsApp analytics |
| F-09 | High | 1 | Save race discards in-flight edits |
| F-10 | High | 3 | Dead Undo/Redo controls |
| F-11 | High | 3 | Slug rename breaks linked cards |
| F-12 | High | 3 | No View Page; misleading/404 View Live |
| F-13 | High | 5 | Photo-less Classic testimonials invisible |
| F-14 | High | 5 | Classic phone/WhatsApp href + icon defects |
| F-15 | High | 4 | Editorial hero ignores focal point/background/overlay |
| F-16 | High | 5 | Project detail page ignores Editorial template |
| F-17 | High | 2 | Stale card editor after new-card save |
| F-18 | High | 1 | Hard-coded customer email in migration logic |
| F-19 | High | 1 | updateProjectPage mass assignment/entitlement bypass |
| F-20 | Medium | 4 | Editorial clients logo options ignored |
| F-21 | Medium | 4 | Editorial section titles/descriptions/icons ignored |
| F-22 | Medium | 4 | Editorial education images ignored |
| F-23 | Medium | 4 | Testimonial subtitle/rating handling |
| F-24 | Medium | 4 | Custom card options ignored |
| F-25 | Medium | 4 | Stats/features/extras truncation |
| F-26 | Medium | 4 | Presence rules diverge from Classic |
| F-27 | Medium | 7 | Preview state/apply semantics confusing |
| F-28 | Medium | 2 | Card deletion leaves dangling links |
| F-29 | Medium | 4 | Hero intro duplicates role |
| F-30 | Medium | 4 | Contact label + footer icon inconsistency |
| F-31 | Low | 7 | Stale Appearance.template union/unused import |
| F-32 | Low | 7 | Seed defaults mismatch UI/types |
| F-33 | Low | 4 | Editorial header nav limited to five links |
| F-34 | Low | 3 | No page publish control; dead isPublished |
| F-35 | Low | 6 | Home/project visibility contract inconsistent |
| F-36 | Low | 4 | Editorial scroll state reads window in preview |
| F-37 | Low | 4 | Hero reference-fidelity difference (needs design decision) |
| F-38 | Medium | 7 | Footer link source inconsistency |
| F-39 | Low | 4 | Arabic font fallback inconsistency |
| F-40 | Low | 8 | Possible extra template bundle (hypothesis) |
| F-41 | Low | 8 | R2 objects not deleted with DB rows |
| F-42 | Low | 8 | Missing image dimensions/CLS |
| F-43 | Low | 8 | Admin preview revalidation staleness |
| F-44 | Low | 8 | Dead appearance fields |
| F-45 | Low | 4 | Editorial text-link focus visibility |
| F-46 | Low | 3 | Preview links can navigate away |
| F-47 | Low | 4 | Picker previews/clarity limitations |
| F-48 | Medium | 2 | Destructive migrations on profile read |
| F-49 | Low | 2 | Card↔card references + deletion (overlaps F-28) |

No finding is unassigned. No finding is assigned to two phases as a primary owner.

## 4. Intentional overlaps (and why)

1. **F-28 ↔ F-49** (both Phase 2): the same deletion cleanup can resolve both. F-49 only covers card→card reference policy; if the product team removes card→card linking, the cleanup still remains for legacy data.
2. **F-30 ↔ F-14** (Phases 4 and 5): F-30 includes the shared footer icon fallback; F-14 includes the Classic contact-section icon/href. **Ownership:** Phase 4 changes the Editorial contact label + shared footer icon selection; Phase 5 only changes the Classic contact section and verifies the shared helper in Classic. No duplicate code change; Phase 5 verifies the Phase 4 helper.
3. **F-12 ↔ F-34** (both Phase 3): View Page navigation and page publish state are related but separate. Phase 3 owns both; F-34 may be resolved by adding a publish control or by a product decision to remove the filter.
4. **F-27 ↔ F-47** (Phases 7 and 4): F-47 is thumbnail/clarity inside the picker (Phase 4); F-27 is persisted preview state/apply semantics (Phase 7). Phase 4 must not claim F-27 fixed.
5. **F-04 ↔ F-42** (Phases 4 and 8): F-04 is responsive logic; F-42 is intrinsic image dimensions/CLS. Different root causes.
6. **F-01/F-02 ↔ F-31/F-32** (Phases 4 and 7): F-31/F-32 are type/seed vocabulary cleanup that must happen after Phase 4 settles the template appearance contract. Phase 4 must not rewrite the `Appearance.template` type in a conflicting way; Phase 7 finalizes it.
7. **F-07 ↔ F-09** (Phases 6 and 1): F-09 is state replacement inside a save; F-07 is the entitlement guard blocking saves. Phase 1 must not change entitlement semantics; Phase 6 owns the downgrade policy.

## 5. Unassigned or requiring a decision

There are **no unassigned findings**. The following require explicit product/user approval before implementation:

| Decision | Phase | Options |
| --- | --- | --- |
| F-02 Editorial appearance model | 4 | (A) Editorial consumes existing Classic-named appearance keys; (B) template-scoped `appearance.templates[id]` overrides with template defaults; (C) declare Editorial style fixed and disable/hide appearance controls. Recommended: B; must not re-skin existing customers. |
| F-37 Hero fidelity | 4 | Keep the current arch-portrait interpretation, or rebuild to the reference phone-mockup structure. Requires visual approval; do not redesign implicitly. |
| F-48 read-path migrations | 2 | Extract to an explicit admin/one-time job, or convert to an idempotent non-destructive repair with user approval. Do not silently delete duplicates. |
| F-10 Undo/Redo | 3 | Implement history (scope: builder state only? caps? coalescing?) or remove/disable the controls. Removing requires user confirmation because it changes visible UI. |
| F-34 page publish control | 3 | Add a publish toggle or remove `isPublished` filtering and document that pages publish with the portfolio. |
| F-07 downgrade behavior | 6 | Allow non-template saves while preserving the stored template; force Classic on downgrade; or guided migration. Must remain non-bypassable for Pro activation. |
| F-35 visibility policy | 6 | Free published portfolios public (project pages Pro-only) vs subscription-gated home. Must be explicit and consistent. |
| F-41 R2 cleanup | 8 | Retention/garbage-collection policy; destructive deletion needs approval and backups. |
| F-47 previews | 4 | Real thumbnails require screenshot assets; otherwise use a faithful static swatch with clear labeling. |

## 6. Hypotheses and confidence handling

- **F-09** is strongly evidenced (React state replacement after `await`) but the user-visible race must be reproduced under throttling before/after the fix.
- **F-19** mass assignment is confirmed in source; whether the unused Server Action is reachable in the deployed build must be verified. Do not perform this against production.
- **F-40** is a hypothesis; measure bundles/network before changing the route imports. Do not report it as a confirmed performance bug.
- **F-42** CLS is analytical; measure in a browser only if authorized.
- **F-48** destructive risk depends on real legacy data; use synthetic staging only.

## 7. Phase gates

Before moving to the next phase, all must be true:
1. In-scope findings implemented or explicitly deferred with approval.
2. Targeted tests added/updated and results recorded.
3. TypeScript/ESLint/build checks run **after approval** and recorded.
4. Diff reviewed; no unrelated changes.
5. Manual verification completed or handed to the user with exact steps.
6. `progress/PHASE_XX_*.md` written.
7. User explicitly accepts the phase.

If any gate fails, stop and report. Do not proceed.
