# Manual Staging Checklist

Use staging with synthetic data. Do not use production.

1. Pro account → Builder → Home → Projects.
2. Create or edit a card.
3. Select `Project Page` and choose a published Project Page.
4. Confirm `View Project` appears in Builder preview.
5. Save; reload Builder; reopen card.
   - Confirm the destination and label are unchanged.
6. Publish the portfolio and open `/u/{username}`.
   - Confirm `View Project` is visible in Classic.
   - Confirm `View Project` is visible in Editorial.
7. Click both CTAs; confirm each opens `/u/{username}/projects/{slug}`.
8. Change the card destination to an external URL.
   - Confirm the external CTA still works when published.
9. Open the card editor and choose `No link` while the card still has an old `linkedPageSlug`.
   - Save; confirm the CTA disappears in Builder and public portfolio.
10. Create a card linked to a deleted/unpublished page.
    - Confirm no CTA appears and no broken route is exposed.
11. Create two cards linked to two different pages.
    - Confirm both open their own destinations.
12. Test Arabic/RTL and mobile layouts.
    - Confirm CTA text, arrow direction, and route behavior are correct.
13. Confirm no unrelated card behavior changed.

If step 5 or 6 fails, the fix is not fully resolved. Use the exact failing data for further debugging.