# Liwi-Ka customer website

This customer-side build keeps the existing page structure, styles, fonts and visual direction, while connecting catalogue and commerce data to Firebase project `liwika-3719e`.

- Product grids load published/visible products from the shared Firestore `products` collection, using the `publicCatalog` Cloud Function, which reads directly from Firestore (no Redis or Upstash secrets required).
- Product images are served from Firebase Storage. Each product supports an ordered image gallery (`images`, `imageUrls`, and `imagePaths`) while `imageUrl`/`imagePath` remain the first-image compatibility fields. The gallery supports mobile swipe, desktop arrows and thumbnails, and a full-screen image viewer.
- Product grids include animated loading skeletons, designed empty states, offline states and retry handling.
- Browser Firestore persistence is enabled for offline data availability.
- Product reviews are submitted to Firestore `feedback` and remain hidden until an admin moderates them.
- Customer Care messages are saved to Firestore `support_messages` and appear in Admin → Support Inbox. Customers must be signed in to send a message.
- My Orders reads only the signed-in customer's Firestore orders.
- Checkout calls the trusted `createCustomerOrder` Cloud Function. The server rechecks price/stock and writes the shared order record.

Deploy the backend rules, indexes and Functions from the separate backend ZIP before publishing this customer website. See `README-LIWIKA-FIREBASE-SETUP.md` in that backend package.

**Payment note:** a payment gateway is not included. UPI/card/net-banking selections create orders with `pending_verification`; only a verified payment should be marked paid by the administrator.

- Best Seller cards retain the original reference CSS, corner product-name treatment and desktop tilt effect; touch/mobile devices do not receive the 3D tilt.
- The mobile navigation retains its seven intended destinations, including About Us, Customer Care and Cart. The cart page keeps its MY ORDERS link.


## Latest customer UI fixes
See `UI-FIXES-2026-11-14.md` for the Best Sellers alignment/mobile cleanup, Shop dialog stacking/scroll-lock fixes, single filter/sort handlers, clickable free-delivery HUD and static validation results.
