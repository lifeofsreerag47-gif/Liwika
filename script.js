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

// Event delegation for dynamic festival cards tilt effect
document.addEventListener("mousemove", (e) => {
    const festCard = e.target.closest(".dynamic-festival-card");
    if (!festCard) return;

    const rect = festCard.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    festCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.02)`;
});

document.addEventListener("mouseout", (e) => {
    const festCard = e.target.closest(".dynamic-festival-card");
    if (!festCard) return;
    if (!festCard.contains(e.relatedTarget)) {
        festCard.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)";
    }
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



// Home Page & Bestsellers Product Customization Modal Controller
document.addEventListener("DOMContentLoaded", () => {
    const productModal = document.getElementById("productModal");
    if (!productModal) return;

    const closeModalBtn = document.getElementById("closeModal");
    const modalProductImage = document.getElementById("modalProductImage");
    const modalProductName = document.getElementById("modalProductName");
    const modalProductBadge = document.getElementById("modalProductBadge");
    const modalProductDescription = document.getElementById("modalProductDescription");
    const flavourOptions = document.getElementById("flavourOptions");
    const quantityElement = document.getElementById("quantity");
    const modalProductPrice = document.getElementById("modalProductPrice");
    const increaseQuantity = document.getElementById("increaseQuantity");
    const decreaseQuantity = document.getElementById("decreaseQuantity");
    const modalAddToCart = document.getElementById("modalAddToCart");

    const homeProducts = {
        "dark-indulgence": {
            name: "Dark Indulgence",
            badge: "BESTSELLER",
            description: "Rich dark chocolate crafted for true chocolate lovers with single-origin cocoa.",
            basePrice: 49,
            image: "./images/choco1.jpg",
            flavours: [
                { name: "Classic Dark", image: "./images/choco1.jpg" },
                { name: "Orange Dark", image: "./images/choco1.jpg" },
                { name: "Sea Salt Dark", image: "./images/choco1.jpg" }
            ]
        },
        "golden-milk": {
            name: "Golden Milk",
            badge: "SIGNATURE",
            description: "Smooth, creamy chocolate with a luxurious finish and velvety richness.",
            basePrice: 59,
            image: "./images/choco2.jpg",
            flavours: [
                { name: "Classic Milk", image: "./images/choco2.jpg" },
                { name: "Caramel Milk", image: "./images/choco2.jpg" },
                { name: "Vanilla Milk", image: "./images/choco2.jpg" }
            ]
        },
        "hazelnut-bliss": {
            name: "Hazelnut Bliss",
            badge: "POPULAR",
            description: "Velvety chocolate paired with slow-roasted Mediterranean hazelnuts.",
            basePrice: 69,
            image: "./images/choco3.jpg",
            flavours: [
                { name: "Classic Hazelnut", image: "./images/choco3.jpg" },
                { name: "Roasted Hazelnut", image: "./images/choco3.jpg" },
                { name: "Hazelnut Crunch", image: "./images/choco3.jpg" }
            ]
        }
    };

    let currentProduct = null;
    let currentFlavour = null;
    let currentQuantity = 1;
    let currentPrice = 0;
    let qtyAnimationTimeout = null;
    let qtyAnimationRaf = null;
    let qtyAnimationRevision = 0;
    let lastQtyChangeTime = 0;
    let priceAnimationTimeouts = [];
    let priceAnimationRafs = [];
    let lastPriceChangeTime = 0;

    function setQuantityDisplay(val, animate = false, direction = "up") {
        if (!quantityElement) return;

        const revision = ++qtyAnimationRevision;

        if (qtyAnimationTimeout) {
            clearTimeout(qtyAnimationTimeout);
            qtyAnimationTimeout = null;
        }
        if (qtyAnimationRaf) {
            cancelAnimationFrame(qtyAnimationRaf);
            qtyAnimationRaf = null;
        }

        if (!animate) {
            quantityElement.innerHTML = `<span class="qty-digit current">${val}</span>`;
            return;
        }

        const now = performance.now();
        const isRapid = (now - lastQtyChangeTime) < 220;
        lastQtyChangeTime = now;

        const incomingEl = quantityElement.querySelector(".qty-digit.incoming");
        const currentEl = quantityElement.querySelector(".qty-digit.current") || quantityElement.querySelector(".qty-digit");
        const baselineVal = incomingEl ? incomingEl.textContent : (currentEl ? currentEl.textContent : String(val));

        quantityElement.innerHTML = `<span class="qty-digit current">${baselineVal}</span>`;

        if (baselineVal === String(val)) return;

        const currentDigit = quantityElement.firstElementChild;
        const incomingDigit = document.createElement("span");
        incomingDigit.className = "qty-digit incoming";
        incomingDigit.textContent = val;

        incomingDigit.style.transform = direction === "up" ? "translateY(100%)" : "translateY(-100%)";
        incomingDigit.style.opacity = "0";
        quantityElement.appendChild(incomingDigit);

        void incomingDigit.offsetHeight;

        const animDuration = isRapid ? "0.16s" : "0.28s";
        const animCurve = `transform ${animDuration} cubic-bezier(0.16, 1, 0.3, 1), opacity ${animDuration} ease`;
        incomingDigit.style.transition = animCurve;
        if (currentDigit) currentDigit.style.transition = animCurve;

        qtyAnimationRaf = requestAnimationFrame(() => {
            if (qtyAnimationRevision !== revision || !quantityElement.isConnected) return;
            incomingDigit.style.transform = "translateY(0)";
            incomingDigit.style.opacity = "1";
            if (currentDigit) {
                currentDigit.style.transform = direction === "up" ? "translateY(-100%)" : "translateY(100%)";
                currentDigit.style.opacity = "0";
            }
        });

        const finishDuration = isRapid ? 180 : 300;
        qtyAnimationTimeout = setTimeout(() => {
            if (qtyAnimationRevision !== revision || !quantityElement.isConnected) return;
            quantityElement.innerHTML = `<span class="qty-digit current">${val}</span>`;
            qtyAnimationTimeout = null;
        }, finishDuration);
    }

    function setPriceDisplay(newPrice, animate = false, direction = "up") {
        if (!modalProductPrice) return;

        priceAnimationTimeouts.forEach(t => clearTimeout(t));
        priceAnimationTimeouts = [];
        priceAnimationRafs.forEach(r => cancelAnimationFrame(r));
        priceAnimationRafs = [];

        const newStr = String(newPrice);

        if (!animate) {
            let slotsHtml = "";
            for (let i = 0; i < newStr.length; i++) {
                slotsHtml += `<span class="digit-slot" data-digit-index="${i}"><span class="digit-val current">${newStr[i]}</span></span>`;
            }
            modalProductPrice.innerHTML = `<span class="price-currency">₹</span><span class="price-digits">${slotsHtml}</span>`;
            currentPrice = newPrice;
            return;
        }

        let digitsContainer = modalProductPrice.querySelector(".price-digits");
        if (!digitsContainer) {
            setPriceDisplay(newPrice, false);
            digitsContainer = modalProductPrice.querySelector(".price-digits");
        }

        const now = performance.now();
        const isRapid = (now - lastPriceChangeTime) < 220;
        lastPriceChangeTime = now;

        // A click can arrive while the previous roll is mid-flight. Collapse every
        // slot to its visible target before creating the next roll, so digits never stack.
        const existingSlots = Array.from(digitsContainer.querySelectorAll(".digit-slot"));
        const oldStr = existingSlots.map(slot => {
            const incoming = slot.querySelector(".digit-val.incoming");
            const current = slot.querySelector(".digit-val.current") || slot.querySelector(".digit-val");
            const value = incoming ? incoming.textContent : (current ? current.textContent : "");
            slot.innerHTML = `<span class="digit-val current">${value}</span>`;
            return value;
        }).join("") || String(currentPrice || newPrice);

        let slots = existingSlots;
        if (existingSlots.length !== newStr.length) {
            let slotsHtml = "";
            for (let i = 0; i < newStr.length; i++) {
                const placeFromRight = newStr.length - 1 - i;
                const oldIdx = oldStr.length - 1 - placeFromRight;
                const existingVal = oldIdx >= 0 ? oldStr[oldIdx] : (direction === "up" ? "0" : newStr[i]);
                slotsHtml += `<span class="digit-slot" data-digit-index="${i}"><span class="digit-val current">${existingVal}</span></span>`;
            }
            digitsContainer.innerHTML = slotsHtml;
            slots = Array.from(digitsContainer.querySelectorAll(".digit-slot"));
        }

        slots = Array.from(digitsContainer.querySelectorAll(".digit-slot"));
        const currentSlotsStr = slots.map(slot => {
            const value = slot.querySelector(".digit-val.current") || slot.querySelector(".digit-val");
            return value ? value.textContent : "";
        }).join("");

        let maxDelay = 0;
        let changedCount = 0;

        for (let place = 0; place < newStr.length; place++) {
            const slotIndex = newStr.length - 1 - place;
            const slot = slots[slotIndex];
            if (!slot) continue;

            const newDigitChar = newStr[slotIndex];
            const oldDigitChar = currentSlotsStr[slotIndex] || "";

            if (oldDigitChar === newDigitChar) continue;

            const delay = changedCount * (isRapid ? 0 : 35);
            changedCount++;
            if (delay > maxDelay) maxDelay = delay;

            const curVal = slot.querySelector(".digit-val.current") || slot.querySelector(".digit-val");
            const incVal = document.createElement("span");
            incVal.className = "digit-val incoming";
            incVal.textContent = newDigitChar;

            incVal.style.transform = direction === "up" ? "translateY(100%)" : "translateY(-100%)";
            incVal.style.opacity = "0";
            slot.appendChild(incVal);

            void incVal.offsetHeight;

            const duration = isRapid ? "0.16s" : "0.28s";
            const animCurve = `transform ${duration} cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, opacity ${duration} ease ${delay}ms`;
            incVal.style.transition = animCurve;
            if (curVal) curVal.style.transition = animCurve;

            const raf = requestAnimationFrame(() => {
                incVal.style.transform = "translateY(0)";
                incVal.style.opacity = "1";
                if (curVal) {
                    curVal.style.transform = direction === "up" ? "translateY(-100%)" : "translateY(100%)";
                    curVal.style.opacity = "0";
                }
            });
            priceAnimationRafs.push(raf);
        }

        const cleanupTimeout = setTimeout(() => {
            let slotsHtml = "";
            for (let i = 0; i < newStr.length; i++) {
                slotsHtml += `<span class="digit-slot" data-digit-index="${i}"><span class="digit-val current">${newStr[i]}</span></span>`;
            }
            digitsContainer.innerHTML = slotsHtml;
            currentPrice = newPrice;
        }, maxDelay + (isRapid ? 180 : 320));

        priceAnimationTimeouts.push(cleanupTimeout);
        currentPrice = newPrice;
    }

    function displayFlavours() {
        if (!flavourOptions || !currentProduct) return;
        flavourOptions.innerHTML = "";

        currentProduct.flavours.forEach((flavour, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = flavour.name;
            button.classList.add("flavour-button");

            if (index === 0) button.classList.add("selected");

            button.addEventListener("click", (e) => {
                e.stopPropagation();
                currentFlavour = flavour;
                if (modalProductImage) modalProductImage.src = flavour.image;
                document.querySelectorAll(".flavour-button").forEach(b => b.classList.remove("selected"));
                button.classList.add("selected");
            });

            flavourOptions.appendChild(button);
        });
    }

    function openProductModal(productId) {
        if (!homeProducts[productId]) return;

        currentProduct = homeProducts[productId];
        currentQuantity = 1;
        currentFlavour = currentProduct.flavours[0];
        currentPrice = currentProduct.basePrice;

        if (modalProductName) modalProductName.textContent = currentProduct.name;
        if (modalProductBadge) modalProductBadge.textContent = currentProduct.badge;
        if (modalProductDescription) modalProductDescription.textContent = currentProduct.description;
        if (modalProductImage) {
            modalProductImage.src = currentFlavour.image;
            modalProductImage.alt = currentProduct.name;
        }

        setQuantityDisplay(currentQuantity, false);
        displayFlavours();
        setPriceDisplay(currentPrice, false);

        productModal.classList.add("active");
        productModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeProductModal() {
        productModal.classList.remove("active");
        productModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        currentProduct = null;
        currentQuantity = 1;
    }

    if (closeModalBtn) closeModalBtn.addEventListener("click", closeProductModal);
    productModal.addEventListener("click", (e) => {
        if (e.target === productModal) closeProductModal();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && productModal.classList.contains("active")) {
            closeProductModal();
        }
    });

    if (increaseQuantity) {
        increaseQuantity.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!currentProduct) return;
            currentQuantity++;
            setQuantityDisplay(currentQuantity, true, "up");
            if (currentProduct) setPriceDisplay(currentProduct.basePrice * currentQuantity, true, "up");
        });
    }

    if (decreaseQuantity) {
        decreaseQuantity.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!currentProduct) return;
            if (currentQuantity > 1) {
                currentQuantity--;
                setQuantityDisplay(currentQuantity, true, "down");
                if (currentProduct) setPriceDisplay(currentProduct.basePrice * currentQuantity, true, "down");
            }
        });
    }

    // Attach click events to card and card "Add to Cart" buttons
    const productCards = document.querySelectorAll(".product-card");
    productCards.forEach(card => {
        card.style.cursor = "pointer";
        card.addEventListener("click", (e) => {
            const pid = card.dataset.product;
            if (pid) openProductModal(pid);
        });

        const addBtn = card.querySelector(".add-button");
        if (addBtn) {
            addBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const pid = card.dataset.product;
                if (pid) openProductModal(pid);
            });
        }
    });

    if (modalAddToCart) {
        modalAddToCart.addEventListener("click", () => {
            if (!currentProduct || !currentFlavour) return;

            const cartItem = {
                id: currentProduct.name ? currentProduct.name.toLowerCase().replace(/\s+/g, '-') : 'prod',
                name: currentProduct.name,
                flavour: currentFlavour.name,
                quantity: currentQuantity,
                price: currentProduct.basePrice,
                image: currentFlavour.image || './images/choco1.jpg'
            };

            if (window.LiwikaCart) {
                window.LiwikaCart.addItem(cartItem);
            }

            modalAddToCart.textContent = "✓ ADDED!";
            modalAddToCart.style.background = "#d9a441";
            modalAddToCart.style.color = "#050505";

            setTimeout(() => {
                modalAddToCart.textContent = "ADD TO CART";
                modalAddToCart.style.background = "";
                modalAddToCart.style.color = "";
                closeProductModal();
            }, 600);
        });
    }
});


/* =====================================================
   LIWI-KA COMMUNITY — newsletter signup
   ===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("liwikaNewsletterForm");
    const status = document.getElementById("newsletterStatus");
    if (!form) return;

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const email = input ? input.value.trim().toLowerCase() : "";
        if (!email) return;

        try {
            const key = "liwika_community_emails";
            const emails = JSON.parse(localStorage.getItem(key) || "[]");
            if (!emails.includes(email)) emails.push(email);
            localStorage.setItem(key, JSON.stringify(emails));
        } catch (e) {}

        if (status) status.textContent = "You're in — welcome to the Liwika community.";
        form.classList.add("submitted");
        if (input) input.value = "";
    });
});
