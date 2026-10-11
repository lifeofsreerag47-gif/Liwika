
/* LIWI-KA — YOUR CHOCOLATE CORNER */

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
    auth,
    db,
    persistenceReady
} from "./firebase-config.js";

/* MATCH THESE IDs TO track-order.html */

const customerName = document.getElementById("customer-name");
const customerEmail = document.getElementById("customer-email");

const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const profileVerification = document.getElementById("profile-verification");

const signOutButton = document.getElementById("sign-out-button");
const accountMessage = document.getElementById("dashboard-message");
const copyrightYear = document.getElementById("copyright-year");

const dashboardSections = document.querySelectorAll(
    ".dashboard-section, .account-panel, .track-panel"
);

const accountHero = document.querySelector(".account-hero");
const signoutSection = document.querySelector(".signout-section");
const accountFooter = document.querySelector(".account-footer");

/* CURRENT YEAR IN FOOTER */

if (copyrightYear) {
    copyrightYear.textContent = new Date().getFullYear();
}

/* SIGNED-OUT VIEW */

function showSignedOutView() {
    dashboardSections.forEach(section => {
        section.hidden = true;
    });

    if (accountHero) accountHero.hidden = true;
    if (signoutSection) signoutSection.hidden = true;

    let signedOutPanel = document.getElementById("signedOutPanel");

    if (!signedOutPanel) {
        signedOutPanel = document.createElement("section");
        signedOutPanel.id = "signedOutPanel";
        signedOutPanel.className = "signed-out-panel";

        signedOutPanel.innerHTML = `
            <p class="account-eyebrow">WELCOME TO LIWI-KA</p>
            <h2>Your Chocolate Corner.</h2>
            <p>Please sign in to view your personal account.</p>
            <a class="gold-outline-button" href="account.html">
                SIGN IN <span aria-hidden="true">↗</span>
            </a>
        `;

        const main = document.querySelector(".account-main");

        if (main) {
            main.prepend(signedOutPanel);
        }
    }

    signedOutPanel.hidden = false;

    if (accountFooter) accountFooter.hidden = false;
}

/* SIGNED-IN VIEW */

function showSignedInView() {
    dashboardSections.forEach(section => {
        section.hidden = false;
    });

    if (accountHero) accountHero.hidden = false;
    if (signoutSection) signoutSection.hidden = false;

    const signedOutPanel = document.getElementById("signedOutPanel");

    if (signedOutPanel) signedOutPanel.hidden = true;
}

/* DISPLAY CUSTOMER DETAILS */

function setCustomerDetails(name, email, verified) {
    if (customerName) customerName.textContent = name;
    if (customerEmail) customerEmail.textContent = email;

    if (profileName) profileName.textContent = name;
    if (profileEmail) profileEmail.textContent = email;

    if (profileVerification) {
        profileVerification.textContent = verified
            ? "Verified"
            : "Not verified";
    }
}

/* LOAD CUSTOMER PROFILE FROM FIRESTORE */

async function loadCustomerProfile(user) {
    let name = user.displayName || "";
    const email = user.email || "";

    try {
        const userDocument = await getDoc(
            doc(db, "users", user.uid)
        );

        if (userDocument.exists()) {
            const profile = userDocument.data();
            name = profile.name || name;
        }
    } catch (error) {
        console.error("Could not load Liwi-Ka profile:", error);

        if (accountMessage) {
            accountMessage.textContent =
                "Your account is signed in, but some profile details could not be loaded.";
        }
    }

    if (!name && email) {
        name = email.split("@")[0];
    }

    if (!name) {
        name = "Chocolate lover";
    }

    setCustomerDetails(name, email, user.emailVerified);
}

/* CHECK AUTHENTICATION */

async function startAccountPage() {
    try {
        await persistenceReady;

        onAuthStateChanged(auth, async user => {
            if (!user || !user.emailVerified) {
                showSignedOutView();
                return;
            }

            showSignedInView();
            await loadCustomerProfile(user);
        });
    } catch (error) {
        console.error("Liwi-Ka dashboard initialisation failed:", error);

        if (accountMessage) {
            accountMessage.textContent =
                "We couldn't load your account. Please refresh and try again.";
        }
    }
}

/* SIGN OUT */

if (signOutButton) {
    signOutButton.addEventListener("click", async () => {
        signOutButton.disabled = true;

        if (accountMessage) {
            accountMessage.textContent = "Signing you out...";
        }

        try {
            await persistenceReady;
            await signOut(auth);

            try {
                localStorage.removeItem("liwika_auth_session");
            } catch (error) {
                // Firebase sign-out does not depend on localStorage.
            }

            window.location.href = "index.html";
        } catch (error) {
            console.error("Liwi-Ka sign-out failed:", error);

            if (accountMessage) {
                accountMessage.textContent =
                    "We couldn't sign you out. Please try again.";
            }

            signOutButton.disabled = false;
        }
    });
}

startAccountPage();