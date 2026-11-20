# Liwi-Ka customer website

This customer-side build keeps the existing page structure, styles, fonts and visual direction, while connecting catalogue and commerce data to Firebase project `liwika-3719e`.

- Product grids load published/visible products from the shared Firestore `products` collection, using the `publicCatalog` Cloud Function, which reads directly from Firestore (no Redis or Upstash secrets required).
- Product images are served from Firebase Storage. Each product supports an ordered image gallery (`images`, `imageUrls`, and `imagePaths`) while `imageUrl`/`imagePath` remain the first-image compatibility fields. The gallery supports mobile swipe, desktop arrows and thumbnails, and a full-screen image viewer.
- Product grids include animated loading skeletons, designed empty states, offline states and retry handling.
- Browser Firestore persistence is enabled for offline data availability.
- Customer Care messages go through the `submitSupportMessage` Cloud Function (sign-in required, rate-limited, honeypot) into `support_messages` for the Admin → Support Inbox.
- My Orders reads only the signed-in customer's Firestore orders.
- Checkout calls the trusted `createCustomerOrder` Cloud Function. The server rechecks price/stock and writes the shared order record.

Deploy the backend rules, indexes and Functions from the separate backend ZIP before publishing this customer website. See `README-LIWIKA-FIREBASE-SETUP.md` in that backend package.

**Payment note:** UPI (Cashfree) and Cash on Delivery only. Orders are created and priced by the `createCustomerOrder` Cloud Function; payment is confirmed server-side with Cashfree. Delivery is completed only by verifying the customer's delivery OTP. See README-BACKEND.md.

- Best Seller cards retain the original reference CSS, corner product-name treatment and desktop tilt effect; touch/mobile devices do not receive the 3D tilt.
- The mobile navigation retains its seven intended destinations, including About Us, Customer Care and Cart. The cart page keeps its MY ORDERS link.


## Latest customer UI fixes
See `UI-FIXES-2026-11-14.md` for the Best Sellers alignment/mobile cleanup, Shop dialog stacking/scroll-lock fixes, single filter/sort handlers, clickable free-delivery HUD and static validation results.


## Business details for the legal pages
Edit `legal-info.js` (business name, address, FSSAI no., GSTIN, grievance officer). Until filled, the Privacy, Terms and Shipping & Refund pages show red "[… to be added]" markers.
