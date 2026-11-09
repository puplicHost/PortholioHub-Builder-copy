# Manual User Instructions

These steps are for a **local development or staging** session using a Pro test account. Do not run them against production customer accounts. The diagnostic panel is disabled in production builds.

## 1. Start the local Builder

Use the existing project scripts (do not install or upgrade anything):

```bash
npm run dev
```

Open `/profile/builder` and sign in with the local/staging account that owns the failing card.

The panel appears in the bottom-right (above the mobile tab bar on small screens) with the heading:

> Card diagnostics · dev only

If it does not appear, the process is running a production build (`NODE_ENV=production`). Do not use that build for this trace.

## 2. Open the failing card

1. Select the **Home** page.
2. Open the **Projects** section in the left panel.
3. In the right panel, click **Edit** on the homepage card that should link to the internal Project Page.
4. The panel now shows that card's id/title.

Do not change anything yet.

## 3. Select the internal Project Page

1. In **Project Link**, choose **Project Page**.
2. In **Link to Page**, select the target Project Page.
3. Wait for the preview to settle (one to two seconds; the preview uses deferred rendering).
4. Do **not** save yet.

### Capture stage 1 — after selection

Click **Copy trace** in the panel. Save the JSON to a file named:

```
stage-1-after-selection.json
```

Record these rows in `ACTUAL_RUNTIME_TRACE.md`:

| Row | Expected for a healthy internal page |
| --- | --- |
| `Source` | `top-level` or `top-level + content mirror` |
| `linkType (top)` | `page` |
| `slug (top)` | the target page slug |
| `Target found` | `yes (target-slug)` |
| `Target published` | `yes` |
| `Is free plan` | `no` |
| `Destination` | `/u/<username>/projects/<target-slug>` |
| `CTA visible` | `true` |
| `Preview stale` | `no` after settling |
| `DOM surface` | `found` |
| `DOM template` | the selected template |
| `Matching anchors` | `1` |
| `DOM text` | `View Project` or the custom label |
| `CSS display/vis/op` | not `none` / not `hidden` / not `0` |
| `In preview viewport` | `yes` after scrolling the preview to the card |
| `Hit test` | `anchor reachable` |
| `Hidden because` | `not hidden` |

If the CTA is missing in the preview, copy the trace immediately and note which row first deviates.

### Important: scroll the preview to the card

The DOM probe only marks `In preview viewport: yes` when the anchor intersects the visible preview box. If the card is below the fold, `In preview viewport: no` is expected; scroll the preview to the card and observe again. A `Matching anchors: 1` with a valid box still proves the button exists in the DOM.

## 4. Save

Click **Save Changes** and wait for the success toast.

### Capture stage 2 — after save

Click **Copy trace** and save:

```
stage-2-after-save.json
```

Pay special attention to:

- `slug (top)` vs `slug (content)`
- `Preview stale`
- `Target found`
- `Destination`
- `CTA visible`
- `CSS display/vis/op`

If `slug (top)` is a real slug but `slug (content)` still contains a `new-...` or `project-new-...` value, preserve this trace. That is evidence for the temp-slug hydration issue described in `ROOT_CAUSE.md` candidate D.

## 5. Reload the Builder

Reload the page (`F5` / `Cmd-R`). Reopen the same card.

### Capture stage 3 — after reload

Click **Copy trace** and save:

```
stage-3-after-reload.json
```

Compare stage 1/2 to stage 3. The panel's `Preview stale` compares the editor card to the preview profile, not across page reloads, so also compare the JSON fields manually.

If the button was visible in stage 2 but absent in stage 3, record:

- stage 2 `slug (top)` and `slug (content)`
- stage 3 `slug (top)` and `slug (content)`
- stage 3 `Target found`, `Destination`, `Hidden because`

Do not save again until the trace is copied.

## 6. Verify the published portfolio

1. Publish the portfolio if it is not already published (use the Builder Publish button).
2. Open `/u/<username>` in a new tab.
3. Find the same card.
4. Check whether `View Project` is visible and whether its href is `/u/<username>/projects/<target-slug>`.
5. Click it and confirm the correct Project Page opens.

If the Builder shows the CTA but the public page does not, record:

- the target page's `Target published` from the panel,
- whether the target is still visible in the Builder's Pages tab,
- the public card's DOM (right-click → Inspect → copy the card HTML).

Public route behavior: it queries `projectPages where isPublished:true` (`src/app/u/[username]/page.tsx:29–33`). A target unpublished in the database is intentionally absent publicly even if the Builder preview still shows it.

## 7. Test the control cases (same session, if possible)

| Case | Expected |
| --- | --- |
| External URL | `Destination` is the external URL; CTA label uses the custom label or the template default. |
| Explicit **No link** | `Hidden because` says `linkType is explicitly "none"`; no CTA; stale slugs do not resurrect it. |
| Target deleted | `Target found: no`; `Destination: null`; no CTA. |
| Target unpublished | `Target published: no`; no CTA. |
| Free account | `Is free plan: yes`; internal page CTA hidden by design. |
| Classic template | `CTA owner` begins with `ClassicTemplate`. |
| Editorial template | `CTA owner` begins with `EditorialMarketingTemplate`; `DOM template` must match after the lazy chunk loads. |

## 8. What to send back

Provide:

1. `stage-1-after-selection.json`
2. `stage-2-after-save.json`
3. `stage-3-after-reload.json`
4. The public page's card HTML and whether the CTA is visible.
5. Whether the account is Pro/active.
6. Whether the target page is marked **Published** in the Pages tab.
7. A screenshot of the panel and the card area (optional but useful).

Do not edit or normalize the JSON before sending it.

## 9. How to read the decisive rows

| Decisive observation | Conclusion |
| --- | --- |
| `Is free plan: yes` | The account lost the paid-plan eligibility for internal page links. This is a subscription/entitlement state, not a resolver bug. |
| `Target published: no` | The target page is unpublished. Verify whether the publish checkbox persists after save/reload (the main save path currently does not write `isPublished`). |
| `Top empty shadows content: yes` | The top-level slug is empty and prevents the nested content slug from resolving. |
| After save top slug real / content slug temp, after reload top slug temp | Temporary target slug survived in `content.linkedPageSlug`; the reload rebuilds the top-level field from it. |
| `CTA visible: true`, `Matching anchors: 0` | The decision is correct but the actual component branch did not render the anchor. Check `DOM template` and `Preview card found`. |
| `Matching anchors: 1`, hidden/zero-size/covered | The button is rendered but hidden or overlaid. Record the CSS/geometry rows. |
| `Preview stale: yes` after settling | The preview is not receiving the editor's selected target. |
| `DOM template` differs from `Template` | The preview is rendering a different template branch. |

## 10. Safety

- Do not use a production customer account for this trace.
- Do not change environment variables or deploy.
- Do not run database queries, Prisma commands, SQL, migrations, or seeds.
- Do not use Playwright or any browser automation.
- The panel makes no network requests and reads only the already-loaded Builder state and preview DOM.
- The panel is compiled out of production mounting and the editor callback is not passed in production.
