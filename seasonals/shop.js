/* =========================================
   SHOP PRODUCTS DATA
========================================= */

const shopProducts = {

    "dark-indulgence": {
        name: "Dark Indulgence",
        category: "DARK CHOCOLATE",
        description: "Rich dark chocolate with deep, sophisticated cocoa notes.",
        basePrice: 49,
        nutrition: {
    energy: "520 kcal",
    fat: "32 g",
    saturatedFat: "20 g",
    carbohydrates: "52 g",
    sugars: "38 g",
    protein: "7 g"
},

ingredients: "Cocoa solids, sugar, cocoa butter, milk solids, natural vanilla flavour",
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
        basePrice: 69,
        nutrition: {
    energy: "545 kcal",
    fat: "34 g",
    saturatedFat: "21 g",
    carbohydrates: "54 g",
    sugars: "45 g",
    protein: "8 g"
},

ingredients: "Sugar, milk solids, cocoa butter, cocoa solids, natural vanilla flavour",
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
        basePrice: 89,
        nutrition: {
    energy: "560 kcal",
    fat: "37 g",
    saturatedFat: "18 g",
    carbohydrates: "51 g",
    sugars: "39 g",
    protein: "8 g"
},

ingredients: "Cocoa solids, sugar, cocoa butter, milk solids, roasted hazelnuts, natural vanilla flavour",

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
        basePrice: 59,
         nutrition: {
        energy: "510 kcal",
        fat: "31 g",
        saturatedFat: "19 g",
        carbohydrates: "50 g",
        sugars: "32 g",
        protein: "8 g"
    },

    ingredients: "Cocoa solids, cocoa butter, sugar, natural vanilla flavour, espresso extract",
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
        basePrice: 79,
        nutrition: {
    energy: "535 kcal",
    fat: "34 g",
    saturatedFat: "21 g",
    carbohydrates: "55 g",
    sugars: "46 g",
    protein: "8 g"
},

ingredients: "Milk solids, sugar, cocoa butter, cocoa solids, natural vanilla flavour",

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
        basePrice: 89,
        nutrition: {
    energy: "570 kcal",
    fat: "39 g",
    saturatedFat: "19 g",
    carbohydrates: "49 g",
    sugars: "35 g",
    protein: "9 g"
},

ingredients: "Cocoa solids, sugar, cocoa butter, milk solids, roasted hazelnuts, hazelnut praline, natural vanilla flavour",
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
let qtyAnimationRevision = 0;
let priceAnimationTimeouts = [];
let priceAnimationRafs = [];
let lastPriceChangeTime = 0;
let lastQtyChangeTime = 0;

/* =========================================
   QUANTITY ROLLING ANIMATION
========================================= */

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

/* =========================================
   OPEN MODAL
========================================= */

function openProductModal(productId) {
    if (!productModal || !shopProducts[productId]) return;

    const product = shopProducts[productId];
    currentProduct = product;
    currentQuantity = 1;
    currentFlavour = product.flavours?.[0] || { name: "Classic", image: product.image };
    currentPrice = Number(product.basePrice) || 0;

    if (modalProductName) modalProductName.textContent = product.name || "Chocolate";
    if (modalProductBadge) {
        modalProductBadge.textContent = product.badge || "LIWI-KA";
        modalProductBadge.style.display = product.badge ? "" : "none";
    }
    if (modalProductDescription) {
        modalProductDescription.textContent = product.description || "A handcrafted Liwi-Ka chocolate creation.";
    }
    if (modalProductImage) {
        modalProductImage.src = currentFlavour.image || product.image;
        modalProductImage.alt = product.name || "Selected chocolate";
    }

    setQuantityDisplay(1, false);
    displayFlavours();
    setPriceDisplay(currentPrice, false);

    productModal.classList.add("active");
    productModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("liwi-product-modal-open");
    document.body.style.overflow = "hidden";
    closeModal?.focus({ preventScroll: true });
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

const shopProductGrid = document.querySelector(".shop-products");

if (shopProductGrid) {
    shopProductGrid.addEventListener("click", (event) => {
        const quickAdd = event.target.closest(".quick-add");
        const addButton = event.target.closest(".shop-add");
        const card = event.target.closest(".shop-product");
        if (!card || !shopProductGrid.contains(card)) return;

        const productId = card.dataset.product;
        const product = shopProducts[productId];
        if (!product) return;

        if (quickAdd) {
            event.preventDefault();
            event.stopPropagation();
            const flavour = product.flavours?.[0];
            const cartItem = {
                id: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                name: product.name,
                flavour: flavour?.name || "Classic",
                quantity: 1,
                price: product.basePrice,
                image: flavour?.image || product.image
            };
            if (window.LiwikaCart?.addItem) {
                window.LiwikaCart.addItem(cartItem);
            }
            if (typeof window.LiwikaShowCartToast === "function") {
                window.LiwikaShowCartToast(cartItem);
            }
            return;
        }

        if (addButton) {
            event.preventDefault();
            event.stopPropagation();
        }

        openProductModal(productId);
    });
}

/* =========================================
   QUANTITY HANDLERS/* =========================================
   QUANTITY HANDLERS
========================================= */

if (increaseQuantity) {
    increaseQuantity.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!currentProduct) return;
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
        if (!currentProduct) return;
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
    document.body.classList.remove("liwi-product-modal-open");
    currentProduct = null;
    currentQuantity = 1;

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
            id: currentProduct.name ? currentProduct.name.toLowerCase().replace(/\s+/g, '-') : 'prod',
            name: currentProduct.name,
            flavour: currentFlavour.name,
            quantity: currentQuantity,
            price: currentProduct.basePrice,
            image: currentFlavour.image || '../images/choco1.jpg'
        };

        if (window.LiwikaCart) {
            window.LiwikaCart.addItem(cartItem);
        }

        console.log("Added to cart:", cartItem);

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
