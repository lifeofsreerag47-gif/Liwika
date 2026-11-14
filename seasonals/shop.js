/* =========================================
   SHOP PRODUCTS DATA
========================================= */

let shopProducts = {};
window.LiwikaSetShopProducts = function (products) {
    shopProducts = {};
    (products || []).forEach(product => { shopProducts[product.id] = product; });
};

/* =========================================
   MODAL ELEMENTS
========================================= */

const productModal = document.getElementById("productModal");
const closeModal = document.getElementById("closeModal");

// Keep the fixed dialog at the document root. If a future page template nests
// it inside a transformed/overflow-clipped wrapper, move it out before opening.
if (productModal && productModal.parentElement !== document.body) {
    document.body.appendChild(productModal);
}
if (productModal) {
    productModal.setAttribute("aria-modal", "true");
    if (!productModal.hasAttribute("tabindex")) productModal.setAttribute("tabindex", "-1");
}
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
let modalScrollSnapshot = null;
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
   PAGE SCROLL LOCK — preserve the exact scroll position behind the dialog
========================================= */

function lockShopPageScroll() {
    if (modalScrollSnapshot) return;
    const body = document.body;
    const root = document.documentElement;
    modalScrollSnapshot = {
        x: window.scrollX || window.pageXOffset || 0,
        y: window.scrollY || window.pageYOffset || 0,
        bodyOverflow: body.style.overflow,
        rootOverflow: root.style.overflow
    };

    // Do not fix-position the body or alter the Shop main: either can move or
    // clip fixed descendants on phones. Lock only the scroll roots.
    body.style.overflow = 'hidden';
    root.style.overflow = 'hidden';
}

function unlockShopPageScroll() {
    if (!modalScrollSnapshot) return;
    const snapshot = modalScrollSnapshot;
    const body = document.body;
    const root = document.documentElement;
    body.style.overflow = snapshot.bodyOverflow;
    root.style.overflow = snapshot.rootOverflow;
    modalScrollSnapshot = null;
    // The scroll position should not change while the modal is open, but restore
    // it defensively in case the browser changed it during focus/viewport resize.
    window.scrollTo(snapshot.x, snapshot.y);
}

/* =========================================
   OPEN MODAL
========================================= */

function openProductModal(productId) {
    if (!productModal || !shopProducts[productId]) return;
    // A page layout/animation wrapper must never become the fixed modal's containing block.
    if (productModal.parentElement !== document.body) document.body.appendChild(productModal);

    const product = shopProducts[productId];
    currentProduct = product;
    window.LiwikaActiveProductData = product;
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
    window.LiwikaRenderProductGallery?.(product, currentFlavour.image || product.image);

    setQuantityDisplay(1, false);
    displayFlavours();
    setPriceDisplay(currentPrice, false);

    lockShopPageScroll();
    productModal.classList.add("active");
    productModal.setAttribute("aria-hidden", "false");
    productModal.setAttribute("aria-modal", "true");
    document.body.classList.add("liwi-product-modal-open");
    document.documentElement.classList.add("liwi-product-modal-open");
    // The modal is a fixed viewport sibling of the page, not a card/page-flow child.
    productModal.scrollTop = 0;
}

// Used by catalog.js as a fallback for dynamically injected Shop cards.
window.LiwikaOpenShopProductModal = openProductModal;

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
                modalProductImage.src = flavour.image || currentProduct.image || "";
            }
            window.LiwikaSetProductGalleryImage?.(flavour.image || currentProduct.image || "");

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
    shopProductGrid.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const card = event.target.closest(".shop-product");
        if (!card || !shopProductGrid.contains(card)) return;
        // A focused nested action button keeps its own native keyboard behavior.
        if (event.target.closest("button, a, input, select, textarea")) return;
        event.preventDefault();
        openProductModal(card.dataset.product);
    });

    shopProductGrid.addEventListener("click", (event) => {
        const quickAdd = event.target.closest(".quick-add");
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
                id: product.id || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                productId: product.id || '',
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

        event.preventDefault();
        event.stopPropagation();
        event.__liwikaShopModalHandled = true;
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
    document.body.classList.remove("liwi-product-modal-open");
    document.documentElement.classList.remove("liwi-product-modal-open");
    unlockShopPageScroll();
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
const productGrid = document.querySelector(".shop-products");
const getShopProductCards = () => productGrid ? Array.from(productGrid.querySelectorAll('.shop-product')) : [];

if (filterButtons.length && productGrid) {
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const filterType = btn.textContent.trim().toLowerCase();
            getShopProductCards().forEach(card => {
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

