// ======================================================
// VALENTINE'S PRODUCTS
// ======================================================

const valentinesProducts = {

    // ==================================================
    // DARK INDULGENCE
    // ==================================================

    "dark-indulgence": {

        name: "Dark Indulgence",

        description:
            "Rich, smooth dark chocolate crafted for a thoughtful and unforgettable Valentine's moment.",

        basePrice: 49,

        // ------------------------------
        // NUTRITION
        // ------------------------------

        nutrition: {

            energy: "520 kcal",

            fat: "32 g",

            saturatedFat: "20 g",

            carbohydrates: "52 g",

            sugars: "38 g",

            protein: "7 g"
        },

        // ------------------------------
        // INGREDIENTS
        // ------------------------------

        ingredients:
            "Cocoa solids, sugar, cocoa butter, milk solids, natural vanilla flavour",

        // ------------------------------
        // FLAVOURS
        // ------------------------------

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


    // ==================================================
    // GOLDEN MILK
    // ==================================================

    "golden-milk": {

        name: "Golden Milk",

        description:
            "Smooth and creamy milk chocolate made to add a little sweetness to Valentine's celebrations.",

        basePrice: 69,

        // ------------------------------
        // NUTRITION
        // ------------------------------

        nutrition: {

            energy: "545 kcal",

            fat: "34 g",

            saturatedFat: "21 g",

            carbohydrates: "54 g",

            sugars: "45 g",

            protein: "8 g"
        },

        // ------------------------------
        // INGREDIENTS
        // ------------------------------

        ingredients:
            "Sugar, milk solids, cocoa butter, cocoa solids, natural vanilla flavour",

        // ------------------------------
        // FLAVOURS
        // ------------------------------

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


    // ==================================================
    // HAZELNUT BLISS
    // ==================================================

    "hazelnut-bliss": {

        name: "Hazelnut Bliss",

        description:
            "Luxurious chocolate with rich roasted hazelnuts, created for a special Valentine's indulgence.",

        basePrice: 89,

        // ------------------------------
        // NUTRITION
        // ------------------------------

        nutrition: {

            energy: "560 kcal",

            fat: "37 g",

            saturatedFat: "18 g",

            carbohydrates: "51 g",

            sugars: "39 g",

            protein: "8 g"
        },

        // ------------------------------
        // INGREDIENTS
        // ------------------------------

        ingredients:
            "Cocoa solids, sugar, cocoa butter, milk solids, roasted hazelnuts, natural vanilla flavour",

        // ------------------------------
        // FLAVOURS
        // ------------------------------

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



// ======================================================
// GET MODAL ELEMENTS
// ======================================================

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

const flavourOptions =
    document.getElementById("flavourOptions");

const modalProductIngredients =
    document.getElementById("modalProductIngredients");



// ======================================================
// NUTRITION ELEMENTS
// ======================================================

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



// ======================================================
// QUANTITY + PRICE ELEMENTS
// ======================================================

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



// ======================================================
// CURRENT PRODUCT INFORMATION
// ======================================================

let currentProduct = null;

let currentFlavour = null;

let currentQuantity = 1;

let currentPrice = 0;



// ======================================================
// PRODUCT CARDS
// ======================================================

const productCards =
    document.querySelectorAll(".occasion-product");


productCards.forEach(card => {

    // Make entire card clickable
    card.style.cursor = "pointer";


    card.addEventListener("click", function () {

        const productKey =
            card.dataset.product;


        // Check data-product
        if (!productKey) {

            console.error(
                "This product card is missing data-product."
            );

            return;
        }


        // Open product modal
        openProductModal(productKey);

    });

});



// ======================================================
// OPEN PRODUCT MODAL
// ======================================================

function openProductModal(productKey) {

    const product =
        valentinesProducts[productKey];


    // Check product exists
    if (!product) {

        console.error(
            "Product not found:",
            productKey
        );

        return;
    }


    // ----------------------------------------------
    // Set current product
    // ----------------------------------------------

    currentProduct =
        product;


    // ----------------------------------------------
    // Reset quantity
    // ----------------------------------------------

    currentQuantity =
        1;


    // ----------------------------------------------
    // Set starting price
    // ----------------------------------------------

    currentPrice =
        product.basePrice;


    // ----------------------------------------------
    // Select first flavour
    // ----------------------------------------------

    currentFlavour =
        product.flavours[0];



    // ==================================================
    // PRODUCT INFORMATION
    // ==================================================

    if (modalProductName) {

        modalProductName.textContent =
            product.name;

    }


    if (modalProductDescription) {

        modalProductDescription.textContent =
            product.description;

    }



    // ==================================================
    // PRODUCT IMAGE
    // ==================================================

    if (modalProductImage) {

        modalProductImage.src =
            currentFlavour.image;

        modalProductImage.alt =
            product.name;

    }



    // ==================================================
    // INGREDIENTS
    // ==================================================

    if (modalProductIngredients) {

        modalProductIngredients.textContent =
            product.ingredients;

    }



    // ==================================================
    // NUTRITION INFORMATION
    // ==================================================

    if (nutritionEnergy) {

        nutritionEnergy.textContent =
            product.nutrition.energy;

    }


    if (nutritionFat) {

        nutritionFat.textContent =
            product.nutrition.fat;

    }


    if (nutritionSaturatedFat) {

        nutritionSaturatedFat.textContent =
            product.nutrition.saturatedFat;

    }


    if (nutritionCarbohydrates) {

        nutritionCarbohydrates.textContent =
            product.nutrition.carbohydrates;

    }


    if (nutritionSugars) {

        nutritionSugars.textContent =
            product.nutrition.sugars;

    }


    if (nutritionProtein) {

        nutritionProtein.textContent =
            product.nutrition.protein;

    }



    // ==================================================
    // QUANTITY
    // ==================================================

    if (quantity) {

        quantity.textContent =
            currentQuantity;

    }



    // ==================================================
    // PRICE
    // ==================================================

    if (modalProductPrice) {

        modalProductPrice.textContent =
            `₹${currentPrice}`;

    }



    // ==================================================
    // DISPLAY FLAVOURS
    // ==================================================

    displayFlavours(
        product.flavours
    );



    // ==================================================
    // OPEN MODAL
    // ==================================================

    if (productModal) {

        productModal.classList.add("active");

        productModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";

    }

}



// ======================================================
// DISPLAY FLAVOURS
// ======================================================

function displayFlavours(flavours) {

    if (!flavourOptions) return;


    // Clear previous buttons
    flavourOptions.innerHTML = "";


    flavours.forEach((flavour, index) => {


        // ----------------------------------------------
        // Create button
        // ----------------------------------------------

        const button =
            document.createElement("button");


        button.type =
            "button";


        button.classList.add(
            "flavour-button"
        );


        button.textContent =
            flavour.name;



        // ----------------------------------------------
        // First flavour selected
        // ----------------------------------------------

        if (index === 0) {

            button.classList.add(
                "selected"
            );

        }



        // ----------------------------------------------
        // Flavour click
        // ----------------------------------------------

        button.addEventListener(
            "click",
            function (event) {

                // Prevent card click
                event.stopPropagation();


                // Set selected flavour
                currentFlavour =
                    flavour;


                // Change image
                if (modalProductImage) {

                    modalProductImage.src =
                        flavour.image;

                }


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
                button.classList.add(
                    "selected"
                );

            }
        );



        // ----------------------------------------------
        // Add button to container
        // ----------------------------------------------

        flavourOptions.appendChild(
            button
        );

    });

}



// ======================================================
// INCREASE QUANTITY
// ======================================================

if (increaseQuantity) {

    increaseQuantity.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            // No product selected
            if (!currentProduct) return;


            // Increase quantity
            currentQuantity++;


            // Update quantity display
            if (quantity) {

                quantity.textContent =
                    currentQuantity;

            }


            // Update price
            updatePrice();

        }
    );

}



// ======================================================
// DECREASE QUANTITY
// ======================================================

if (decreaseQuantity) {

    decreaseQuantity.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            // No product selected
            if (!currentProduct) return;


            // Don't allow below 1
            if (currentQuantity > 1) {

                currentQuantity--;


                // Update quantity display
                if (quantity) {

                    quantity.textContent =
                        currentQuantity;

                }


                // Update price
                updatePrice();

            }

        }
    );

}



