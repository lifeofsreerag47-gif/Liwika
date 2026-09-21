/*
 * Liwi-Ka mobile UI
 * - Replaces the hamburger navigation with a premium floating bottom bar.
 * - Reuses the real hrefs already present in each page's desktop navigation,
 *   so GitHub Pages/project-folder paths continue to work.
 */
(function () {
    "use strict";

    var MOBILE_BREAKPOINT = 900;

    function isMobileShell() {
        return window.matchMedia && window.matchMedia("(max-width: " + MOBILE_BREAKPOINT + "px)").matches;
    }

    function isFrameMode() {
        return new URLSearchParams(window.location.search).get("liwiFrame") === "1";
    }

    var ICONS = {
        home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.8 12 3.8l8.5 7v8.2a1.5 1.5 0 0 1-1.5 1.5h-4.7v-5.2H9.7v5.2H5A1.5 1.5 0 0 1 3.5 19z"/></svg>',
        shop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8.5h14l1 11.5H4z"/><path d="M8 9V6.8a4 4 0 0 1 8 0V9"/></svg>',
        new: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.9 5.7 5.8 1.8-5.8 1.9L12 18l-1.9-5.6-5.8-1.9 5.8-1.8z"/><path d="m18.2 15.4.8 2.3 2.3.8-2.3.8-.8 2.3-.8-2.3-2.3-.8 2.3-.8z"/></svg>',
        seasonal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20c-4.5-2.2-7.5-5.6-7.5-9.5C4.5 7.7 6.8 5 10 5c1 0 1.9.4 2.6 1.1C13.3 5.4 14.1 5 15.1 5c3.2 0 5.4 2.7 5.4 5.5C20.5 14.4 17.1 17.8 12 20z"/><path d="M12 6c-1.8 2.3-2 5.1-.8 7.5"/></svg>',
        care: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8 8.7 8.7 0 0 1-3.8-.9L4 20l1.4-3.7A8 8 0 1 1 20 11.5z"/><path d="M8.2 10h.01M15.8 10h.01M8.8 14.2c1.9 1.3 4.5 1.3 6.4 0"/></svg>',
        cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h2l1.7 10.2a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 1.9-1.4L21 9H7"/><circle cx="10" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>'
    };

    function getNavLink(nav, label) {
        var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
        var target = label.toLowerCase();
        var exact = links.find(function (link) {
            return link.textContent.trim().toLowerCase() === target;
        });
        if (exact) return exact;

        /* Cart labels differ slightly between pages (Cart / Shopping Cart). */
        if (label === "Shopping Cart") {
            return links.find(function (link) {
                var text = link.textContent.trim().toLowerCase();
                var href = (link.getAttribute("href") || "").toLowerCase();
                return text.indexOf("cart") !== -1 || href.indexOf("cart") !== -1;
            });
        }
        return null;
    }

    function markOccasionPage() {
        if (/\/occassions\//i.test(window.location.pathname)) {
            document.body.classList.add("mobile-occasion-page");
        }
    }

    function createBottomNav() {
        if (document.querySelector(".mobile-bottom-nav")) return;

        var desktopNav = document.querySelector(".navbar .nav-links");
        var navbar = document.querySelector(".navbar");
        if (!desktopNav || !navbar) return;

        var definitions = [
            ["Home", "home", "Home"],
            ["Shop", "shop", "Shop"],
            ["New Arrivals", "new", "New"],
            ["Seasonals", "seasonal", "Seasonals"],
            ["Customer Care", "care", "Care"],
            ["Shopping Cart", "cart", "Cart"]
        ];

        var bar = document.createElement("nav");
        bar.className = "mobile-bottom-nav";
        bar.setAttribute("aria-label", "Mobile navigation");

        var indicator = document.createElement("div");
        indicator.className = "mobile-nav-active-indicator";
        indicator.setAttribute("aria-hidden", "true");
        bar.appendChild(indicator);

        definitions.forEach(function (definition) {
            var source = getNavLink(desktopNav, definition[0]);
            /* Cart is intentionally not part of the desktop text navigation.
               Its real desktop link lives separately in the navbar. */
            if (!source && definition[1] === "cart") {
                source = navbar.querySelector('.cart-nav-link, .cart-icon, a[aria-label="Shopping Cart"], a[href*="cart"]');
            }
            if (!source) return;

            var item = document.createElement("a");
            item.className = "mobile-bottom-item";
            var sourceHref = source.getAttribute("href") || "cart.html";
            try {
                item.href = new URL(sourceHref, window.location.href).href;
            } catch (e) {
                item.href = sourceHref;
            }
            item.setAttribute("aria-label", definition[0]);

            var icon = document.createElement("span");
            icon.className = "mobile-bottom-icon";
            icon.innerHTML = ICONS[definition[1]];

            var label = document.createElement("span");
            label.className = "mobile-bottom-label";
            label.textContent = definition[2];

            item.appendChild(icon);
            item.appendChild(label);

            if (definition[1] === "cart") {
                var badge = document.createElement("span");
                badge.className = "mobile-bottom-cart-badge";
                badge.setAttribute("aria-hidden", "true");
                badge.textContent = "0";
                item.appendChild(badge);
            }

            var currentPath = window.location.pathname.replace(/\/$/, "");
            var targetPath = "";
            try {
                targetPath = new URL(item.href, window.location.href).pathname.replace(/\/$/, "");
            } catch (e) {}

            if (source.classList.contains("active") ||
                targetPath === currentPath ||
                (definition[1] === "seasonal" && /\/occassions\//i.test(window.location.pathname))) {
                item.classList.add("active");
            }

            /* Give every destination an immediate active state on touch/click.
               The cart used to miss this because its desktop link is a separate
               icon rather than a normal .nav-links item. */
            item.addEventListener("click", function (event) {
                bar.querySelectorAll(".mobile-bottom-item.active").forEach(function (activeItem) {
                    activeItem.classList.remove("active");
                });
                item.classList.add("active");
                if (bar.__moveActiveIndicator) bar.__moveActiveIndicator(item, true);

                if (window.__liwiNavigate && isMobileShell()) {
                    event.preventDefault();
                    window.__liwiNavigate(item.href, true);
                }
            });

            bar.appendChild(item);
        });

        document.body.appendChild(bar);

        function moveActiveIndicator(activeItem, animate) {
            var active = activeItem || bar.querySelector(".mobile-bottom-item.active");
            if (!active || !indicator) return;
            /* Use the rendered geometry of the active tab itself.
               This is more accurate than calculating from grid slots because
               the nav has padding + gaps and those can change at breakpoints.
               The pill is centered on the active tab and clamped inside the
               nav's border box so it can never stick outside the bottom bar. */
            var barRect = bar.getBoundingClientRect();
            var itemRect = active.getBoundingClientRect();

            var sideInset = -3;
            var indicatorWidth = Math.max(1, itemRect.width - (sideInset * 2));

            /* Position from the active item's exact center. */
            var itemCenter = (itemRect.left - barRect.left - bar.clientLeft) + (itemRect.width / 2);
            var indicatorLeft = itemCenter - (indicatorWidth / 2);

            /* Keep the pill completely inside the bar, including its border. */
            var minLeft = 1;
            var maxLeft = Math.max(minLeft, bar.clientWidth - indicatorWidth - 1);
            indicatorLeft = Math.max(minLeft, Math.min(indicatorLeft, maxLeft));

            indicator.style.setProperty("width", indicatorWidth + "px", "important");
            indicator.style.transform = "translate3d(" + indicatorLeft + "px,0,0)";
            indicator.classList.toggle("is-ready", !!animate);
        }

        bar.__moveActiveIndicator = moveActiveIndicator;
        requestAnimationFrame(function () { moveActiveIndicator(null, true); });
        window.addEventListener("resize", function () { moveActiveIndicator(null, false); });
        updateCartBadge(bar);
    }

    function updateCartBadge(bar) {
        var badge = bar && bar.querySelector(".mobile-bottom-cart-badge");
        if (!badge) return;

        var count = 0;
        try {
            var possibleKeys = ["cart", "liwikaCart", "cartItems", "shoppingCart"];
            possibleKeys.some(function (key) {
                var raw = localStorage.getItem(key);
                if (!raw) return false;
                var data = JSON.parse(raw);
                if (Array.isArray(data)) {
                    count = data.reduce(function (sum, item) {
                        return sum + Number(item.quantity || item.qty || 1);
                    }, 0);
                    return true;
                }
                if (data && Array.isArray(data.items)) {
                    count = data.items.reduce(function (sum, item) {
                        return sum + Number(item.quantity || item.qty || 1);
                    }, 0);
                    return true;
                }
                return false;
            });
        } catch (e) {
            count = 0;
        }

        badge.textContent = count > 99 ? "99+" : String(count);
        bar.classList.toggle("cart-has-items", count > 0);
    }

    function installMobileShell() {
        if (!isMobileShell() || isFrameMode() || document.querySelector(".liwi-mobile-frame")) return;

        var frame = document.createElement("iframe");
        frame.className = "liwi-mobile-frame";
        frame.setAttribute("title", "Liwi-Ka mobile page");
        frame.setAttribute("aria-label", "Liwi-Ka mobile page");
        frame.setAttribute("scrolling", "yes");
        frame.src = window.location.href + (window.location.href.indexOf("?") >= 0 ? "&" : "?") + "liwiFrame=1";

        window.__liwiFrame = frame;
        window.__liwiFrameUrl = window.location.href;

        function absoluteUrl(url) {
            try { return new URL(url, window.location.href).href; } catch (e) { return url; }
        }

        function updateActive(url) {
            var current;
            try { current = new URL(url, window.location.href).pathname.replace(/\/$/, ""); } catch (e) { current = window.location.pathname.replace(/\/$/, ""); }
            var items = document.querySelectorAll(".mobile-bottom-item");
            var activeItem = null;
            items.forEach(function (item) {
                var href = item.getAttribute("href") || "";
                var target = "";
                try { target = new URL(href, window.location.href).pathname.replace(/\/$/, ""); } catch (e) {}
                var active = target === current;
                if (item.getAttribute("aria-label") === "Seasonals" && /\/occassions\//i.test(current)) active = true;
                item.classList.toggle("active", active);
                if (active) activeItem = item;
            });
            var bar = document.querySelector(".mobile-bottom-nav");
            if (bar && bar.__moveActiveIndicator) bar.__moveActiveIndicator(activeItem, true);
        }

        window.__liwiNavigate = function (url, pushHistory) {
            var target = absoluteUrl(url);
            if (!target) return;
            var clean = target.replace(/[?&]liwiFrame=1$/, "");
            if (pushHistory) {
                try { history.pushState({liwi: true, url: clean}, "", clean); } catch (e) {}
            }
            window.__liwiFrameUrl = clean;
            frame.src = clean + (clean.indexOf("?") >= 0 ? "&" : "?") + "liwiFrame=1";
            updateActive(clean);
        };

        frame.addEventListener("load", function () {
            var doc;
            try { doc = frame.contentDocument; } catch (e) { doc = null; }
            if (!doc) return;

            var loadedUrl = frame.contentWindow.location.href.replace(/[?&]liwiFrame=1$/, "");
            window.__liwiFrameUrl = loadedUrl;
            updateActive(loadedUrl);

            /* Keep navigation inside the iframe. Page-specific JS, cart logic,
               product modals and forms continue to run normally inside it. */
            if (!doc.__liwiNavBound) {
                doc.__liwiNavBound = true;
                doc.addEventListener("click", function (event) {
                    var anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
                    if (!anchor) return;
                    if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
                    var href = anchor.getAttribute("href");
                    if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(href)) return;
                    var target;
                    try { target = new URL(href, frame.contentWindow.location.href); } catch (e) { return; }
                    if (target.origin !== window.location.origin) return;
                    event.preventDefault();
                    window.__liwiNavigate(target.href, true);
                }, true);
            }
        });

        window.addEventListener("popstate", function () {
            var target = window.location.href;
            window.__liwiNavigate(target, false);
        });

        document.body.appendChild(frame);
    }

    function init() {
        if (isFrameMode()) return;
        markOccasionPage();
        installMobileShell();
        createBottomNav();

        window.addEventListener("storage", function () {
            updateCartBadge(document.querySelector(".mobile-bottom-nav"));
        });

        /* Existing cart scripts often change the DOM without firing storage.
           Keep the badge synced without interfering with cart functionality. */
        window.setInterval(function () {
            updateCartBadge(document.querySelector(".mobile-bottom-nav"));
        }, 1200);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
