# Phase 2 — Blockers

1. **Legacy read-time migration removed.** Existing profiles that never received auto-inserted experience/education/testimonials/footer/clients sections will no longer be repaired automatically. `getOrCreateProfile` now preserves stored data. A separate, explicitly approved migration is required if this affects real accounts. No data was modified.
2. **Duplicate section cleanup stopped.** Duplicate-looking sections are no longer deleted on read. Product/data-owner approval is required before any cleanup.
3. **Editor identity state.** The open card editor resolves the alias for writes, but its local `editingItem.id` remains temporary until the form is reopened. No data loss occurs; UI polish can be completed in a later phase.
4. **Manual verification unavailable.** No database/staging access was used; card deletion/cleanup and legacy-profile behavior are verified only with mocks.
5. **Full suite has 2 pre-existing `features-v2` failures** unrelated to Phase 2; not fixed to avoid scope creep.
