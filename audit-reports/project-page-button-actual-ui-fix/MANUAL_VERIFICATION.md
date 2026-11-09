# Manual Verification — Project Page Button Fix

Steps:
1. Use a staging Pro account.
2. Builder → Home → Projects → create a card.
3. Select `Project Page` and choose a published Project Page.
4. Save and reload Builder; confirm the selected destination remains.
5. Confirm the CTA “View Project” is visible in Builder preview.
6. Publish the portfolio and open `/u/{username}`; confirm the CTA is visible in Classic and Editorial.
7. Click the CTA; confirm the correct `/u/{username}/projects/{slug}` page opens.
8. Test an external card still routes correctly.
9. Select `No link`; confirm no CTA remains, even if the old slug/UI state is stale.
10. Test a deleted/unpublished page; confirm no broken CTA.
11. Test two cards linked to two pages; confirm independent routes.
12. Test Arabic/RTL and mobile layouts.

Provide lighthouse screenshots/file data for target status.