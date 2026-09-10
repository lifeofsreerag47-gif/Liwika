// 3D Card Hover Tilt Effect for all cards across all pages
const tiltCards = document.querySelectorAll(
    ".product-card, .occasion-card, .occasion-product, .shop-product, .gift-box"
);

tiltCards.forEach(card => {
    card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.02)`;
    });

    card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)";
    });
});

// Dynamic Navbar Hide on Scroll Down / Reveal on Scroll Up
let lastScrollY = window.scrollY;
const navbar = document.querySelector(".navbar");

if (navbar) {
    window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Scrolling DOWN → hide navbar
            navbar.classList.add("navbar-hidden");
        } else {
            // Scrolling UP → show navbar
            navbar.classList.remove("navbar-hidden");
        }

        lastScrollY = currentScrollY;
    });
}

// Smooth Scroll for In-Page Anchors (e.g. "Our Story")
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        const targetId = this.getAttribute("href");
        if (targetId && targetId !== "#") {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
                if (history.pushState) {
                    history.pushState(null, null, targetId);
                }
            }
        }
    });
});

// Auto-scroll to section if page loads with hash in URL
window.addEventListener("DOMContentLoaded", () => {
    if (window.location.hash) {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
            setTimeout(() => {
                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }, 150);
        }
    }
});

