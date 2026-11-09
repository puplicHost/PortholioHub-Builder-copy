# Project Page Button Fix — Manual Verification

1. Use a Pro staging account with at least one published standalone Project Page.
2. Builder → Home → Projects → create a new card.
3. Open the card editor → Project Link → choose **Project Page**.
4. Select the existing internal page from the dropdown.
5. Set the label to “View Project” (or leave the default).
6. Save; refresh the Builder; reopen the card.
   - Expected: Project Page still selected and slug retained.
7. Check the Builder preview.
   - Expected: the card shows the “View Project” button.
8. Publish the portfolio; open `/u/{username}` in Classic.
   - Expected: button visible; click opens `/u/{username}/projects/{slug}` and the correct page loads.
9. Switch the portfolio to Editorial; repeat steps 7–8.
   - Expected: button visible in Editorial and opens the same page.
10. Switch back to Classic.
    - Expected: button remains visible and destination unchanged; no content lost.
11. Change the same card to an External URL; save/publish.
    - Expected: external button still works as before.
12. Clear the page selection or delete/unpublish the target page.
    - Expected: no broken “View Project” button appears.
13. Free account with a legacy internal page link.
    - Expected: internal CTA remains hidden; no route is exposed.
14. Arabic/RTL and mobile:
    - Expected: button, label and arrow alignment remain consistent; route opens correctly.
15. Create two cards linked to two different pages.
    - Expected: each opens its own page; no cross-assignment.

Do not use production data. Use synthetic staging content only.
