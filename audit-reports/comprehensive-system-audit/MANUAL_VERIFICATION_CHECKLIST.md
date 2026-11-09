# Manual Verification Checklist

Only cases that cannot be established reliably from source code are listed. Everything else in this audit is source-traced and documented in `MASTER_FINDINGS.md`.
Use an **isolated staging database** with synthetic accounts. Never production customer data.

| # | Finding | Why static analysis is insufficient | Exact steps | Expected result | Failure looks like | Account/plan | Isolated data required |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | F-04 | Browser media-query behavior inside a container frame | Desktop browser → Builder → Templates → Preview Editorial → switch preview to Mobile (375 px) | Layout stacks: single-column hero, drawer toggle, 1-col project grid; no horizontal overflow | Desktop 2-col hero, hidden mobile toggle, 5-col logo row, content overflow | Pro (editorial selectable) | Yes (a portfolio with hero/about/projects/clients) |
| 2 | F-04 (admin) | Same as above in admin device frames | Admin → user preview → device tablet/mobile | Editorial adapts to the frame width | Renders desktop layout inside narrow frame | Any | Yes |
| 3 | F-09 | Network-timing race | Throttle network; type in a text field; click Save; continue typing before the request completes | Newly typed characters remain after save | Characters disappear; status shows Saved | Any | Yes (a seeded portfolio) |
| 4 | F-07 | Server entitlement + UI flow | Seed a Free account whose `appearance.template='editorial-marketing'` via staging DB; open Builder; edit a section; Save | Either save succeeds without changing the stored template, or UI offers a clear one-click "switch to Classic to save" and the save is blocked with clear copy | Generic error toast on every save; user cannot proceed | Free | Yes (manually set template key in staging) |
| 5 | F-09/F-27 | UI timing/state | With unsaved edits, open Templates → Apply Classic | Decide product intent: either only template is saved, or all pending edits are intentionally saved with explicit copy. Current copy claims template-only. | Silent commit of unrelated edits | Pro | Yes |
| 6 | F-12 | User expectation of the reported missing button | Link a card to a standalone page → inspect Pages tab, card row, right panel, top bar | A clear View Page action exists (or the expected label is confirmed with the reporter) | No action anywhere; top-bar View Live is the only route and it 404s for draft/unlinked cases | Pro | Yes |
| 7 | F-12 (View Live draft) | Public route gating | Create a DRAFT portfolio, select a page, click desktop View Live | Warning/tooltip or redirect, not a 404 | New tab shows 404 | Any | Yes |
| 8 | F-11 | Persistence propagation | Link card A to page P; rename P's slug; save; reload; click card A | Card still opens P | Card opens 404 / page shows "Not linked" | Pro | Yes |
| 9 | F-28 | Cross-row cleanup | Link card B to card A (or page A); delete A; save; reload; click B | B's link is removed or clearly disabled | B links to 404 | Pro | Yes |
| 10 | F-17 | React remount timing | Create a new card, Save, then change its title in the still-open form without leaving | Change applies to the card | Further edits silently do nothing until the form is reopened | Any | Yes |
| 11 | F-13 | Rendering vs data | Add a testimonial with name + text, no photo; publish; view Classic | Testimonial text is visible (or a clear empty state, not a blank section) | Testimonials section blank | Any (Classic) | Yes (Free or Pro) |
| 12 | F-14 | Browser URL validity | Add a contact-section phone and WhatsApp value (`+2010…`); publish; click links | Opens tel:/wa.me correctly | `https://+2010…` invalid / no action | Any (Classic) | Yes |
| 13 | F-19 | Server Action reachability | As a Free owner, invoke `updateProjectPage` with a crafted `showInProjects:false` payload (authorized test only) | Rejected / action absent | Page becomes standalone; or `profileId` is accepted | Free | Yes, isolated staging only |
| 14 | F-06 | UI capability | New account: try to add Contact/Gallery/Files sections | Section creation is available (respecting plan locks) | Only Custom can be added | Pro | Yes |
| 15 | Contrast | Numeric WCAG check | Run a contrast checker on Editorial tokens (`#6f6759` on `#fbf7ee`/`#f4eddf`, footer alpha text) and Classic light/dark palettes | All normal text ≥4.5:1, large ≥3:1 | Fail at normal text sizes | Any | No |
| 16 | F-39 | Platform font fallback | Render Editorial in Arabic on Windows/Android/iOS | Acceptable Arabic typography, consistent with intended design | Fallback to inconsistent system serif; broken ligatures/spacing | Any | No |
| 17 | F-01/F-02 | Visual confirmation of inert controls | As Pro with Editorial saved, change each appearance field one at a time; publish; view | Either the change appears, or the control is disabled/explained as template-owned | No visible change while the control remains enabled | Pro | Yes |
| 18 | F-16 | Visual continuity | Editorial portfolio → open a project card | Project page matches Editorial design or clearly labelled Classic | Abrupt blue/Classic page | Pro | Yes |
| 19 | Accessibility | Screen reader | Tab through Editorial; inspect link list and drawer | Unique link names; Escape closes drawer; focus visible everywhere | Repeated "View case study" links; drawer needs tabbing back; missing focus | Any | No |
| 20 | Performance | Real bundle/network measurement | Build and load Editorial public page; compare network chunks vs Classic | No Classic chunk loaded for Editorial visitors; CWV acceptable | Both template chunks downloaded; regressions | Any | No (requires build, not production) |
| 21 | F-48 | Migration side effects | Open Builder in two tabs on an account with duplicate clients/experience sections | No destructive surprise; or explicit migration UX | Duplicate section deleted silently; orders shift | Any | Yes (synthetic duplicates) |
| 22 | F-38 | Legacy data | Synthetic profile with footer links only in `footer.content.links` (contactLinks empty) | Footer editor lists those links | Editor shows empty list; saving wipes footer links | Pro | Yes |

## Checklist conventions
- **Never** run these against production; use a disposable staging DB and synthetic credentials.
- For server-action craft tests, use only accounts you own and an isolated deployment; no exploitation of real users.
- Record results against the finding IDs in `MASTER_FINDINGS.md` and update the confidence column after verification.
