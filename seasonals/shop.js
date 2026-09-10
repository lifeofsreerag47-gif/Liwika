/* =========================================
   SHOP PRODUCTS DATA
========================================= */

const shopProducts = {

    "dark-indulgence": {
        name: "Dark Indulgence",
        category: "DARK CHOCOLATE",
        description: "Rich dark chocolate with deep, sophisticated cocoa notes.",
        basePrice: 499,
        image: "../images/choco1.jpg",
        badge: "BESTSELLER",
        flavours: [
            {
                name: "Classic Dark",
                image: "../images/choco1.jpg"
            },
            {
                name: "Orange Dark",
                image: "../images/choco1.jpg"
            },
            {
                name: "Sea Salt Dark",
                image: "../images/choco1.jpg"
            }
        ]
    },

    "golden-milk": {
        name: "Golden Milk",
        category: "MILK CHOCOLATE",
        description: "Silky smooth milk chocolate with a beautifully creamy finish.",
        basePrice: 699,
        image: "../images/choco2.jpg",
        badge: "SIGNATURE",
        flavours: [
            {
                name: "Classic Milk",
                image: "../images/choco2.jpg"
            },
            {
                name: "Caramel Milk",
                image: "../images/choco2.jpg"
            },
            {
                name: "Vanilla Milk",
                image: "../images/choco2.jpg"
            }
        ]
    },

    "hazelnut-bliss": {
        name: "Hazelnut Bliss",
        category: "NUTTY CHOCOLATE",
        description: "Velvety chocolate combined with beautifully roasted hazelnuts.",
        basePrice: 899,
        image: "../images/choco3.jpg",
        badge: "POPULAR",
        flavours: [
            {
                name: "Classic Hazelnut",
                image: "../images/choco3.jpg"
            },
            {
                name: "Roasted Hazelnut",
                image: "../images/choco3.jpg"
            },
            {
                name: "Hazelnut Crunch",
                image: "../images/choco3.jpg"
            }
        ]
    },

    "midnight-cacao": {
        name: "Midnight Cacao",
        category: "DARK CHOCOLATE",
        description: "An intense cocoa experience for lovers of elegant dark chocolate.",
        basePrice: 599,
        image: "../images/choco1.jpg",
        badge: "NEW",
        flavours: [
            {
                name: "Pure 85%",
                image: "../images/choco1.jpg"
            },
            {
                name: "Espresso Infusion",
                image: "../images/choco1.jpg"
            },
            {
                name: "Smoked Salt",
                image: "../images/choco1.jpg"
            }
        ]
    },

    "velvet-cream": {
        name: "Velvet Cream",
        category: "MILK CHOCOLATE",
        description: "Delicate milk chocolate with a soft, creamy sweetness.",
        basePrice: 649,
        image: "../images/choco2.jpg",
        badge: "LUXURY",
        flavours: [
            {
                name: "Silk Cream",
                image: "../images/choco2.jpg"
            },
            {
                name: "Honeycomb Milk",
                image: "../images/choco2.jpg"
            },
            {
                name: "Salted Butter",
                image: "../images/choco2.jpg"
            }
        ]
    },

    "roasted-hazelnut": {
        name: "Roasted Hazelnut",
        category: "NUTTY CHOCOLATE",
        description: "Toasted hazelnuts layered into smooth, luxurious chocolate.",
        basePrice: 749,
        image: "../images/choco3.jpg",
        badge: "ARTISAN",
        flavours: [
            {
                name: "Double Roasted",
                image: "../images/choco3.jpg"
            },
            {
                name: "Hazelnut Praline",
                image: "../images/choco3.jpg"
            },
            {
                name: "Dark Hazelnut",
                image: "../images/choco3.jpg"
            }
        ]
    }

};

/* =========================================
   MODAL ELEMENTS
========================================= */

const productModal = document.getElementById("productModal");
const closeModal = document.getElementById("closeModal");
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

/* =========================================
   STATE
========================================= */

let currentProduct = null;
let currentFlavour = null;
let currentQuantity = 1;
let currentPrice = 0;
let qtyAnimationTimeout = null;
let qtyAnimationRaf = null;
let priceAnimationTimeouts = [];
let priceAnimationRafs = [];
let lastPriceChangeTime = 0;
let lastQtyChangeTime = 0;

/* =========================================
   QUANTITY ROLLING ANIMATION
========================================= */

