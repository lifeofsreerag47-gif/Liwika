/* =========================================
   OCCASION.JS — Shared modal logic for all
   occasion pages (anniversary, christmas,
   graduation, justbecause, valentines).

   Each page defines window.occasionProducts
   and window.occasionBadge before loading
   this script.
========================================= */

/* =========================================
   CART TOAST
========================================= */

(function injectToast() {
    if (document.getElementById("cart-toast")) return;
    const toast = document.createElement("div");
    toast.id = "cart-toast";
    toast.innerHTML = `
        <div class="cart-toast-icon">✓</div>
        <div class="cart-toast-body">
            <span class="cart-toast-label">Added to cart</span>
            <span class="cart-toast-name" id="cart-toast-name"></span>
        </div>
    `;
    document.body.appendChild(toast);
})();

let toastTimeout = null;

function showCartToast(productName) {
    const toast = document.getElementById("cart-toast");
    const nameEl = document.getElementById("cart-toast-name");
    if (!toast || !nameEl) return;

    nameEl.textContent = productName;

    // Clear any running hide timer
    if (toastTimeout) {
        clearTimeout(toastTimeout);
        toastTimeout = null;
    }

    // Force re-trigger animation if already showing
    toast.classList.remove("show");
    void toast.offsetHeight; // reflow

    toast.classList.add("show");

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
        toastTimeout = null;
    }, 2500);
}

/* =========================================
   MODAL ELEMENTS
========================================= */

const productModal      = document.getElementById("productModal");
const closeModalBtn     = document.getElementById("closeModal");
const modalProductImage = document.getElementById("modalProductImage");
const modalProductName  = document.getElementById("modalProductName");
const modalProductDesc  = document.getElementById("modalProductDescription");
const flavourOptions    = document.getElementById("flavourOptions");
const quantityElement   = document.getElementById("quantity");
const modalProductPrice = document.getElementById("modalProductPrice");
const increaseQtyBtn    = document.getElementById("increaseQuantity");
const decreaseQtyBtn    = document.getElementById("decreaseQuantity");
const modalAddToCart    = document.getElementById("modalAddToCart");

/* =========================================
   STATE
========================================= */

let currentProduct  = null;
let currentFlavour  = null;
let currentQuantity = 1;
let currentPrice    = 0;
let qtyAnimTimeout  = null;
let qtyAnimRaf      = null;
let qtyAnimationRevision = 0;
let lastQtyTime     = 0;
let priceAnimTOs    = [];
let priceAnimRafs   = [];
let lastPriceChangeTime = 0;

/* =========================================
   QUANTITY ROLLING ANIMATION
========================================= */

function setQuantityDisplay(val, animate = false, direction = "up") {
    if (!quantityElement) return;

    const revision = ++qtyAnimationRevision;

    if (qtyAnimTimeout) {
        clearTimeout(qtyAnimTimeout);
        qtyAnimTimeout = null;
    }
    if (qtyAnimRaf) {
        cancelAnimationFrame(qtyAnimRaf);
        qtyAnimRaf = null;
    }

    if (!animate) {
        quantityElement.innerHTML = `<span class="qty-digit current">${val}</span>`;
        return;
    }

    const now = performance.now();
    const isRapid = (now - lastQtyTime) < 220;
    lastQtyTime = now;

    // Immediately resolve and reset any ongoing animation so digits never overlap
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

    qtyAnimRaf = requestAnimationFrame(() => {
        if (qtyAnimationRevision !== revision || !quantityElement.isConnected) return;
        incomingDigit.style.transform = "translateY(0)";
        incomingDigit.style.opacity = "1";
        if (currentDigit) {
            currentDigit.style.transform = direction === "up" ? "translateY(-100%)" : "translateY(100%)";
            currentDigit.style.opacity = "0";
        }
    });

    const finishDuration = isRapid ? 180 : 300;
    qtyAnimTimeout = setTimeout(() => {
        if (qtyAnimationRevision !== revision || !quantityElement.isConnected) return;
        quantityElement.innerHTML = `<span class="qty-digit current">${val}</span>`;
        qtyAnimTimeout = null;
    }, finishDuration);
}

