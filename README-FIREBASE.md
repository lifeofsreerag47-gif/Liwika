# Liwi-Ka customer website

This customer-side build keeps the existing page structure, styles, fonts and visual direction, while connecting catalogue and commerce data to Firebase project `liwika-3719e`.

- Product grids load published/visible products from the shared Firestore `products` collection, using the `publicCatalog` Cloud Function (Redis-backed) with a direct Firestore fallback.
- Product images are served from Firebase Storage; product add/edit/delete is handled in the admin website.
- Product grids include animated loading skeletons, designed empty states, offline states and retry handling.
- Browser Firestore persistence is enabled for offline data availability.
- Product reviews are submitted to Firestore `feedback` and remain hidden until an admin moderates them.
- Customer Care messages are saved to Firestore `support_messages` and appear in Admin → Support Inbox. Customers must be signed in to send a message.
- My Orders reads only the signed-in customer's Firestore orders.
- Checkout calls the trusted `createCustomerOrder` Cloud Function. The server rechecks price/stock and writes the shared order record.

Deploy the backend rules, indexes and Functions from the separate backend ZIP before publishing this customer website. See `README-LIWIKA-FIREBASE-SETUP.md` in that backend package.

**Payment note:** a payment gateway is not included. UPI/card/net-banking selections create orders with `pending_verification`; only a verified payment should be marked paid by the administrator.