function setQuantityDisplay(val, animate = false, direction = "up") {
    if (!quantityElement) return;

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

    // Immediately resolve any ongoing animation so quantityElement has exactly one clean baseline digit
    const incomingEl = quantityElement.querySelector(".qty-digit.incoming");
    const currentEl = quantityElement.querySelector(".qty-digit.current") || quantityElement.querySelector(".qty-digit");
    const baselineVal = incomingEl ? incomingEl.textContent : (currentEl ? currentEl.textContent : String(val));

    quantityElement.innerHTML = `<span class="qty-digit current">${baselineVal}</span>`;

    if (baselineVal === String(val)) {
        return;
    }

    const currentDigit = quantityElement.firstElementChild;
    const incomingDigit = document.createElement("span");
    incomingDigit.className = "qty-digit incoming";
    incomingDigit.textContent = val;

    incomingDigit.style.transform = direction === "up" ? "translateY(100%)" : "translateY(-100%)";
    incomingDigit.style.opacity = "0";
    quantityElement.appendChild(incomingDigit);

    void incomingDigit.offsetHeight; // Force reflow

    const animDuration = isRapid ? "0.16s" : "0.28s";
    const animCurve = `transform ${animDuration} cubic-bezier(0.16, 1, 0.3, 1), opacity ${animDuration} ease`;
    incomingDigit.style.transition = animCurve;
    if (currentDigit) {
        currentDigit.style.transition = animCurve;
    }

    qtyAnimationRaf = requestAnimationFrame(() => {
        incomingDigit.style.transform = "translateY(0)";
        incomingDigit.style.opacity = "1";
        if (currentDigit) {
            currentDigit.style.transform = direction === "up" ? "translateY(-100%)" : "translateY(100%)";
            currentDigit.style.opacity = "0";
        }
    });

    const finishDuration = isRapid ? 180 : 300;
    qtyAnimationTimeout = setTimeout(() => {
        quantityElement.innerHTML = `<span class="qty-digit current">${val}</span>`;
        qtyAnimationTimeout = null;
    }, finishDuration);
}

/* =========================================
   CASCADING DIGIT-BY-DIGIT PRICE ANIMATION
========================================= */