/* =========================================
   CASCADING PRICE ANIMATION
========================================= */

function setPriceDisplay(newPrice, animate = false, direction = "up") {
    if (!modalProductPrice) return;

    const newStr = String(newPrice);

    if (!animate) {
        priceAnimTOs.forEach(t => clearTimeout(t));
        priceAnimTOs = [];
        priceAnimRafs.forEach(r => cancelAnimationFrame(r));
        priceAnimRafs = [];
        let html = "";
        for (let i = 0; i < newStr.length; i++) {
            html += `<span class="digit-slot" data-digit-index="${i}"><span class="digit-val current">${newStr[i]}</span></span>`;
        }
        modalProductPrice.innerHTML = `<span class="price-currency">₹</span><span class="price-digits">${html}</span>`;
        currentPrice = newPrice;
        return;
    }

    priceAnimTOs.forEach(t => clearTimeout(t));
    priceAnimTOs = [];
    priceAnimRafs.forEach(r => cancelAnimationFrame(r));
    priceAnimRafs = [];

    let digs = modalProductPrice.querySelector(".price-digits");
    if (!digs) { setPriceDisplay(newPrice, false); return; }

    const now = performance.now();
    const isRapid = (now - lastPriceChangeTime) < 220;
    lastPriceChangeTime = now;

    // Settle each digit to one baseline node before beginning another roll.
    const existingSlots = Array.from(digs.querySelectorAll(".digit-slot"));
    const oldStr = existingSlots.map(slot => {
        const incoming = slot.querySelector(".digit-val.incoming");
        const current = slot.querySelector(".digit-val.current") || slot.querySelector(".digit-val");
        const value = incoming ? incoming.textContent : (current ? current.textContent : "");
        slot.innerHTML = `<span class="digit-val current">${value}</span>`;
        return value;
    }).join("") || String(currentPrice || newPrice);

    let slots = Array.from(digs.querySelectorAll(".digit-slot"));
    if (slots.length !== newStr.length) {
        let html = "";
        for (let i = 0; i < newStr.length; i++) {
            const pr = newStr.length - 1 - i;
            const oi = oldStr.length - 1 - pr;
            const ev = oi >= 0 ? oldStr[oi] : (direction === "up" ? "0" : newStr[i]);
            html += `<span class="digit-slot" data-digit-index="${i}"><span class="digit-val current">${ev}</span></span>`;
        }
        digs.innerHTML = html;
        slots = Array.from(digs.querySelectorAll(".digit-slot"));
    }

    const currentSlotsStr = slots.map(slot => {
        const value = slot.querySelector(".digit-val.current") || slot.querySelector(".digit-val");
        return value ? value.textContent : "";
    }).join("");

    let maxDelay = 0, changed = 0;
    for (let place = 0; place < newStr.length; place++) {
        const si = newStr.length - 1 - place;
        const slot = slots[si];
        if (!slot) continue;
        const nd = newStr[si];
        const od = currentSlotsStr[si] || "";
        if (od === nd) continue;

        const delay = changed * (isRapid ? 0 : 35);
        changed++;
        if (delay > maxDelay) maxDelay = delay;

        const curEl = slot.querySelector(".digit-val.current") || slot.querySelector(".digit-val");
        const incEl = document.createElement("span");
        incEl.className = "digit-val incoming";
        incEl.textContent = nd;
        incEl.style.transform = direction === "up" ? "translateY(100%)" : "translateY(-100%)";
        incEl.style.opacity = "0";
        slot.appendChild(incEl);
        void incEl.offsetHeight;

        const duration = isRapid ? "0.16s" : "0.28s";
        const spec = `transform ${duration} cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, opacity ${duration} ease ${delay}ms`;
        incEl.style.transition = spec;
        if (curEl) curEl.style.transition = spec;

        const raf = requestAnimationFrame(() => {
            incEl.style.transform = "translateY(0)";
            incEl.style.opacity = "1";
            if (curEl) {
                curEl.style.transform = direction === "up" ? "translateY(-100%)" : "translateY(100%)";
                curEl.style.opacity = "0";
            }
        });
        priceAnimRafs.push(raf);
    }

    const cleanup = setTimeout(() => {
        let html = "";
        for (let i = 0; i < newStr.length; i++) {
            html += `<span class="digit-slot" data-digit-index="${i}"><span class="digit-val current">${newStr[i]}</span></span>`;
        }
        digs.innerHTML = html;
        currentPrice = newPrice;
    }, maxDelay + (isRapid ? 180 : 320));
    priceAnimTOs.push(cleanup);
    currentPrice = newPrice;
}

