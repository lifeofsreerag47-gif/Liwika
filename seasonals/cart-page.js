/* =====================================================
   LIWI-KA CART PAGE CONTROLLER
   Renders product cards with rapid-click-safe rolling animations,
   bill summary with itemized breakdown & subtotal,
   and handles payment method selection.
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("cartContainer");
    if (!container) return;

    // Track active animation work per card.  The revision is important: a
    // timeout that was already queued must never be allowed to clean up a
    // newer animation after a rapid series of clicks.
    const activeAnimState = new Map();

    function renderCart() {
        activeAnimState.forEach((state) => {
            if (state.timeout) clearTimeout(state.timeout);
            if (state.raf) cancelAnimationFrame(state.raf);
        });
        activeAnimState.clear();

        const items = window.LiwikaCart ? window.LiwikaCart.getItems() : [];

        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">🛍️</div>
                    <h2>Your Shopping Bag is Empty</h2>
                    <p>Discover our artisanal collection of handcrafted chocolates and curate your sweet moments.</p>
                    <a href="shop.html" class="cart-btn-primary">EXPLORE COLLECTION</a>
                </div>
            `;
            return;
        }

        const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const shipping = 0; // Complimentary luxury delivery
        const total = subtotal + shipping;

        // Build items list HTML
        let itemsHtml = `<div class="cart-items-container">`;

        items.forEach((item, index) => {
            let imgSrc = item.image || './images/choco1.jpg';
            if (imgSrc.startsWith('../../images/')) {
                imgSrc = imgSrc.replace('../../images/', '../images/');
            } else if (imgSrc.startsWith('./images/')) {
                imgSrc = imgSrc.replace('./images/', '../images/');
            }

            const itemTotal = item.price * item.quantity;
            const itemKey = `${item.id}_${item.flavour}`;

            itemsHtml += `
                <div class="cart-item-card" data-key="${itemKey}" data-id="${item.id}" data-flavour="${item.flavour}">
                    <div class="cart-item-image">
                        <img src="${imgSrc}" alt="${item.name}">
                    </div>

                    <div class="cart-item-details">
                        <div class="cart-item-top">
                            <div>
                                <h3>${item.name}</h3>
                                <p class="cart-item-flavour">${item.flavour}</p>
                            </div>
                            <button class="cart-item-remove" type="button" aria-label="Remove item" title="Remove item">
                                ✕
                            </button>
                        </div>

                        <div class="cart-item-bottom">
                            <div>
                                <p class="cart-item-price-unit">₹${item.price} each</p>
                                <p class="cart-item-price-total item-total-price">₹${itemTotal}</p>
                            </div>

                            <div class="cart-qty-control">
                                <button type="button" class="qty-btn btn-decrease" aria-label="Decrease quantity">−</button>
                                <span class="qty-display item-qty-display">
                                    <span class="qty-digit current">${item.quantity}</span>
                                </span>
                                <button type="button" class="qty-btn btn-increase" aria-label="Increase quantity">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        itemsHtml += `</div>`;

        // Bill Summary Breakdown HTML
        let billRowsHtml = "";
        items.forEach(item => {
            const itemKey = `${item.id}_${item.flavour}`;
            billRowsHtml += `
                <div class="bill-row item-line" data-bill-key="${itemKey}">
                    <div class="bill-item-name">
                        <span class="bill-item-title">${item.name} × ${item.quantity}</span>
                        <span class="bill-item-flavour">${item.flavour}</span>
                    </div>
                    <span class="bill-item-sub">₹${item.price * item.quantity}</span>
                </div>
            `;
        });

        const summaryHtml = `
            <div class="cart-summary-card">
                <h2>Bill Details</h2>

                <div class="bill-rows" id="billRowsContainer">
                    ${billRowsHtml}

                    <div class="bill-row" style="margin-top: 8px;">
                        <span>Item Subtotal</span>
                        <span id="billSubtotal">₹${subtotal}</span>
                    </div>

                    <div class="bill-row">
                        <span>Artisanal Packaging</span>
                        <span style="color: #72b274;">Complimentary</span>
                    </div>

                    <div class="bill-row">
                        <span>Standard Delivery</span>
                        <span style="color: #72b274;">Free</span>
                    </div>

                    <div class="bill-row total-line">
                        <span>Grand Total</span>
                        <span class="total-amount" id="billGrandTotal">₹${total}</span>
                    </div>
                </div>

                <div class="payment-methods">
                    <div class="payment-methods-title">Pay With</div>
                    <div class="payment-options-grid">
                        <label class="pay-option selected">
                            <input type="radio" name="pay_method" value="upi" checked>
                            <span>UPI / GPay</span>
                        </label>
                        <label class="pay-option">
                            <input type="radio" name="pay_method" value="card">
                            <span>Credit Card</span>
                        </label>
                        <label class="pay-option">
                            <input type="radio" name="pay_method" value="netbanking">
                            <span>Net Banking</span>
                        </label>
                        <label class="pay-option">
                            <input type="radio" name="pay_method" value="cod">
                            <span>Cash on Delivery</span>
                        </label>
                    </div>

                    <button type="button" id="payNowBtn" class="cart-checkout-btn">
                        PROCEED TO PAY ₹${total}
                    </button>

                    <div class="checkout-guarantee">
                        <span>🔒 256-Bit Encrypted &amp; Secure Checkout</span>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = itemsHtml + summaryHtml;

        wireCartEvents();
    }

    // Rolling quantity animation shared visually with the product modal.
    // Each update first reduces the display to exactly one baseline digit.
    function animateQtySafe(qtyEl, itemKey, newVal, direction = "up") {
        if (!qtyEl) return;

        let state = activeAnimState.get(itemKey);
        if (!state) {
            state = { timeout: null, raf: null, lastTime: 0, revision: 0 };
            activeAnimState.set(itemKey, state);
        }

        const revision = ++state.revision;

        if (state.timeout) {
            clearTimeout(state.timeout);
            state.timeout = null;
        }
        if (state.raf) {
            cancelAnimationFrame(state.raf);
            state.raf = null;
        }

        const now = performance.now();
        const isRapid = (now - state.lastTime) < 220;
        state.lastTime = now;

        // Immediately resolve and clean up any ongoing animation so no text elements overlap
        const incomingEl = qtyEl.querySelector(".qty-digit.incoming");
        const currentEl = qtyEl.querySelector(".qty-digit.current") || qtyEl.querySelector(".qty-digit");
        const baselineVal = incomingEl ? incomingEl.textContent : (currentEl ? currentEl.textContent : String(newVal));

        qtyEl.innerHTML = `<span class="qty-digit current">${baselineVal}</span>`;

        if (baselineVal === String(newVal)) {
            return;
        }

        const currentDigit = qtyEl.firstElementChild;
        const incomingDigit = document.createElement("span");
        incomingDigit.className = "qty-digit incoming";
        incomingDigit.textContent = newVal;

        incomingDigit.style.transform = direction === "up" ? "translateY(100%)" : "translateY(-100%)";
        incomingDigit.style.opacity = "0";
        qtyEl.appendChild(incomingDigit);

        void incomingDigit.offsetHeight; // force reflow

        const animDuration = isRapid ? "0.16s" : "0.28s";
        const animCurve = `transform ${animDuration} cubic-bezier(0.16, 1, 0.3, 1), opacity ${animDuration} ease`;
        incomingDigit.style.transition = animCurve;
        if (currentDigit) {
            currentDigit.style.transition = animCurve;
        }

        state.raf = requestAnimationFrame(() => {
            if (state.revision !== revision || !qtyEl.isConnected) return;
            incomingDigit.style.transform = "translateY(0)";
            incomingDigit.style.opacity = "1";
            if (currentDigit) {
                currentDigit.style.transform = direction === "up" ? "translateY(-100%)" : "translateY(100%)";
                currentDigit.style.opacity = "0";
            }
        });

        const finishDuration = isRapid ? 180 : 300;
        state.timeout = setTimeout(() => {
            if (state.revision !== revision || !qtyEl.isConnected) return;
            qtyEl.innerHTML = `<span class="qty-digit current">${newVal}</span>`;
            state.timeout = null;
        }, finishDuration);
    }

    // Fast in-place DOM update of price & bill without destroying the quantity DOM/animation
    function updateItemAndBillDisplays(id, flavour, newQty) {
        const itemKey = `${id}_${flavour}`;
        const items = window.LiwikaCart.getItems();
        const item = items.find(i => i.id === id && i.flavour === flavour);
        if (!item) return;

        const card = container.querySelector(`.cart-item-card[data-key="${itemKey}"]`);
        if (card) {
            const totalPriceEl = card.querySelector(".item-total-price");
            if (totalPriceEl) {
                totalPriceEl.textContent = `₹${item.price * newQty}`;
            }
        }

        const billLine = container.querySelector(`.bill-row.item-line[data-bill-key="${itemKey}"]`);
        if (billLine) {
            const titleEl = billLine.querySelector(".bill-item-title");
            const subEl = billLine.querySelector(".bill-item-sub");
            if (titleEl) titleEl.textContent = `${item.name} × ${newQty}`;
            if (subEl) subEl.textContent = `₹${item.price * newQty}`;
        }

        const subtotal = window.LiwikaCart.getSubtotal();
        const total = subtotal;

        const subtotalEl = document.getElementById("billSubtotal");
        if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;

        const grandTotalEl = document.getElementById("billGrandTotal");
        if (grandTotalEl) grandTotalEl.textContent = `₹${total}`;

        const payBtn = document.getElementById("payNowBtn");
        if (payBtn) payBtn.textContent = `PROCEED TO PAY ₹${total}`;
    }

    function wireCartEvents() {
        const cards = container.querySelectorAll(".cart-item-card");
        cards.forEach((card) => {
            const id = card.dataset.id;
            const flavour = card.dataset.flavour;
            const itemKey = card.dataset.key;
            const decBtn = card.querySelector(".btn-decrease");
            const incBtn = card.querySelector(".btn-increase");
            const removeBtn = card.querySelector(".cart-item-remove");
            const qtyDisplay = card.querySelector(".item-qty-display");

            if (incBtn) {
                incBtn.addEventListener("click", () => {
                    const items = window.LiwikaCart.getItems();
                    const item = items.find(i => i.id === id && i.flavour === flavour);
                    if (!item) return;
                    const newQty = item.quantity + 1;
                    animateQtySafe(qtyDisplay, itemKey, newQty, "up");
                    window.LiwikaCart.updateQuantity(id, flavour, newQty);
                    updateItemAndBillDisplays(id, flavour, newQty);
                });
            }

            if (decBtn) {
                decBtn.addEventListener("click", () => {
                    const items = window.LiwikaCart.getItems();
                    const item = items.find(i => i.id === id && i.flavour === flavour);
                    if (!item) return;
                    if (item.quantity > 1) {
                        const newQty = item.quantity - 1;
                        animateQtySafe(qtyDisplay, itemKey, newQty, "down");
                        window.LiwikaCart.updateQuantity(id, flavour, newQty);
                        updateItemAndBillDisplays(id, flavour, newQty);
                    } else {
                        // Remove item with smooth transition
                        card.style.transition = "all 0.3s ease";
                        card.style.opacity = "0";
                        card.style.transform = "translateX(30px)";
                        setTimeout(() => {
                            window.LiwikaCart.removeItem(id, flavour);
                            renderCart();
                        }, 300);
                    }
                });
            }

            if (removeBtn) {
                removeBtn.addEventListener("click", () => {
                    card.style.transition = "all 0.3s ease";
                    card.style.opacity = "0";
                    card.style.transform = "translateX(30px)";
                    setTimeout(() => {
                        window.LiwikaCart.removeItem(id, flavour);
                        renderCart();
                    }, 300);
                });
            }
        });

        // Payment option selection
        const payOptions = container.querySelectorAll(".pay-option");
        payOptions.forEach(opt => {
            opt.addEventListener("click", () => {
                payOptions.forEach(o => o.classList.remove("selected"));
                opt.classList.add("selected");
                const radio = opt.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
            });
        });

        const payBtn = document.getElementById("payNowBtn");
        if (payBtn) {
            payBtn.addEventListener("click", () => {
                const checkedRadio = container.querySelector('input[name="pay_method"]:checked');
                const method = checkedRadio ? checkedRadio.value.toUpperCase() : "UPI";
                const total = window.LiwikaCart.getSubtotal();

                payBtn.textContent = "PROCESSING...";
                payBtn.style.opacity = "0.7";
                setTimeout(() => {
                    payBtn.textContent = "PAYMENT INITIATED (" + method + ")";
                    payBtn.style.opacity = "1";
                    setTimeout(() => {
                        payBtn.textContent = "PROCEED TO PAY ₹" + total;
                    }, 2000);
                }, 800);
            });
        }
    }

    renderCart();

    window.addEventListener("cartUpdated", () => {
        // Only re-render completely if card counts mismatch
        const currentCardCount = container.querySelectorAll(".cart-item-card").length;
        const newCount = window.LiwikaCart ? window.LiwikaCart.getItems().length : 0;
        if (currentCardCount !== newCount) {
            renderCart();
        }
    });
});
