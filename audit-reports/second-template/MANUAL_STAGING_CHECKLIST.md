# Manual Staging Checklist — Editorial Marketing Template

Environment first: staging with an **isolated, disposable database** (never production).
This feature performs no migrations — the only new state is `userProfile.appearance.template`
(a key inside existing JSON), and it arrives only through the audited save path.

## 0. Preparation
- [ ] Confirm staging DB is not production (`DATABASE_URL` target check; no SQL written for this feature).
- [ ] Seed synthetic users: one Free (`NONE` state), one Pro (an active subscription row).
- [ ] Give each user representative content: hero, about + stats, project cards (page-linked card, external-link card, file card, video card), clients with and without logos, skills, services, experience, education, testimonials, gallery, files, custom page, contact links, Arabic and English variants; bilingual content (`{ar,en}`) on at least one section.

## 1. Builder — discovery & preview (no persistence)
- [ ] Open `/profile/builder`. Header shows **Templates** next to the device switcher, NOT buried under Settings → Appearance.
- [ ] Open the modal: Classic and Editorial Marketing cards visible; editorial carries a **Pro** badge; Free users additionally see "Free preview — applying requires a Pro subscription."
- [ ] Press **Preview** on Editorial: the canvas switches to the editorial look; header save status stays clean (no "unsaved changes" spinner from the preview itself given no dirty content).
- [ ] Press **Exit preview** / Done → canvas reverts to the saved Classic look. Reload the page → the portfolio is unchanged (preview never persisted).
- [ ] Browser network tab during preview: **no** `updatePortfolio` request is fired.

## 2. Free user — apply blocked
- [ ] In the picker, the editorial **Apply template** button is replaced by the upgrade CTA; clicking it opens the same WhatsApp / subscription funnel as the free-plan banner.
- [ ] **API check (crafted request):** with devtools, issue the same `updatePortfolio` the Save button fires but with `appearance: {…existing…, template: 'editorial-marketing'}`. Expect `{ success:false, error: '…Pro…', code:'PRO_TEMPLATE_REQUIRED' }`, HTTP 200-with-error envelope like other saves.
- [ ] Verify the stored appearance afterwards (staging DB read) still has the old content — the rejection changes nothing.
- [ ] Crafted casing variants (`EDITORIAL-MARKETING`, `editorial`) → same rejection. Junk (`<script>…`) → request succeeds but the persisted JSON has no `template` key, and the public page stays Classic.
- [ ] Free user with legacy `theme:'warm'` appearance → public page still Classic (theme never selects a template).

## 3. Pro user — apply & revert
- [ ] Apply Editorial: save spinner → success toast; reload: editorial persists (`appearance.template === 'editorial-marketing'`).
- [ ] Verify content preservation after apply: pages/sections order, project cards (video plays inline, file cards, external links, page links work), attachments, gallery, files, custom page, contact links, per-user colors/fonts unchanged.
- [ ] Switch back to Classic the same way; reload → Classic persists with all appearance keys (accent color, color mode, fonts) intact.
- [ ] Apply from a second session while the first has edits pending in-memory (belt & braces around version conflict UX) — expect the normal `VERSION_CONFLICT` modal, not a broken template state.

## 4. Public route
- [ ] `/u/{staging-user}` renders editorial when saved; Classic renders for a control user; an unknown `template` value edited directly in the staging DB renders Classic (fallback).
- [ ] View source: no reference case-study demo content; all copy comes from stored content.
- [ ] Keyboard pass: header nav, drawer, card links, social links, back-to-top reachable in tab order; Escape closes the drawer/modal.
- [ ] `prefers-reduced-motion` on → hover transitions effectively removed on the editorial page.
- [ ] RTL: with `n: 'ar'` the page is `dir="rtl"`, mirrored arrows/logos, Arabic copy; English mode stays LTR.
- [ ] Lighthouse (informational): no console errors; interaction to paint is not regressed vs Classic on the same staging data.

## 5. Admin support preview
- [ ] `/admin/users/{id}/preview` for a Free user saved editorial-lapsed: renders editorial (presentation-only lag) and Classic controls; read-only — no save path.

## 6. Regression
- [ ] Classic user who never touched Templates: public + builder pixel-identical to before (no CSS bleed — editorial classes are `.emk*` namespaced).
- [ ] Publish/unpublish, section edit, project edit, upload flows unaffected.
- [ ] `npx vitest run __tests__/template-entitlements.test.ts` + full suite green on staging CI (only after test approval).
