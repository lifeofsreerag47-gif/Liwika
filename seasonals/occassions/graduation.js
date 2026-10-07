// ===============================
// GRADUATION PRODUCTS
// ===============================

const graduationProducts = {

    // ===============================
    // DARK INDULGENCE
    // ===============================

    "dark-indulgence": {

        name: "Dark Indulgence",

        description:
            "Rich, smooth dark chocolate crafted to celebrate a proud graduation milestone.",

        basePrice: 49,

        // SAMPLE / DEVELOPMENT DATA
        nutrition: {
            energy: "520 kcal",
            fat: "32 g",
            saturatedFat: "20 g",
            carbohydrates: "52 g",
            sugars: "38 g",
            protein: "7 g"
        },

        // SAMPLE / DEVELOPMENT DATA
        ingredients:
            "Cocoa solids, sugar, cocoa butter, milk solids, natural vanilla flavour",

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


    // ===============================
    // GOLDEN MILK
    // ===============================

    "golden-milk": {

        name: "Golden Milk",

        description:
            "Smooth and creamy milk chocolate made to celebrate a sweet new beginning.",

        basePrice: 69,

        // SAMPLE / DEVELOPMENT DATA
        nutrition: {
            energy: "545 kcal",
            fat: "34 g",
            saturatedFat: "21 g",
            carbohydrates: "54 g",
            sugars: "45 g",
            protein: "8 g"
        },

        // SAMPLE / DEVELOPMENT DATA
        ingredients:
            "Sugar, milk solids, cocoa butter, cocoa solids, natural vanilla flavour",

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


    // ===============================
    // HAZELNUT BLISS
    // ===============================

    "hazelnut-bliss": {

        name: "Hazelnut Bliss",

        description:
            "Luxurious chocolate combined with rich roasted hazelnuts for a memorable graduation celebration.",

        basePrice: 89,

        // SAMPLE / DEVELOPMENT DATA
        nutrition: {
            energy: "560 kcal",
            fat: "37 g",
            saturatedFat: "18 g",
            carbohydrates: "51 g",
            sugars: "39 g",
            protein: "8 g"
        },

        // SAMPLE / DEVELOPMENT DATA
        ingredients:
            "Cocoa solids, sugar, cocoa butter, milk solids, roasted hazelnuts, natural vanilla flavour",

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

const productModal =
    document.getElementById("productModal");

const closeModal =
    document.getElementById("closeModal");

const modalProductImage =
    document.getElementById("modalProductImage");

const modalProductName =
    document.getElementById("modalProductName");

const modalProductDescription =
    document.getElementById("modalProductDescription");
const modalProductIngredients =
    document.getElementById("modalProductIngredients");

const nutritionEnergy =
    document.getElementById("nutritionEnergy");

const nutritionFat =
    document.getElementById("nutritionFat");

const nutritionSaturatedFat =
    document.getElementById("nutritionSaturatedFat");

const nutritionCarbohydrates =
    document.getElementById("nutritionCarbohydrates");

const nutritionSugars =
    document.getElementById("nutritionSugars");

const nutritionProtein =
    document.getElementById("nutritionProtein");

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
        graduationProducts[productKey];


    if (!product) {

        console.error(
            "Product not found:",
            productKey
        );

        return;
    }


    // Save current product

    currentProduct = product;


    // Reset quantity

    currentQuantity = 1;


    // Set starting price

    currentPrice =
        product.basePrice;


    // Select first flavour

    currentFlavour =
        product.flavours[0];



    // ===============================
    // PRODUCT INFORMATION
    // ===============================

    modalProductName.textContent =
        product.name;


    modalProductDescription.textContent =
        product.description;

    // ===============================
// INGREDIENTS
// ===============================

modalProductIngredients.textContent =
    product.ingredients;


// ===============================
// NUTRITION INFORMATION
// ===============================

nutritionEnergy.textContent =
    product.nutrition.energy;

nutritionFat.textContent =
    product.nutrition.fat;

nutritionSaturatedFat.textContent =
    product.nutrition.saturatedFat;

nutritionCarbohydrates.textContent =
    product.nutrition.carbohydrates;

nutritionSugars.textContent =
    product.nutrition.sugars;

nutritionProtein.textContent =
    product.nutrition.protein;


    modalProductImage.src =
        currentFlavour.image;


    modalProductImage.alt =
        product.name;



    // ===============================
    // QUANTITY
    // ===============================

    quantity.textContent =
        currentQuantity;



    // ===============================
    // PRICE
    // ===============================

    modalProductPrice.textContent =
        `₹${currentPrice}`;



    // ===============================
    // FLAVOURS
    // ===============================

    displayFlavours(
        product.flavours
    );



    // ===============================
    // OPEN MODAL
    // ===============================

    productModal.classList.add("active");


    productModal.setAttribute(
        "aria-hidden",
        "false"
    );


    // Prevent background scrolling

    document.body.style.overflow =
        "hidden";

}



// ===============================
// DISPLAY FLAVOURS
// ===============================

function displayFlavours(flavours) {

    flavourOptions.innerHTML = "";


    flavours.forEach(
        (flavour, index) => {

            const button =
                document.createElement("button");


            button.classList.add(
                "flavour-button"
            );


            button.textContent =
                flavour.name;



            // ===============================
            // FIRST FLAVOUR SELECTED
            // ===============================

            if (index === 0) {

                button.classList.add(
                    "selected"
                );

            }



            // ===============================
            // FLAVOUR CLICK
            // ===============================

            button.addEventListener(
                "click",
                function () {

                    // Change current flavour

                    currentFlavour =
                        flavour;


                    // Change product image

                    modalProductImage.src =
                        flavour.image;



                    // Remove selected state

                    document
                        .querySelectorAll(
                            ".flavour-button"
                        )
                        .forEach(btn => {

                            btn.classList.remove(
                                "selected"
                            );

                        });



                    // Add selected state
                    // to clicked button

                    button.classList.add(
                        "selected"
                    );

                }
            );


            flavourOptions.appendChild(
                button
            );

        }
    );

}



// ===============================
// INCREASE QUANTITY
// ===============================

increaseQuantity.addEventListener(
    "click",
    function () {

        if (!currentProduct) {
            return;
        }


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

        if (!currentProduct) {
            return;
        }


        // Quantity cannot go below 1

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
// CLOSE PRODUCT MODAL
// ===============================

function closeProductModal() {

    productModal.classList.remove(
        "active"
    );


    productModal.setAttribute(
        "aria-hidden",
        "true"
    );


    // Allow page scrolling again

    document.body.style.overflow =
        "";


    // Reset current product

    currentProduct =
        null;


    currentQuantity =
        1;

}



// ===============================
// CLOSE BUTTON
// ===============================

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

        const occasionEl =
            document.querySelector(
                ".occasion-label"
            );


        const occasionName =
            window.occasionTitle ||
            (
                occasionEl
                    ? occasionEl.textContent.trim()
                    : "GRADUATION"
            );



        // ===============================
        // CREATE CART ITEM
        // ===============================

        const cartItem = {

            id:
                currentProduct.name
                    ? currentProduct.name
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                    : "prod",


            name:
                currentProduct.name,


            flavour:
                currentFlavour.name,


            quantity:
                currentQuantity,


            price:
                currentProduct.basePrice ||
                currentPrice,


            image:
                currentFlavour.image,


            occasion:
                occasionName

        };



        // ===============================
        // TEMPORARY CART ACTION
        // ===============================

        console.log(
            "Added to cart:",
            cartItem
        );



        // ===============================
        // BUTTON FEEDBACK
        // ===============================

        const originalText =
            modalAddToCart.textContent;


        modalAddToCart.textContent =
            "✓ ADDED!";



        setTimeout(
            () => {

                modalAddToCart.textContent =
                    originalText;


                closeProductModal();

            },
            700
        );

    }
);