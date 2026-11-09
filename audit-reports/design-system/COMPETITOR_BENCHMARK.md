# Competitor Benchmark — PortfolioHub

> Method: public documentation/product pages only (no competitor account testing). "Observed" = stated in the linked official doc; "Interpretation" = this audit's judgement.

## 1. Wix
**Observed** (`support.wix.com` — *Customizing Your Site's Theme and Design*, *Using and Customizing Your Color Theme*):
- Site Design panel exposes a **theme** combining color + text styles; presets can be applied and then customized.
- Color theme has semantic slots (backgrounds, lines/dividers, text types, links) and preset themes.
**Worth learning:** theme = coordinated pack, not a pile of independent color pickers; semantic color roles are named.
**PortfolioHub today:** has independent color pickers but no coordinated palette presets; semantic roles exist as tokens but the UI exposes raw fields without role guidance.
**Gap/appropriateness:** add 4–6 curated palettes and group pickers by role. Appropriate; low implementation risk.

## 2. Squarespace
**Observed** (`support.squarespace.com` — *Change your site's colors*, *Make style changes to your site*):
- Site Styles applies a **theme pack** (fonts, colors, buttons) then allows individual overrides.
- Palette editor: five-color palettes, presets, **generate from image**, **generate from a primary color**, plus section-level color themes.
**Worth learning:** palette generation and section-level theme application; curated palettes reduce decision fatigue.
**PortfolioHub today:** 13 raw color inputs, no generation, no section-level theming.
**Gap/appropriateness:** "generate palette from primary color" is a strong, contained feature; section-level theming is larger and may conflict with the single template.

## 3. Webflow
**Observed** (`developers.webflow.com` — *Variables*; `webflow.com/webflow-way/design-systems/variables`):
- Design tokens: color, size, typography, font-family variables; aliases; modes for light/dark; variables cascade everywhere.
**Worth learning:** a small, named token set (12–20) with semantic aliases is more maintainable than dozens of raw values.
**PortfolioHub today:** app tokens are semantic and centralized, but portfolio appearance is stored as raw per-user values; landing pages use separate token systems.
**Gap/appropriateness:** formalize a portfolio token contract (semantic roles) and reuse it in the builder preview; appropriate, medium complexity.

## 4. Framer
**Observed** (`framer.com/developers/styles`, `framer.com/help/articles/how-to-use-text-styles`):
- Color Styles and Text Styles are reusable, named, light/dark aware; text styles define font/size/weight/line-height/letter-spacing and apply across pages.
**Worth learning:** named text styles (display/H1/H2/body/caption) and color styles with light/dark pairs.
**PortfolioHub today:** per-portfolio font only; no type scale or named text styles; light/dark colors are separate pickers but not paired roles.
**Gap/appropriateness:** add a small type-scale preset (Compact/Comfortable/Editorial) and paired light/dark color roles. Appropriate, medium complexity.

## 5. Behance
**Observed (public product knowledge, not a fetched doc):** platform-controlled project presentation; emphasis on project covers, grids, and creator profile; users customize content, not the site chrome.
**Worth learning:** strong, consistent project-cover treatment and predictable grid; the platform keeps visual quality by constraining presentation.
**PortfolioHub today:** one template with user colors; project cards already have consistent media treatment (image/file/video/none).
**Gap/appropriateness:** keep template control but add a curated "presentation preset" (card ratio, spacing) rather than full CSS freedom.

## 6. Dribbble
**Observed (public product knowledge, not a fetched doc):** portfolio shots with fixed aspect thumbnails, strong hover/reveal, tag/filter discovery; presentation is platform-defined.
**Worth learning:** fixed thumbnail ratios and consistent card rhythm make grids feel professional; filtering/tags aid discovery.
**PortfolioHub today:** aspect ratios are now configurable per card (good), but tags are display-only and there is no portfolio-level filter.
**Gap/appropriateness:** optional project tag filter on public portfolios; low priority, medium complexity.

## Summary: what leading products do better
1. **Coordinated palettes/themes** instead of raw color fields (Wix/Squarespace).
2. **Named design tokens and text styles** (Webflow/Framer).
3. **Section-level styling** (Squarespace) and **palette generation** (Squarespace).
4. **Template/presentation presets** with constrained quality (Behance/Dribbble).
5. **Mobile-first style editing** (Wix/Squarespace apps).

## What not to copy
- Full CSS/HTML freedom (Webflow) — conflicts with PortfolioHub's constrained, safe template model and server-side schema.
- Per-element styling for every component (Wix) — would overwhelm the current builder and multiply QA surface.
- Complex CMS/e-commerce theming — out of product scope.

## Sources
- https://support.wix.com/en/article/wix-editor-customizing-your-sites-theme-and-design
- https://support.wix.com/en/article/wix-editor-using-and-customizing-your-color-theme
- https://support.squarespace.com/hc/en-us/articles/205815278-Change-your-site-s-colors
- https://support.squarespace.com/hc/en-us/articles/205815788-Make-style-changes-to-your-site
- https://developers.webflow.com/designer/reference/variables-detail-overview
- https://webflow.com/webflow-way/design-systems/variables
- https://www.framer.com/developers/styles
- https://www.framer.com/help/articles/how-to-use-text-styles
- Behance/Dribbble: general public product observation; no official docs fetched — treat those rows as interpretation.
