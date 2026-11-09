# Project Page Button Forensic Fix — Manual Verification

1. Create a published standalone Project Page, e.g. `case-study`.
2. Open the Builder → Home → Projects → create/edit a card.
3. Choose **Project Page** as the destination.
4. Select the page from the dropdown; set label “View Project”.
5. Save, refresh the Builder, and reopen the card.
   - Expected: `Project Page` and the selected page remain selected.
6. In Builder preview (Classic and Editorial):
   - Expected: card shows “View Project”.
7. Publish and open `/u/{username}` in Classic.
   - Expected: button visible; click opens `/u/{username}/projects/case-study`.
8. Switch to Editorial; repeat publish/preview.
   - Expected: button visible and opens the same page.
9. Switch back to Classic.
   - Expected: button remains visible; destination unchanged.
10. Test external link.
    - Expected: external button remains correct.
11. Delete or unpublish the target page; save/reload.
    - Expected: no broken View Project button.
12. Free account with a legacy internal page link.
    - Expected: no internal CTA and no public route exposure.
13. Arabic/RTL and mobile.
    - Expected: label, route, and arrow direction remain correct.
14. Two cards linked to two different pages.
    - Expected: each opens its own page; no cross-assignment.
15. Create a page with a slug containing uppercase/spaces.
    - Expected: builder normalizes the slug; the card links to the canonical slug.

Use only synthetic staging data. Do not use production data.
