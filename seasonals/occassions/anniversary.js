// ===============================
// ANNIVERSARY PRODUCTS
// ===============================

const anniversaryProducts = {

    "dark-indulgence": {
        name: "Dark Indulgence",
        description: "Rich, smooth dark chocolate crafted for an elegant anniversary celebration.",
        basePrice: 49,

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
        description: "Smooth and creamy milk chocolate made to make your special moments sweeter.",
        basePrice: 69,

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
        description: "Luxurious chocolate combined with rich roasted hazelnuts for a memorable celebration.",
        basePrice: 89,

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


// ===============================
// GET MODAL ELEMENTS
// ===============================

const productModal = document.getElementById("productModal");
const closeModal = document.getElementById("closeModal");

const modalProductImage =
    document.getElementById("modalProductImage");

const modalProductName =
    document.getElementById("modalProductName");

const modalProductDescription =
    document.getElementById("modalProductDescription");

const flavourOptions =
    document.getElementById("flavourOptions");

const quantity =
    document.getElementById("quantity");

const increaseQuantity =
    document.getElementById("increaseQuantity");

const decreaseQuantity =
    document.getElementById("decreaseQuantity");

const modalProductPrice =
    document.getElementById("modalProductPrice");

const modalAddToCart =
    document.getElementById("modalAddToCart");


// ===============================
// CURRENT PRODUCT INFORMATION
// ===============================

let currentProduct = null;
let currentFlavour = null;
let currentQuantity = 1;
let currentPrice = 0;


// ===============================
// PRODUCT CARDS
// ===============================

const productCards =
    document.querySelectorAll(".occasion-product");

productCards.forEach(card => {

    card.addEventListener("click", function () {

        const productKey =
            card.dataset.product;

        if (!productKey) {
            console.error(
                "This product card is missing data-product."
            );
            return;
        }

        openProductModal(productKey);
    });

});


// ===============================
// OPEN PRODUCT MODAL
// ===============================

function openProductModal(productKey) {

    const product =
        anniversaryProducts[productKey];

    if (!product) {
        console.error(
            "Product not found:",
            productKey
        );
        return;
    }

    currentProduct = product;
    currentQuantity = 1;
    currentPrice = product.basePrice;

    currentFlavour = product.flavours[0];


    // Product information

    modalProductName.textContent =
        product.name;

    modalProductDescription.textContent =
        product.description;

    modalProductImage.src =
        currentFlavour.image;

    modalProductImage.alt =
        product.name;


    // Quantity

    quantity.textContent =
        currentQuantity;


    // Price

    modalProductPrice.textContent =
        `₹${currentPrice}`;


    // Flavours

    displayFlavours(product.flavours);


    // Open modal

    productModal.classList.add("active");

    productModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";
}


// ===============================
// DISPLAY FLAVOURS
// ===============================

function displayFlavours(flavours) {

    flavourOptions.innerHTML = "";

    flavours.forEach((flavour, index) => {

        const button =
            document.createElement("button");

        button.classList.add(
            "flavour-button"
        );

        button.textContent =
            flavour.name;


        // First flavour selected

        if (index === 0) {
            button.classList.add("selected");
        }


        // Flavour click

        button.addEventListener(
            "click",
            function () {

                currentFlavour =
                    flavour;


                modalProductImage.src =
                    flavour.image;


                // Remove selected from all buttons

                document
                    .querySelectorAll(
                        ".flavour-button"
                    )
                    .forEach(btn => {
                        btn.classList.remove(
                            "selected"
                        );
                    });


                // Select clicked button

                button.classList.add(
                    "selected"
                );
            }
        );


        flavourOptions.appendChild(
            button
        );
    });
}


// ===============================
// INCREASE QUANTITY
// ===============================

increaseQuantity.addEventListener(
    "click",
    function () {

        if (!currentProduct) return;

        currentQuantity++;

        quantity.textContent =
            currentQuantity;

        updatePrice();
    }
);


// ===============================
// DECREASE QUANTITY
// ===============================

decreaseQuantity.addEventListener(
    "click",
    function () {

        if (!currentProduct) return;

        if (currentQuantity > 1) {

            currentQuantity--;

            quantity.textContent =
                currentQuantity;

            updatePrice();
        }
    }
);


// ===============================
// UPDATE PRICE
// ===============================

function updatePrice() {

    currentPrice =
        currentProduct.basePrice *
        currentQuantity;

    modalProductPrice.textContent =
        `₹${currentPrice}`;
}


// ===============================
// CLOSE MODAL
// ===============================

function closeProductModal() {

    productModal.classList.remove(
        "active"
    );

    productModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow = "";

    currentProduct = null;
    currentQuantity = 1;
}


closeModal.addEventListener(
    "click",
    closeProductModal
);


// ===============================
// CLOSE WHEN CLICKING OUTSIDE
// ===============================

productModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target === productModal
        ) {
            closeProductModal();
        }

    }
);


// ===============================
// CLOSE WITH ESCAPE KEY
// ===============================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            productModal.classList.contains(
                "active"
            )
        ) {
            closeProductModal();
        }

    }
);


// ===============================
// ADD TO CART
// ===============================

modalAddToCart.addEventListener(
    "click",
    function () {

        const occasionEl = document.querySelector(".occasion-label");
        const occasionName = window.occasionTitle || (occasionEl ? occasionEl.textContent.trim() : 'ANNIVERSARY');

        const cartItem = {

            id: currentProduct.name ? currentProduct.name.toLowerCase().replace(/\s+/g, '-') : 'prod',

            name: currentProduct.name,

            flavour: currentFlavour.name,

            quantity: currentQuantity,

            price: currentProduct.basePrice || currentPrice,

            image: currentFlavour.image,

            occasion: occasionName
        };


        // Temporary for now

        console.log(
            "Added to cart:",
            cartItem
        );


        // Button feedback

        const originalText =
            modalAddToCart.textContent;

        modalAddToCart.textContent =
            "✓ ADDED!";


        setTimeout(() => {

            modalAddToCart.textContent =
                originalText;

            closeProductModal();

        }, 700);

    }
);