function setPriceDisplay(newPrice, animate = false, direction = "up") {
    if (!modalProductPrice) return;

    // Clear any pending timeouts and animation frames
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
        return;
    }

    const now = performance.now();
    const isRapid = (now - lastPriceChangeTime) < 220;
    lastPriceChangeTime = now;

    // Step 1: Immediately resolve ANY in-flight animations on all existing slots
    // Ensures each slot contains exactly ONE clean baseline digit, preventing overlap
    const existingSlots = Array.from(digitsContainer.querySelectorAll(".digit-slot"));
    let oldDigits = [];
    existingSlots.forEach(slot => {
        const incoming = slot.querySelector(".digit-val.incoming");
        const current = slot.querySelector(".digit-val.current") || slot.querySelector(".digit-val");
        const targetDigit = incoming ? incoming.textContent : (current ? current.textContent : "");
        oldDigits.push(targetDigit);
        slot.innerHTML = `<span class="digit-val current">${targetDigit}</span>`;
    });

    let oldStr = oldDigits.join("");
    if (!oldStr || oldStr.length === 0) {
        oldStr = String(currentPrice || newPrice);
    }

    // Step 2: Synchronize slot count if number of digits changed (e.g., 998 -> 1497 or 1497 -> 998)
    if (existingSlots.length !== newStr.length) {
        let slotsHtml = "";
        for (let i = 0; i < newStr.length; i++) {
            const placeFromRight = newStr.length - 1 - i;
            const oldIdx = oldStr.length - 1 - placeFromRight;
            const existingVal = oldIdx >= 0 ? oldStr[oldIdx] : (direction === "up" ? "0" : newStr[i]);
            slotsHtml += `<span class="digit-slot" data-digit-index="${i}"><span class="digit-val current">${existingVal}</span></span>`;
        }
        digitsContainer.innerHTML = slotsHtml;
    }

    // Step 3: Animate changed digits
    const slots = Array.from(digitsContainer.querySelectorAll(".digit-slot"));
    const currentSlotsStr = slots.map(s => {
        const valEl = s.querySelector(".digit-val.current") || s.querySelector(".digit-val");
        return valEl ? valEl.textContent : "";
    }).join("");

    const animDuration = isRapid ? "0.16s" : "0.28s";
    const opacityDuration = isRapid ? "0.14s" : "0.24s";
    const cascadeDelayStep = isRapid ? 0 : 35; // Remove stagger during rapid clicks to keep digits in sync

    let maxDelay = 0;
    let changedCount = 0;

    for (let place = 0; place < newStr.length; place++) {
        const slotIdx = newStr.length - 1 - place;
        const slotEl = slots[slotIdx];
        if (!slotEl) continue;

        const newDigit = newStr[slotIdx];
        const oldDigit = currentSlotsStr[slotIdx] || "";

        // Unchanged digits remain steady
        if (oldDigit === newDigit) {
            continue;
        }

        const delay = changedCount * cascadeDelayStep;
        changedCount++;
        if (delay > maxDelay) maxDelay = delay;

        const currentValEl = slotEl.firstElementChild;
        const incomingValEl = document.createElement("span");
        incomingValEl.className = "digit-val incoming";
        incomingValEl.textContent = newDigit;

        incomingValEl.style.transform = direction === "up" ? "translateY(100%)" : "translateY(-100%)";
        incomingValEl.style.opacity = "0";

        slotEl.appendChild(incomingValEl);
        void incomingValEl.offsetHeight; // Force reflow

        const transitionSpec = `transform ${animDuration} cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, opacity ${opacityDuration} ease ${delay}ms`;
        incomingValEl.style.transition = transitionSpec;
        if (currentValEl) {
            currentValEl.style.transition = transitionSpec;
        }

        const rafId = requestAnimationFrame(() => {
            incomingValEl.style.transform = "translateY(0)";
            incomingValEl.style.opacity = "1";
            if (currentValEl) {
                currentValEl.style.transform = direction === "up" ? "translateY(-100%)" : "translateY(100%)";
                currentValEl.style.opacity = "0";
            }
        });
        priceAnimationRafs.push(rafId);
    }

    // Step 4: Final cleanup when all animations settle
    const finishDuration = maxDelay + (isRapid ? 180 : 320);
    const finalCleanupTimeout = setTimeout(() => {
        let slotsHtml = "";
        for (let i = 0; i < newStr.length; i++) {
            slotsHtml += `<span class="digit-slot" data-digit-index="${i}"><span class="digit-val current">${newStr[i]}</span></span>`;
        }
        digitsContainer.innerHTML = slotsHtml;
        currentPrice = newPrice;
    }, finishDuration);
    priceAnimationTimeouts.push(finalCleanupTimeout);

    currentPrice = newPrice;
}

/* =========================================
   OPEN PRODUCT MODAL
========================================= */

function openProductModal(productId) {
    if (!productModal || !shopProducts[productId]) return;

    currentProduct = shopProducts[productId];
    currentQuantity = 1;
    currentFlavour = currentProduct.flavours[0];
    currentPrice = currentProduct.basePrice;

    if (modalProductName) {
        modalProductName.textContent = currentProduct.name;
    }

    if (modalProductBadge) {
        modalProductBadge.textContent = currentProduct.badge || "FEATURED";
    }

    if (modalProductDescription) {
        modalProductDescription.textContent = currentProduct.description;
    }

    if (modalProductImage) {
        modalProductImage.src = currentFlavour.image;
        modalProductImage.alt = currentProduct.name;
    }

    // Initialize quantity and price displays without animation
    setQuantityDisplay(currentQuantity, false);
    displayFlavours();
    setPriceDisplay(currentPrice, false);

    productModal.classList.add("active");
    productModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

/* =========================================
   DISPLAY FLAVOURS
========================================= */

function displayFlavours() {
    if (!flavourOptions || !currentProduct) return;
    flavourOptions.innerHTML = "";

    currentProduct.flavours.forEach((flavour, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = flavour.name;
        button.classList.add("flavour-button");

        if (index === 0) {
            button.classList.add("selected");
        }

        button.addEventListener("click", (e) => {
            e.stopPropagation();
            currentFlavour = flavour;

            if (modalProductImage) {
                modalProductImage.src = flavour.image;
            }

            document.querySelectorAll(".flavour-button").forEach(btn => {
                btn.classList.remove("selected");
            });

            button.classList.add("selected");
        });

        flavourOptions.appendChild(button);
    });
}

/* =========================================
   ATTACH EVENT LISTENERS TO PRODUCT CARDS
========================================= */

const shopProductCards = document.querySelectorAll(".shop-product");

shopProductCards.forEach(card => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
        const productId = card.dataset.product;
        if (productId && shopProducts[productId]) {
            openProductModal(productId);
        }
    });

    const addBtn = card.querySelector(".shop-add");
    if (addBtn) {
        addBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const productId = card.dataset.product;
            if (productId && shopProducts[productId]) {
                openProductModal(productId);
            }
        });
    }

    const quickAddBtn = card.querySelector(".quick-add");
    if (quickAddBtn) {
        quickAddBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const productId = card.dataset.product;
            if (productId && shopProducts[productId]) {
                openProductModal(productId);
            }
        });
    }
});