// ======================================================
// UPDATE PRICE
// ======================================================

function updatePrice() {

    if (!currentProduct) return;


    currentPrice =
        currentProduct.basePrice *
        currentQuantity;


    if (modalProductPrice) {

        modalProductPrice.textContent =
            `₹${currentPrice}`;

    }

}



// ======================================================
// CLOSE PRODUCT MODAL
// ======================================================

function closeProductModal() {

    if (!productModal) return;


    // Remove active class
    productModal.classList.remove(
        "active"
    );


    // Accessibility
    productModal.setAttribute(
        "aria-hidden",
        "true"
    );


    // Allow scrolling
    document.body.style.overflow =
        "";


    // Reset product
    currentProduct =
        null;


    // Reset quantity
    currentQuantity =
        1;


    // Reset flavour
    currentFlavour =
        null;


    // Reset price
    currentPrice =
        0;

}



// ======================================================
// CLOSE BUTTON
// ======================================================

if (closeModal) {

    closeModal.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            closeProductModal();

        }
    );

}



// ======================================================
// CLOSE WHEN CLICKING OUTSIDE
// ======================================================

if (productModal) {

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

}



// ======================================================
// CLOSE WITH ESCAPE KEY
// ======================================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            productModal &&
            productModal.classList.contains(
                "active"
            )
        ) {

            closeProductModal();

        }

    }
);



// ======================================================
// ADD TO CART
// ======================================================

if (modalAddToCart) {

    modalAddToCart.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            // Make sure product + flavour exist
            if (
                !currentProduct ||
                !currentFlavour
            ) {

                return;

            }



            // ------------------------------------------
            // Get occasion name
            // ------------------------------------------

            const occasionEl =
                document.querySelector(
                    ".occasion-label"
                );


            const occasionName =
                window.occasionTitle ||
                (
                    occasionEl
                        ? occasionEl.textContent.trim()
                        : "VALENTINE'S"
                );



            // ------------------------------------------
            // Create cart item
            // ------------------------------------------

            const cartItem = {

                id:
                    currentProduct.name
                        .toLowerCase()
                        .replace(/\s+/g, "-"),

                name:
                    currentProduct.name,

                flavour:
                    currentFlavour.name,

                quantity:
                    currentQuantity,

                price:
                    currentProduct.basePrice *
                    currentQuantity,

                image:
                    currentFlavour.image,

                occasion:
                    occasionName

            };



            // ------------------------------------------
            // Temporary cart output
            // ------------------------------------------

            console.log(
                "Added to cart:",
                cartItem
            );



            // ------------------------------------------
            // Button feedback
            // ------------------------------------------

            const originalText =
                modalAddToCart.textContent;


            modalAddToCart.textContent =
                "✓ ADDED!";



            // ------------------------------------------
            // Close after short delay
            // ------------------------------------------

            setTimeout(
                function () {

                    modalAddToCart.textContent =
                        originalText;

                    closeProductModal();

                },
                800
            );

        }
    );

}