/* =========================================
   DISPLAY FLAVOURS
========================================= */

function displayFlavours() {
    if (!flavourOptions || !currentProduct) return;
    flavourOptions.innerHTML = "";

    currentProduct.flavours.forEach((flavour, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = flavour.name;
        btn.classList.add("flavour-button");
        if (index === 0) btn.classList.add("selected");

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            currentFlavour = flavour;
            if (modalProductImage) modalProductImage.src = flavour.image;
            document.querySelectorAll(".flavour-button").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
        });

        flavourOptions.appendChild(btn);
    });
}

/* =========================================
   OPEN MODAL
========================================= */

function openProductModal(productId) {
    const products = window.occasionProducts || {};
    if (!productModal || !products[productId]) return;

    currentProduct  = products[productId];
    currentQuantity = 1;
    currentFlavour  = currentProduct.flavours[0];
    currentPrice    = currentProduct.basePrice;

    if (modalProductName)  modalProductName.textContent  = currentProduct.name;
    if (modalProductDesc)  modalProductDesc.textContent  = currentProduct.description;
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

/* =========================================
   WIRE UP PRODUCT CARDS
========================================= */

document.querySelectorAll(".occasion-product").forEach(card => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
        const pid = card.dataset.product;
        if (pid) openProductModal(pid);
    });
});

/* =========================================
   CLOSE MODAL
========================================= */

function closeProductModal() {
    if (!productModal) return;
    productModal.classList.remove("active");
    productModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

if (closeModalBtn) closeModalBtn.addEventListener("click", closeProductModal);

if (productModal) {
    productModal.addEventListener("click", (e) => {
        if (e.target === productModal) closeProductModal();
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && productModal && productModal.classList.contains("active")) {
        closeProductModal();
    }
});

/* =========================================
   QUANTITY BUTTONS
========================================= */

if (increaseQtyBtn) {
    increaseQtyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        currentQuantity++;
        setQuantityDisplay(currentQuantity, true, "up");
        if (currentProduct) setPriceDisplay(currentProduct.basePrice * currentQuantity, true, "up");
    });
}

if (decreaseQtyBtn) {
    decreaseQtyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (currentQuantity > 1) {
            currentQuantity--;
            setQuantityDisplay(currentQuantity, true, "down");
            if (currentProduct) setPriceDisplay(currentProduct.basePrice * currentQuantity, true, "down");
        }
    });
}

/* =========================================
   ADD TO CART
========================================= */

if (modalAddToCart) {
    modalAddToCart.addEventListener("click", () => {
        if (!currentProduct || !currentFlavour) return;

        const cartItem = {
            id: currentProduct.name ? currentProduct.name.toLowerCase().replace(/\s+/g, '-') : 'prod',
            name:     currentProduct.name,
            flavour:  currentFlavour.name,
            quantity: currentQuantity,
            price:    currentProduct.basePrice,
            image:    currentFlavour.image || '../../images/choco1.jpg'
        };

        if (window.LiwikaCart) {
            window.LiwikaCart.addItem(cartItem);
        }

        console.log("Added to cart:", cartItem);

        // Button flash feedback
        modalAddToCart.textContent = "✓ ADDED!";
        modalAddToCart.style.background = "#d9a441";
        modalAddToCart.style.color = "#050505";

        setTimeout(() => {
            modalAddToCart.textContent = "ADD TO CART";
            modalAddToCart.style.background = "";
            modalAddToCart.style.color = "";
            closeProductModal();
            showCartToast(currentProduct.name);
        }, 600);
    });
}
