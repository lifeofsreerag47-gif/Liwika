# Google sign-in: clean popup + "Liwika" name

Two small, one-time settings make the Google window show **Liwika** and open straight on
`accounts.google.com` (no Firebase address / API key flashing in the address bar).

## 1. Paste the Web client ID (removes the Firebase link from the popup)
1. Firebase Console > Authentication > Sign-in method > **Google** > *Web SDK configuration* > copy **Web client ID**
   (looks like `370761593444-xxxxxxxx.apps.googleusercontent.com`).
2. Open `js/firebase-config.js`, set `const GOOGLE_CLIENT_ID = '…';`, deploy hosting.
3. Google Cloud Console (project `liwika-3719e`) > APIs & Services > Credentials > open that *Web client* >
   **Authorized JavaScript origins**: add your live domain(s), e.g. `https://yourdomain.com`,
   `https://liwika-3719e.web.app`, `https://liwika-3719e.firebaseapp.com` (and `http://localhost:5000` for testing). Save.

Until the ID is pasted the site safely falls back to the normal Firebase popup.

## 2. Make the consent screen say "Liwika"
The name Google shows ("…is sharing data with …") is the **OAuth app name**, not the project id.
1. Google Cloud Console > APIs & Services > **OAuth consent screen** (or *Google Auth platform > Branding*).
2. **App name: `Liwika`**, add your support e-mail, logo (optional), and your domain under *Authorized domains*.
3. Save, then set Publishing status to **In production** (otherwise only test users can sign in).
4. Firebase Console > Project settings > General > **Public-facing name: `Liwika`**.
(The project ID `liwika-3719e` itself can never be renamed, but it is no longer what users see.)
