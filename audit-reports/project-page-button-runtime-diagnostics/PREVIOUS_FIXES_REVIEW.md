# Previous Fixes Review

This review is based on the current source and the reports present under `audit-reports/`. The reports are treated as historical claims, not runtime evidence.

| Previous attempt | Files changed / implicated | What the tests actually proved | What they did NOT prove | Why the user could still see the failure |
| --- | --- | --- | --- | --- |
| Shared destination resolver | `src/lib/project-card-links.ts`, `ClassicTemplate.tsx`, `EditorialMarketingTemplate.tsx` | A synthetic card object with one of the tested `linkType`/slug shapes resolves to a page href. | That the Builder's actual selected card object has that shape at edit time, after save, and after reload. | The live card can have a different field combination (empty top-level slug shadowing content, unpublished target, free-plan state, temp slug). The resolver tests do not observe those values. |
| Page-id and `/projects/slug` normalization | `project-card-links.ts`, `portfolio.ts`, `ProjectManager.tsx` | The helper accepts page ids/paths; selected editor updates write `linkType='page'`. | That the selected target id/slug is canonical in the preview and after a reload. | The server can persist a temporary slug in `content.linkedPageSlug`; the client remap only fixes the top-level field, and `getOrCreateProfile` later replaces it from `content`. |
| Explicit `none` preservation | `project-card-links.ts`, resolver tests | `linkType:'none'` returns `null` even when a stale slug exists. | That `none` is what the live card actually contains when the user says the button is missing. | The live card may not be `none`; if it is, the expected CTA is absent by design. No runtime trace existed to distinguish intent from defect. |
| Real-template CTA tests | `__tests__/project-card-cta.test.ts` using `renderToStaticMarkup` on Classic/Editorial | The real JSX branch emits a CTA for a synthetic profile with a published target, and hides it for `none` / deleted target. | That the Builder passes the same profile, template, plan flag, and target publication state. | The tests construct `profile.projectPages` manually. They never inspect `deferredPreviewProfile`, the active template override, the actual Builder DOM, or the user's target row. |
| Persistence tests | `__tests__/current-bug-fixes.test.ts`, `__tests__/portfolio-save-items.test.ts` | Server normalization and canonical slug behavior for the tested fixtures. | That the user's saved row is the tested shape; that the target is published; that the public route includes it. | Database/customer state was never inspected (and must not be). A single `isPublished:false` or temp content slug produces the same symptom while all tests pass. |
| Final-correction and actual-UI reports | Multiple report folders | TypeScript/tests passed and the code paths were reviewed. | Browser rendering, actual editor selection, save/reload, public route output, or CSS visibility. | They explicitly did not run a browser. The current report therefore does not repeat a completion claim. |

## Important source-level gaps found while reviewing

These are **candidate defects to verify with the new trace**, not proven root causes:

1. **Top-level empty slug shadows a valid content slug.**
   `resolveProjectCardDestination` uses `project.linkedPageSlug ?? content.linkedPageSlug`.
   An empty-string top-level slug is not nullish, so it prevents a valid `content.linkedPageSlug` from being used.
   The card editor's `updateEditingCard` writes only the top-level field, while other paths write both layers.

2. **Temporary target slugs can remain in `content.linkedPageSlug`.**
   `handleSaveChanges`'s `applyProjectRemaps` updates `page.linkedPageSlug` but not `page.content.linkedPageSlug`.
   `getOrCreateProfile` later rebuilds the top-level field from `content`, so the canonical slug fixed in the client can revert after reload.

3. **`isPublished` is not persisted by the main builder save.**
   `updatePortfolio`'s `projectData` has no `isPublished` field; only the unused `updateProjectPage` action lists it.
   A target page that is unpublished cannot be republished through the visible Builder save flow. The resolver then hides the CTA by design.

4. **Plan state suppresses the CTA.**
   The resolver returns `null` for every page destination when `isFree` is true. `isFreePlan` is derived from `initialSubscriptionState` (`ACTIVE`/`GRACE` only). A canceled/expired subscription changes the behavior without any resolver defect.

5. **The preview is deferred.**
   `LivePreview` receives `deferredPreviewProfile`; the editor edits `profile`. A persistent mismatch would indicate stale preview state, not a resolver bug.

6. **A different template branch can render during Editorial's code-split load.**
   `LivePreview` renders Classic until the Editorial chunk loads. A transient Classic render can look like the wrong CTA; persistent mismatch points to template resolution.

## What the new diagnostic resolves

The new panel reports the actual editor card, the exact deferred preview card, the resolver result in both profiles, the template-level decision, and the rendered anchor's DOM/CSS state. It can now distinguish all six candidates above without another speculative code change.
