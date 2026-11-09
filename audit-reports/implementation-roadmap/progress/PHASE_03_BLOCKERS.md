# Phase 3 — Blockers

1. **Undo/Redo product scope:** implemented as local, bounded state history. It does not undo server-side responses, surviving page reloads, or other tabs. A richer revision system is a product decision.
2. **Page publication policy:** added an owner-facing `isPublished` checkbox; whether unpublished pages should also be hidden from direct URLs is already enforced by the public detail route. No migration.
3. **View Page:** only shown for published portfolios, Pro plan, real slug and `isPublished !== false`; draft/public policy may need product confirmation.
4. **Manual verification:** no browser or database used. Multi-tab/race behavior remains outstanding.
5. **Pre-existing failures:** two `features-v2` tests fail against existing Classic source text; unrelated to Phase 3 and left untouched.
