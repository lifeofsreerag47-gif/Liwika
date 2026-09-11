/* =========================================
   BIRTHDAY PRODUCTS DATA
========================================= */

const birthdayProducts = {

    "dark-indulgence": {
        name: "Dark Indulgence",
        description: "Rich dark chocolate crafted for a sophisticated birthday treat.",
        basePrice: 499,
        flavours: [
            {
                name: "Classic Dark",
                image: "../../images/choco1.jpg"
            },
            {
                name: "Orange Dark",
                image: "../../images/choco1.jpg"
            },
            {
                name: "Sea Salt Dark",
                image: "../../images/choco1.jpg"
            }
        ]
    },

    "golden-milk": {
        name: "Golden Milk",
        description: "Smooth and creamy chocolate made for a little birthday luxury.",
        basePrice: 699,
        flavours: [
            {
                name: "Classic Milk",
                image: "../../images/choco2.jpg"
            },
            {
                name: "Caramel Milk",
                image: "../../images/choco2.jpg"
            },
            {
                name: "Vanilla Milk",
                image: "../../images/choco2.jpg"
            }
        ]
    },

    "hazelnut-bliss": {
        name: "Hazelnut Bliss",
        description: "Velvety chocolate combined with roasted hazelnuts for a joyful celebration.",
        basePrice: 899,
        flavours: [
            {
                name: "Classic Hazelnut",
                image: "../../images/choco3.jpg"
            },
            {
                name: "Roasted Hazelnut",
                image: "../../images/choco3.jpg"
            },
            {
                name: "Hazelnut Crunch",
                image: "../../images/choco3.jpg"
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
let priceAnimationTimeouts = [];

/* =========================================
   QUANTITY ROLLING ANIMATION
========================================= */

function setQuantityDisplay(val, animate = false, direction = "up") {
    if (!quantityElement) return;

    if (!animate) {
        if (qtyAnimationTimeout) {
            clearTimeout(qtyAnimationTimeout);
            qtyAnimationTimeout = null;
        }
        quantityElement.innerHTML = `<span class="qty-digit current">${val}</span>`;
        return;
    }

    if (qtyAnimationTimeout) {
        clearTimeout(qtyAnimationTimeout);
        qtyAnimationTimeout = null;
    }

    const currentDigit = quantityElement.querySelector(".qty-digit.current") || quantityElement.querySelector(".qty-digit");
    const incomingDigit = document.createElement("span");
    incomingDigit.className = "qty-digit incoming";
    incomingDigit.textContent = val;

    // Set initial position
    if (direction === "up") {
        incomingDigit.style.transform = "translateY(100%)";
    } else {
        incomingDigit.style.transform = "translateY(-100%)";
    }
    incomingDigit.style.opacity = "0";

    quantityElement.appendChild(incomingDigit);

    // Force reflow
    void incomingDigit.offsetHeight;

    const animCurve = "transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease";
    incomingDigit.style.transition = animCurve;
    if (currentDigit) {
        currentDigit.style.transition = animCurve;
    }

    requestAnimationFrame(() => {
        incomingDigit.style.transform = "translateY(0)";
        incomingDigit.style.opacity = "1";
        if (currentDigit) {
            currentDigit.style.transform = direction === "up" ? "translateY(-100%)" : "translateY(100%)";
            currentDigit.style.opacity = "0";
        }
    });

    qtyAnimationTimeout = setTimeout(() => {
        quantityElement.innerHTML = `<span class="qty-digit current">${val}</span>`;
        qtyAnimationTimeout = null;
    }, 350);
}

/* =========================================
   CASCADING DIGIT-BY-DIGIT PRICE ANIMATION
========================================= */

function setPriceDisplay(newPrice, animate = false, direction = "up") {
    if (!modalProductPrice) return;

    const newStr = String(newPrice);
    const oldStr = String(currentPrice || newPrice);

    if (!animate) {
        priceAnimationTimeouts.forEach(t => clearTimeout(t));
        priceAnimationTimeouts = [];

        let slotsHtml = "";
        for (let i = 0; i < newStr.length; i++) {
            slotsHtml += `<span class="digit-slot" data-digit-index="${i}"><span class="digit-val current">${newStr[i]}</span></span>`;
        }
        modalProductPrice.innerHTML = `<span class="price-currency">₹</span><span class="price-digits">${slotsHtml}</span>`;
        currentPrice = newPrice;
        return;
    }

    priceAnimationTimeouts.forEach(t => clearTimeout(t));
    priceAnimationTimeouts = [];

    let digitsContainer = modalProductPrice.querySelector(".price-digits");
    if (!digitsContainer) {
        setPriceDisplay(currentPrice || newPrice, false);
        digitsContainer = modalProductPrice.querySelector(".price-digits");
    }

    // Synchronize slot elements if digit count changed
    let slots = Array.from(digitsContainer.querySelectorAll(".digit-slot"));
    if (slots.length !== newStr.length) {
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

    let maxDelay = 0;
    let changedCount = 0;

    // Compare each place-value from right to left (place 0 = ones, place 1 = tens, place 2 = hundreds...)
    for (let place = 0; place < newStr.length; place++) {
        const slotIdx = newStr.length - 1 - place;
        const slotEl = slots[slotIdx];
        if (!slotEl) continue;

        const newDigit = newStr[slotIdx];
        const oldSlotIdx = oldStr.length - 1 - place;
        const oldDigit = oldSlotIdx >= 0 ? oldStr[oldSlotIdx] : null;

        // If the digit did not change, it remains completely steady
        if (oldDigit === newDigit) {
            continue;
        }

        // Staggered cascade: first ones place (0ms), followed by tens (75ms), hundreds (150ms)...
        const delay = changedCount * 75;
        changedCount++;
        if (delay > maxDelay) maxDelay = delay;

        const currentValEl = slotEl.querySelector(".digit-val.current") || slotEl.querySelector(".digit-val");
        const incomingValEl = document.createElement("span");
        incomingValEl.className = "digit-val incoming";
        incomingValEl.textContent = newDigit;

        if (direction === "up") {
            incomingValEl.style.transform = "translateY(100%)";
        } else {
            incomingValEl.style.transform = "translateY(-100%)";
        }
        incomingValEl.style.opacity = "0";

        slotEl.appendChild(incomingValEl);
        void incomingValEl.offsetHeight; // Trigger reflow

        const transitionSpec = `transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, opacity 0.28s ease ${delay}ms`;
        incomingValEl.style.transition = transitionSpec;
        if (currentValEl) {
            currentValEl.style.transition = transitionSpec;
        }

        const animTimeout = setTimeout(() => {
            incomingValEl.style.transform = "translateY(0)";
            incomingValEl.style.opacity = "1";
            if (currentValEl) {
                currentValEl.style.transform = direction === "up" ? "translateY(-100%)" : "translateY(100%)";
                currentValEl.style.opacity = "0";
            }
        }, 15);
        priceAnimationTimeouts.push(animTimeout);
    }

    // Final cleanup after all cascading animations complete
    const totalDuration = maxDelay + 400;
    const finalCleanupTimeout = setTimeout(() => {
        let slotsHtml = "";
        for (let i = 0; i < newStr.length; i++) {
            slotsHtml += `<span class="digit-slot" data-digit-index="${i}"><span class="digit-val current">${newStr[i]}</span></span>`;
        }
        digitsContainer.innerHTML = slotsHtml;
        currentPrice = newPrice;
    }, totalDuration);
    priceAnimationTimeouts.push(finalCleanupTimeout);

    currentPrice = newPrice;
}

/* =========================================
   OPEN PRODUCT MODAL
========================================= */

const productCards = document.querySelectorAll(".occasion-product");

productCards.forEach(card => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
        const productId = card.dataset.product;
        if (productId && birthdayProducts[productId]) {
            openProductModal(productId);
        }
    });
});

/* =========================================
   OPEN MODAL FUNCTION
========================================= */

function openProductModal(productId) {
    if (!productModal || !birthdayProducts[productId]) return;

    currentProduct = birthdayProducts[productId];
    currentQuantity = 1;
    currentFlavour = currentProduct.flavours[0];
    currentPrice = currentProduct.basePrice;

    if (modalProductName) {
        modalProductName.textContent = currentProduct.name;
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