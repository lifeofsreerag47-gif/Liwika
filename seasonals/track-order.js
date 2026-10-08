// =========================================================
// LIWI-KA — TRACK ORDER
// Frontend tracking system
// =========================================================


// =========================================================
// TEST ORDER DATA
// Temporary data for frontend testing.
//
// Later this will come from:
// JavaScript → Flask API → SQL Database
// =========================================================

const testOrders = {

    "LW2026100342": {

        orderNumber: "LW2026100342",

        orderDate: "06 October 2026",

        status: "Out for Delivery",

        estimatedDelivery: "10 October 2026",

        shippingMethod: "Standard Delivery",

        trackingNumber: "LIWIKA458921",

        items: [

            {
                name: "Dark Indulgence",
                flavour: "Classic Dark",
                quantity: 1,
                price: 299,
                image: "../images/choco1.jpg"
            },

            {
                name: "Golden Milk",
                flavour: "Caramel Milk",
                quantity: 2,
                price: 349,
                image: "../images/choco2.jpg"
            }

        ],

        subtotal: 997,

        delivery: 0,

        total: 997

    }

};


// =========================================================
// GET HTML ELEMENTS
// =========================================================

const trackOrderForm = document.getElementById("trackOrderForm");

const orderNumberInput = document.getElementById("orderNumber");

const orderResult = document.getElementById("orderResult");

const resultOrderNumber =
    document.getElementById("resultOrderNumber");

const resultOrderDate =
    document.getElementById("resultOrderDate");

const currentStatus =
    document.getElementById("currentStatus");

const estimatedDelivery =
    document.getElementById("estimatedDelivery");

const shippingMethod =
    document.getElementById("shippingMethod");

const trackingNumber =
    document.getElementById("trackingNumber");

const orderItems =
    document.getElementById("orderItems");

const orderSubtotal =
    document.getElementById("orderSubtotal");

const orderDelivery =
    document.getElementById("orderDelivery");

const orderTotal =
    document.getElementById("orderTotal");


// =========================================================
// TRACK ORDER FORM
// =========================================================

trackOrderForm.addEventListener("submit", function (event) {

    event.preventDefault();


    // Get what customer entered

    const enteredOrderNumber =
        orderNumberInput.value.trim().toUpperCase();


    // If nothing was entered

    if (enteredOrderNumber === "") {

        showError("Please enter your order number.");

        return;

    }


    // Look for the order

    const order =
        testOrders[enteredOrderNumber];


    // Order does not exist

    if (!order) {

        showError(
            "We couldn't find an order with that number. Please check your order number and try again."
        );

        return;

    }


    // Order found

    displayOrder(order);

});


// =========================================================
// DISPLAY ORDER
// =========================================================

function displayOrder(order) {


    // Remove previous error if there is one

    removeError();


    // Basic order information

    resultOrderNumber.textContent =
        `Order #${order.orderNumber}`;

    resultOrderDate.textContent =
        `Placed on ${order.orderDate}`;


    currentStatus.textContent =
        order.status;


    estimatedDelivery.textContent =
        order.estimatedDelivery;


    shippingMethod.textContent =
        order.shippingMethod;


    trackingNumber.textContent =
        order.trackingNumber;


    // Display products

    displayOrderItems(order.items);


    // Display price summary

    orderSubtotal.textContent =
        formatPrice(order.subtotal);


    orderDelivery.textContent =
        order.delivery === 0
            ? "FREE"
            : formatPrice(order.delivery);


    orderTotal.textContent =
        formatPrice(order.total);


    // Show the order result

    orderResult.hidden = false;


    // Update timeline

    updateTimeline(order.status);


    // Smoothly take customer to result

    setTimeout(function () {

        orderResult.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 100);

}


// =========================================================
// DISPLAY ORDER ITEMS
// =========================================================

function displayOrderItems(items) {


    // Clear old items

    orderItems.innerHTML = "";


    items.forEach(function (item) {


        const itemElement =
            document.createElement("div");


        itemElement.className =
            "order-item";


        itemElement.innerHTML = `

            <img
                src="${item.image}"
                alt="${item.name}"
                class="order-item-image"
            >

            <div class="order-item-details">

                <p class="order-item-name">
                    ${item.name}
                </p>

                <p class="order-item-meta">
                    ${item.flavour} · Qty ${item.quantity}
                </p>

            </div>

            <div class="order-item-price">
                ${formatPrice(item.price * item.quantity)}
            </div>

        `;


        orderItems.appendChild(itemElement);

    });

}


// =========================================================
// UPDATE ORDER TIMELINE
// =========================================================

function updateTimeline(status) {


    const timelineSteps =
        document.querySelectorAll(".timeline-step");


    // Reset everything

    timelineSteps.forEach(function (step) {

        step.classList.remove("completed");
        step.classList.remove("active");

    });


    // Determine current stage

    let currentStep = 0;


    if (status === "Ordered") {

        currentStep = 0;

    }

    else if (status === "Confirmed") {

        currentStep = 1;

    }

    else if (status === "Packed") {

        currentStep = 2;

    }

    else if (status === "Shipped") {

        currentStep = 3;

    }

    else if (status === "Out for Delivery") {

        currentStep = 3;

    }

    else if (status === "Delivered") {

        currentStep = 4;

    }


    // Apply timeline state

    timelineSteps.forEach(function (step, index) {


        if (index < currentStep) {

            step.classList.add("completed");

        }


        else if (index === currentStep) {

            step.classList.add("active");

        }

    });


    // If delivered, everything is complete

    if (status === "Delivered") {

        timelineSteps.forEach(function (step) {

            step.classList.remove("active");
            step.classList.add("completed");

        });

    }

}


// =========================================================
// FORMAT PRICE
// =========================================================

function formatPrice(amount) {

    return new Intl.NumberFormat("en-IN", {

        style: "currency",

        currency: "INR",

        maximumFractionDigits: 0

    }).format(amount);

}


// =========================================================
// SHOW ERROR
// =========================================================

function showError(message) {


    removeError();


    const errorMessage =
        document.createElement("p");


    errorMessage.id =
        "trackOrderError";


    errorMessage.textContent =
        message;


    errorMessage.style.margin = "16px 0 0";

    errorMessage.style.color = "#c98f7b";

    errorMessage.style.fontFamily =
        '"Font1", Arial, sans-serif';

    errorMessage.style.fontSize =
        "12px";

    errorMessage.style.lineHeight =
        "1.6";


    trackOrderForm.insertAdjacentElement(
        "afterend",
        errorMessage
    );


    // Hide old result if searching again

    orderResult.hidden = true;

}


// =========================================================
// REMOVE ERROR
// =========================================================

function removeError() {

    const existingError =
        document.getElementById("trackOrderError");


    if (existingError) {

        existingError.remove();

    }

}