/* =========================================================
   LIWI-KA — SHOP + SEASONALS INTERACTIONS
   ========================================================= */

(() => {
    "use strict";

    /* Never let these pages create a second page scroll container or
       restore a previous scroll position unexpectedly. */
    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    /* ---------------------------------------------------------
       3D MOUSE TILT
       Same style as the Home product-card hover.
       The festival card is dynamic, so it is handled by delegation.
       --------------------------------------------------------- */
    const addTilt = (card) => {
        if (!card || card.dataset.tiltReady === "true") return;
        card.dataset.tiltReady = "true";

        /* CSS entrance animation can otherwise keep control of transform. */
        setTimeout(() => {
            card.style.animation = "none";
        }, 1100);

        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;

            card.style.transform =
                `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.02)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform =
                "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)";
        });
    };

    document
        .querySelectorAll(".shop-product, .occasion-card, .gift-box")
        .forEach(addTilt);

    /* ---------------------------------------------------------
       OCCASION ENTRY SCROLL
       Tell every occasion page (including Birthday) that it was
       opened from the Seasonals cards. The shared occasion-theme
       then handles the 1.4s pause and slow cinematic scroll.
       --------------------------------------------------------- */
    document.addEventListener("click", (event) => {
        // Use the actual occasion link rather than relying only on the card
        // class. This also catches Birthday reliably on every browser.
        const link = event.target.closest('a[href*="occassions/"]');
        if (!link) return;

        sessionStorage.setItem("occasionEntry", "true");
    }, true);

    /* Dynamic festival cards are inserted after page load. */
    const observeDynamicCards = () => {
        document
            .querySelectorAll(".dynamic-festival-card")
            .forEach(addTilt);
    };

    const observer = new MutationObserver(observeDynamicCards);
    observer.observe(document.body, { childList: true, subtree: true });
    observeDynamicCards();

    /* ---------------------------------------------------------
       STAGGERED ENTRANCE
       --------------------------------------------------------- */
    document
        .querySelectorAll(".shop-product, .occasion-card, .flow-step")
        .forEach((card, index) => {
            card.style.animationDelay = `${index * 0.08}s`;
        });

    /* ---------------------------------------------------------
       SHOP FILTER
       --------------------------------------------------------- */
    const filterButtons = document.querySelectorAll(".filter-button");
    const products = document.querySelectorAll(".shop-product");

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            filterButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");

            const filter = button.textContent.trim().toLowerCase();

            products.forEach((product) => {
                const category = (product.dataset.category || "").toLowerCase();
                const visible = filter === "all" || category === filter;

                if (visible) {
                    product.style.display = "";
                    product.style.opacity = "1";
                    product.style.transform = "";
                    addTilt(product);
                } else {
                    product.style.opacity = "0";
                    product.style.transform = "translateY(20px) scale(.97)";
                    setTimeout(() => {
                        if (product.style.opacity === "0") {
                            product.style.display = "none";
                        }
                    }, 250);
                }
            });
        });
    });

    /* ---------------------------------------------------------
       SHOP SORT
       --------------------------------------------------------- */
    const sortSelect = document.querySelector(".shop-sort select");
    const grid = document.querySelector(".shop-products");

    if (sortSelect && grid) {
        sortSelect.addEventListener("change", () => {
            const items = [...grid.querySelectorAll(".shop-product")];
            const value = sortSelect.value;

            if (value === "Price: Low to High" || value === "Price: High to Low") {
                items.sort((a, b) => {
                    const priceA = parseInt(
                        a.querySelector(".shop-price")?.textContent.replace(/[^\d]/g, "") || "0",
                        10
                    );
                    const priceB = parseInt(
                        b.querySelector(".shop-price")?.textContent.replace(/[^\d]/g, "") || "0",
                        10
                    );
                    return value === "Price: Low to High"
                        ? priceA - priceB
                        : priceB - priceA;
                });
            } else if (value === "Best Sellers" || value === "Weekly Selling") {
                const metricKey = value === "Best Sellers" ? "sales" : "weeklySales";
                const ledger = window.LiwikaSales && window.LiwikaSales.getMetrics
                    ? window.LiwikaSales.getMetrics()
                    : {};
                items.sort((a, b) => {
                    const idA = a.dataset.product || "";
                    const idB = b.dataset.product || "";
                    const fallbackA = Number(a.dataset[metricKey === "weeklySales" ? "weeklySales" : "sales"] || 0);
                    const fallbackB = Number(b.dataset[metricKey === "weeklySales" ? "weeklySales" : "sales"] || 0);
                    const metricA = Number(ledger[idA]?.[metricKey] ?? fallbackA);
                    const metricB = Number(ledger[idB]?.[metricKey] ?? fallbackB);
                    return metricB - metricA;
                });
            }

            items.forEach((item) => grid.appendChild(item));
        });
    }

    /* ---------------------------------------------------------
       CURSOR LIGHT
       --------------------------------------------------------- */
    document.addEventListener("mousemove", (e) => {
        const card = e.target.closest(".shop-product, .occasion-card");
        if (!card) return;

        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    });

    /* ---------------------------------------------------------
       PAGE SHOW RESET
       --------------------------------------------------------- */
    window.addEventListener("pageshow", () => {
        products.forEach((product) => {
            product.style.opacity = "";
            product.style.transform = "";
            product.style.display = "";
        });
    });
})();
