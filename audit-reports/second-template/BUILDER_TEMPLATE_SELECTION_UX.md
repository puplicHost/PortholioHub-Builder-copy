# Builder Template Selection UX Recommendation

## Placement

Recommend a top-level Builder entry in the header toolbar (icon = layers/template), as a persistent modal drawer—not buried inside Theme Settings or advanced tab.

Why:
- Theme/Color Settings is highly detailed and likely hidden.
- A dedicated template selector offers previews without impacting saved profile.
- Easy discoverable on desktop/mobile.
- Always at top-level, less RTL risk.
- Placement near other "Save/Preview/Publish"; can show "Current template".

## UX structure (modal)

- Title: `Choose portfolio template`
- Track row: `Active template: Classic`
- Card grid (2+ columns desktop, 1 column mobile).
- Card contents (large thumbnail, name, 1 sentence description, supporting tags).
- Buttons:
  - `Preview` (does **not** change saved state; opens integrated LivePreview or dedicated modal)
  - `Use this template` (explicit apply)
- Confirmation step for significant presentation change:
  - "Switching changes layout, wording arrangement, typography. Content stays; you can undo".
- Safety text: "Colors and appearance stay."
- Returning from template modal without change leaves appearance exactly.

### Preview differences

- Preview action updates draft `preview` only.
- Apply updates persisted profile (server) and refreshes builder.
- "Reset to Classic" button available; distinct from current template selection (no destructive copy).

## RTL/LTR

- Use grid columns and writing-mode auto.
- Preview frame uses `dir` same as visitor; floating modal under `@container`.
- Ensure virtual focus for keyboard users and `aria-live` selection update.

## Discoverability

- On first boot (no template set), label `Current: Classic` (preserves all customers).
- An analytics/value note (e.g., "Pro-only template" label) may gate options based on server entitlement.
- Avoid "Templates" ambiguous strategy and portfolio templates same phrase; use "Portfolio templates".

## Navigating and status

- After apply, builder automatically refreshes `LivePreview` (same profile identity) after autosave success.
- Current applied template name remains displayed in toolbar.

## Existing settings interaction

- Template choice should be priced as *presentation*, not appearance color options.
- Color/appearance values remain when switching; both templates read from same appearance keys (colors overridden by template palette? rgb-needs).
- Some tokens are template-unique (typography warmth/warm beige). Allow layout tokens, but keep owned `appearance.primaryColor` etc. as customer data (appearance system) and let template's theme augment from its baseline CSS variables.

---

Recommendation: place selector in header, as distinct anchor. Users should not search elsewhere.
