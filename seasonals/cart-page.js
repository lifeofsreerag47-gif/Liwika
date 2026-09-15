/* =====================================================
   LIWI-KA CART PAGE CONTROLLER
   Renders product cards with rapid-click-safe rolling animations,
   occasion badges, per-item gift wrapping option (+₹50),
   personalized message box, and itemized bill summary.
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("cartContainer");
    if (!container) return;

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

        const subtotal = window.LiwikaCart.getSubtotal();
        const giftingTotal = window.LiwikaCart.getGiftWrappingTotal();
        const shipping = 0; // Complimentary luxury delivery
        const total = subtotal + giftingTotal + shipping;

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
            const itemOccasion = item.occasion || '';
            const itemKey = `${item.id}_${item.flavour}_${itemOccasion}`;

            const occasionBadgeHtml = itemOccasion 
                ? `<div class="cart-item-occasion-tag">✦ Occasion: ${itemOccasion}</div>` 
                : '';

            const isWrapped = Boolean(item.isGiftWrapped);
            const giftMsg = item.giftMessage || '';

            itemsHtml += `
                <div class="cart-item-card" data-key="${itemKey}" data-id="${item.id}" data-flavour="${item.flavour}" data-occasion="${itemOccasion}">
                    <div class="cart-item-image">
                        <img src="${imgSrc}" alt="${item.name}">
                    </div>

                    <div class="cart-item-details">
                        <div class="cart-item-top">
                            <div>
                                <h3>${item.name}</h3>
                                <p class="cart-item-flavour">${item.flavour}</p>
                                ${occasionBadgeHtml}
                            </div>
                            <button class="cart-item-remove" type="button" aria-label="Remove item" title="Remove item">
                                ✕
                            </button>
                        </div>

                        <!-- GIFT WRAPPING SECTION -->
                        <div class="cart-item-gifting-container">
                            <label class="gift-checkbox-label">
                                <input type="checkbox" class="gift-wrap-checkbox" ${isWrapped ? 'checked' : ''}>
                                <span>🎁 Gift wrapping <span class="gift-badge-price">(+ ₹50)</span></span>
                            </label>
                            <div class="gift-message-box ${isWrapped ? 'active' : ''}">
                                <textarea class="gift-message-input" placeholder="Write your personalized gift message here..." maxlength="200">${giftMsg}</textarea>
                            </div>
                        </div>

                        <div class="cart-item-bottom" style="margin-top: 15px;">
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
            const itemOccasion = item.occasion || '';
            const itemKey = `${item.id}_${item.flavour}_${itemOccasion}`;
            billRowsHtml += `
                <div class="bill-row item-line" data-bill-key="${itemKey}">
                    <div class="bill-item-name">
                        <span class="bill-item-title">${item.name} × ${item.quantity}</span>
                        <span class="bill-item-flavour">${item.flavour}${itemOccasion ? ' (' + itemOccasion + ')' : ''}</span>
                    </div>
                    <span class="bill-item-sub">₹${item.price * item.quantity}</span>
                </div>
            `;
        });

        const giftRowHtml = giftingTotal > 0 ? `
            <div class="bill-row" id="billGiftWrappingRow">
                <span>Gift Wrapping Fee (+₹50)</span>
                <span style="color: #d9a441; font-weight: 600;">₹${giftingTotal}</span>
            </div>
        ` : '';

        const summaryHtml = `
            <div class="cart-summary-card">
                <h2>Bill Details</h2>

                <div class="bill-rows" id="billRowsContainer">
                    ${billRowsHtml}

                    <div class="bill-row" style="margin-top: 8px;">
                        <span>Item Subtotal</span>
                        <span id="billSubtotal">₹${subtotal}</span>
                    </div>

                    ${giftRowHtml}

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

        const incomingEl = qtyEl.querySelector(".qty-digit.incoming");
        const currentEl = qtyEl.querySelector(".qty-digit.current") || qtyEl.querySelector(".qty-digit");
        const baselineVal = incomingEl ? incomingEl.textContent : (currentEl ? currentEl.textContent : String(newVal));

        qtyEl.innerHTML = `<span class="qty-digit current">${baselineVal}</span>`;

        if (baselineVal === String(newVal)) return;

        const currentDigit = qtyEl.firstElementChild;
        const incomingDigit = document.createElement("span");
        incomingDigit.className = "qty-digit incoming";
        incomingDigit.textContent = newVal;

        incomingDigit.style.transform = direction === "up" ? "translateY(100%)" : "translateY(-100%)";
        incomingDigit.style.opacity = "0";
        qtyEl.appendChild(incomingDigit);

        void incomingDigit.offsetHeight;

        const animDuration = isRapid ? "0.16s" : "0.28s";
        const animCurve = `transform ${animDuration} cubic-bezier(0.16, 1, 0.3, 1), opacity ${animDuration} ease`;
        incomingDigit.style.transition = animCurve;
        if (currentDigit) currentDigit.style.transition = animCurve;

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

    function updateItemAndBillDisplays(id, flavour, occasion, newQty) {
        const itemOccasion = occasion || '';
        const itemKey = `${id}_${flavour}_${itemOccasion}`;
        const items = window.LiwikaCart.getItems();
        const item = items.find(i => i.id === id && i.flavour === flavour && (i.occasion || '') === itemOccasion);
        
        if (item && newQty !== undefined) {
            const card = container.querySelector(`.cart-item-card[data-key="${itemKey}"]`);
            if (card) {
                const totalPriceEl = card.querySelector(".item-total-price");
                if (totalPriceEl) totalPriceEl.textContent = `₹${item.price * newQty}`;
            }

            const billLine = container.querySelector(`.bill-row.item-line[data-bill-key="${itemKey}"]`);
            if (billLine) {
                const titleEl = billLine.querySelector(".bill-item-title");
                const subEl = billLine.querySelector(".bill-item-sub");
                if (titleEl) titleEl.textContent = `${item.name} × ${newQty}`;
                if (subEl) subEl.textContent = `₹${item.price * newQty}`;
            }
        }

        const subtotal = window.LiwikaCart.getSubtotal();
        const giftingTotal = window.LiwikaCart.getGiftWrappingTotal();
        const total = subtotal + giftingTotal;

        const subtotalEl = document.getElementById("billSubtotal");
        if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;

        let giftRowEl = document.getElementById("billGiftWrappingRow");
        const billRowsContainer = document.getElementById("billRowsContainer");

        if (giftingTotal > 0) {
            if (!giftRowEl && billRowsContainer) {
                giftRowEl = document.createElement("div");
                giftRowEl.id = "billGiftWrappingRow";
                giftRowEl.className = "bill-row";
                const subtotalRow = subtotalEl ? subtotalEl.closest(".bill-row") : null;
                if (subtotalRow && subtotalRow.nextSibling) {
                    billRowsContainer.insertBefore(giftRowEl, subtotalRow.nextSibling);
                } else {
                    billRowsContainer.appendChild(giftRowEl);
                }
            }
            if (giftRowEl) {
                giftRowEl.innerHTML = `<span>Gift Wrapping Fee (+₹50)</span><span style="color: #d9a441; font-weight: 600;">₹${giftingTotal}</span>`;
            }
        } else if (giftRowEl) {
            giftRowEl.remove();
        }

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
            const occasion = card.dataset.occasion || '';
            const itemKey = card.dataset.key;
            const decBtn = card.querySelector(".btn-decrease");
            const incBtn = card.querySelector(".btn-increase");
            const removeBtn = card.querySelector(".cart-item-remove");
            const qtyDisplay = card.querySelector(".item-qty-display");
            const giftCheckbox = card.querySelector(".gift-wrap-checkbox");
            const giftMsgBox = card.querySelector(".gift-message-box");
            const giftMsgInput = card.querySelector(".gift-message-input");

            if (incBtn) {
                incBtn.addEventListener("click", () => {
                    const items = window.LiwikaCart.getItems();
                    const item = items.find(i => i.id === id && i.flavour === flavour && (i.occasion || '') === occasion);
                    if (!item) return;
                    const newQty = item.quantity + 1;
                    animateQtySafe(qtyDisplay, itemKey, newQty, "up");
                    window.LiwikaCart.updateQuantity(id, flavour, occasion, newQty);
                    updateItemAndBillDisplays(id, flavour, occasion, newQty);
                });
            }

            if (decBtn) {
                decBtn.addEventListener("click", () => {
                    const items = window.LiwikaCart.getItems();
                    const item = items.find(i => i.id === id && i.flavour === flavour && (i.occasion || '') === occasion);
                    if (!item) return;
                    if (item.quantity > 1) {
                        const newQty = item.quantity - 1;
                        animateQtySafe(qtyDisplay, itemKey, newQty, "down");
                        window.LiwikaCart.updateQuantity(id, flavour, occasion, newQty);
                        updateItemAndBillDisplays(id, flavour, occasion, newQty);
                    } else {
                        card.style.transition = "all 0.3s ease";
                        card.style.opacity = "0";
                        card.style.transform = "translateX(30px)";
                        setTimeout(() => {
                            window.LiwikaCart.removeItem(id, flavour, occasion);
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
                        window.LiwikaCart.removeItem(id, flavour, occasion);
                        renderCart();
                    }, 300);
                });
            }

            if (giftCheckbox) {
                giftCheckbox.addEventListener("change", () => {
                    const isChecked = giftCheckbox.checked;
                    if (isChecked) {
                        giftMsgBox.classList.add("active");
                    } else {
                        giftMsgBox.classList.remove("active");
                    }
                    window.LiwikaCart.updateGifting(id, flavour, occasion, isChecked, giftMsgInput ? giftMsgInput.value : '');
                    updateItemAndBillDisplays(id, flavour, occasion);
                });
            }

            if (giftMsgInput) {
                giftMsgInput.addEventListener("input", () => {
                    const isChecked = giftCheckbox ? giftCheckbox.checked : true;
                    window.LiwikaCart.updateGifting(id, flavour, occasion, isChecked, giftMsgInput.value);
                });
            }
        });

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
                const total = window.LiwikaCart.getSubtotal() + window.LiwikaCart.getGiftWrappingTotal();

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
        const currentCardCount = container.querySelectorAll(".cart-item-card").length;
        const newCount = window.LiwikaCart ? window.LiwikaCart.getItems().length : 0;
        if (currentCardCount !== newCount) {
            renderCart();
        }
    });
});