/* =========================================
   QUANTITY HANDLERS
========================================= */

if (increaseQuantity) {
    increaseQuantity.addEventListener("click", (e) => {
        e.stopPropagation();
        currentQuantity++;
        setQuantityDisplay(currentQuantity, true, "up");

        if (currentProduct) {
            const newTotal = currentProduct.basePrice * currentQuantity;
            setPriceDisplay(newTotal, true, "up");
        }
    });
}

if (decreaseQuantity) {
    decreaseQuantity.addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentQuantity > 1) {
            currentQuantity--;
            setQuantityDisplay(currentQuantity, true, "down");

            if (currentProduct) {
                const newTotal = currentProduct.basePrice * currentQuantity;
                setPriceDisplay(newTotal, true, "down");
            }
        }
    });
}

/* =========================================
   CLOSE MODAL
========================================= */

function closeProductModal() {
    if (!productModal) return;
    productModal.classList.remove("active");
    productModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    // Cancel any pending animations
    if (qtyAnimationTimeout) {
        clearTimeout(qtyAnimationTimeout);
        qtyAnimationTimeout = null;
    }
    if (qtyAnimationRaf) {
        cancelAnimationFrame(qtyAnimationRaf);
        qtyAnimationRaf = null;
    }
    priceAnimationTimeouts.forEach(t => clearTimeout(t));
    priceAnimationTimeouts = [];
    priceAnimationRafs.forEach(r => cancelAnimationFrame(r));
    priceAnimationRafs = [];
}

if (closeModal) {
    closeModal.addEventListener("click", closeProductModal);
}

if (productModal) {
    productModal.addEventListener("click", (event) => {
        if (event.target === productModal) {
            closeProductModal();
        }
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && productModal && productModal.classList.contains("active")) {
        closeProductModal();
    }
});

/* =========================================
   ADD TO CART
========================================= */

if (modalAddToCart) {
    modalAddToCart.addEventListener("click", () => {
        if (!currentProduct || !currentFlavour) return;

        const cartItem = {
            name: currentProduct.name,
            flavour: currentFlavour.name,
            quantity: currentQuantity,
            price: currentProduct.basePrice * currentQuantity
        };

        console.log("Added to cart:", cartItem);

        modalAddToCart.textContent = "✓ ADDED!";
        modalAddToCart.style.background = "#d9a441";
        modalAddToCart.style.color = "#050505";

        setTimeout(() => {
            modalAddToCart.textContent = "ADD TO CART";
            modalAddToCart.style.background = "";
            modalAddToCart.style.color = "";
            closeProductModal();
        }, 700);
    });
}

/* =========================================
   FILTER & SORT CONTROLS
========================================= */

const filterButtons = document.querySelectorAll(".filter-button");
const sortSelect = document.querySelector(".shop-sort select");
const productGrid = document.querySelector(".shop-products");

if (filterButtons.length && productGrid) {
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const filterType = btn.textContent.trim().toLowerCase();
            shopProductCards.forEach(card => {
                const category = (card.dataset.category || "").toLowerCase();
                if (filterType === "all" || category === filterType) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });
}

if (sortSelect && productGrid) {
    sortSelect.addEventListener("change", () => {
        const val = sortSelect.value.trim().toLowerCase();
        const cardsArr = Array.from(shopProductCards);

        if (val.includes("low to high")) {
            cardsArr.sort((a, b) => {
                const priceA = shopProducts[a.dataset.product]?.basePrice || 0;
                const priceB = shopProducts[b.dataset.product]?.basePrice || 0;
                return priceA - priceB;
            });
        } else if (val.includes("high to low")) {
            cardsArr.sort((a, b) => {
                const priceA = shopProducts[a.dataset.product]?.basePrice || 0;
                const priceB = shopProducts[b.dataset.product]?.basePrice || 0;
                return priceB - priceA;
            });
        }

        cardsArr.forEach(card => productGrid.appendChild(card));
    });
}
