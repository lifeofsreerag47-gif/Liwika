# Liwi-Ka website — bug-fix report

Reference design: `Liwika-updated.zip`. Fixed build: this folder (based on the latest `Liwika.zip`).
Every fix below was reproduced in a real Chromium browser (phone 360/390/414 px, tablet 768 px, laptop 1024 px, desktop 1440 px) before and after the change.

## Fixed
1. **Home — Best Sellers (desktop).** Restored the original tall full-image cards (383 × 707 at 1440 px). Cards are now always centered — 1, 2, 3 cards, or any last row of 4+/5+ — instead of sitting 72 px off-centre and pushing the page 129 px too wide. Three stacked "fix" layers in `home-cinematic.css` were replaced by one clean block.
2. **Home — Best Sellers (phone).** Equal-size two-up cards, odd last card centered at the same size, names no longer cut off ("Indulgence"), a single card no longer shows a half-empty photo.
3. **Product cards could not be opened on the first tap (phone).** Every time the page frame gained focus, `catalog.js` replaced the product grid with a loading skeleton, so the tap landed on nothing. Refreshes are now silent (only when data changed, at most once a minute), and skeletons only show on the first load.
4. **Occasion pages (Birthday, Anniversary, Valentine's, Graduation, Just Because, festivals):** tapping a product crashed (`Cannot set properties of null`). The product window is now null-safe; open / quantity / flavour / add-to-cart verified on every page.
5. **New Arrivals:** products rendered but the page stayed on "Something new is coming soon". The hero, product section and "coming soon" panel now follow the real catalogue state (loading / products / empty).
6. **MY ORDERS button** — account menu and cart page were unstyled blue underlined links. Both now match the site's gold style (desktop + phone, 44 px tap targets).
7. **Track Order page was not mobile-ready** (614 px wide on a 360 px phone, old header, no account menu). It now uses the standard header, account menu and mobile shell.
8. **Navigation:** "About Us" had been replaced by "Our Story → index.html#our-story" on 15 pages (header and footer). Restored "About Us → about-us.html" everywhere.
9. **Shop (phone):** removed the override that letter-boxed product photos with dark borders and doubled the buttons; the original full-bleed cards are back. Removed ~140 lines of dead `html.cine-on` rules.
10. **My Orders page:** the search box was a bright white browser input; item lines were truncated to "Classic…" on phones (quantity and price were hidden). Both fixed.
11. **Privacy Policy / Terms:** removed visible placeholder text ("[YOUR REAL CUSTOMER CARE EMAIL]" etc.); now shows care@liwika.com, support hours and a Customer Care link.
12. Occasion cards: category label spacing above the product name.

## Verified (all pages)
No horizontal overflow at 360 / 390 / 414 / 768 / 1440 px on any page; no JavaScript errors; no broken images; all JS files pass a syntax check.

## Still needs your input
- Privacy/Terms: add your real **phone number and business address** if you want them shown.
- The festival backgrounds `images/bg1–bg5` referenced by `festivals.js` are not in the project (also missing in the reference).
- `images/liwi.jpeg` referenced by `style.css` is missing (decorative fallback only).
- `seasonals/new arrivals.html` (with a space in the name) is an old unused duplicate.
