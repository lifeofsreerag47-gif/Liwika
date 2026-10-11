/* =========================================
   GET ORDERS FROM BROWSER STORAGE
========================================= */

let orders = JSON.parse(
    localStorage.getItem("liwikaOrders")
) || [];


/* =========================================
   ELEMENTS
========================================= */

const ordersList = document.getElementById("ordersList");
const emptyOrders = document.getElementById("emptyOrders");

const filterButtons = document.querySelectorAll(".filter-btn");


/* =========================================
   DISPLAY ORDERS
========================================= */

function displayOrders(filter = "all") {

    ordersList.innerHTML = "";

    let filteredOrders = orders;

    if (filter !== "all") {

        filteredOrders = orders.filter(
            order => order.status.toLowerCase() === filter
        );

    }


    /* No orders */

    if (filteredOrders.length === 0) {

        ordersList.style.display = "none";
        emptyOrders.style.display = "block";

        return;
    }


    ordersList.style.display = "flex";
    emptyOrders.style.display = "none";


    /* Create order cards */

    filteredOrders.forEach((order, index) => {

        const card = document.createElement("div");

        card.className = "order-card";


        card.innerHTML = `

            <div class="order-top">

                <div>

                    <div class="order-number">
                        ORDER #${order.id}
                    </div>

                    <div class="order-date">
                        ${order.date}
                    </div>

                </div>

            </div>


            <div class="order-body">

                <div class="product-info">

                    <h3>
                        ${order.product}
                    </h3>

                    <p>
                        Quantity: ${order.quantity}
                    </p>

                </div>


                <div class="order-price">

                    <span>TOTAL</span>

                    <strong>
                        ₹${order.total}
                    </strong>

                </div>

            </div>


            <div class="order-status ${getStatusClass(order.status)}">

                <span class="status-dot"></span>

                ${order.status}

            </div>


            <div class="order-actions">

                <button
                    class="view-btn"
                    onclick="viewOrder(${index})">

                    VIEW ORDER

                </button>


                <button
                    class="buy-again-btn"
                    onclick="buyAgain(${index})">

                    BUY AGAIN

                </button>

            </div>

        `;


        ordersList.appendChild(card);

    });

}


/* =========================================
   STATUS CLASS
========================================= */

function getStatusClass(status) {

    status = status.toLowerCase();

    if (status === "delivered") {
        return "status-delivered";
    }

    if (status === "shipped") {
        return "status-shipped";
    }

    return "status-processing";
}


/* =========================================
   FILTER BUTTONS
========================================= */

filterButtons.forEach(button => {

    button.addEventListener("click", function () {

        filterButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        this.classList.add("active");

        const filter = this.dataset.filter;

        displayOrders(filter);

    });

});


/* =========================================
   VIEW ORDER
========================================= */

function viewOrder(index) {

    const order = orders[index];

    const modal = document.getElementById("orderModal");

    const details = document.getElementById("orderDetails");


    details.innerHTML = `

        <h2 class="details-title">
            Order #${order.id}
        </h2>

        <p class="details-subtitle">
            Placed on ${order.date}
        </p>


        <h3 class="tracking-title">
            Order Tracking
        </h3>


        <div class="tracking">

            <div class="track-step completed">

                <h4>Order Placed</h4>

                <p>
                    Your order has been received.
                </p>

            </div>


            <div class="track-step ${isStepComplete(order.status, "processing")}">

                <h4>Being Prepared</h4>

                <p>
                    Your chocolates are being prepared.
                </p>

            </div>


            <div class="track-step ${isStepComplete(order.status, "shipped")}">

                <h4>Shipped</h4>

                <p>
                    Your order is on its way.
                </p>

            </div>


            <div class="track-step ${isStepComplete(order.status, "delivered")}">

                <h4>Delivered</h4>

                <p>
                    Your order has been delivered.
                </p>

            </div>

        </div>


        <div class="delivery-box">

            <h3>
                EXPECTED DELIVERY
            </h3>

            <p>
                ${order.deliveryDate}
            </p>

        </div>


        <div class="delivery-box">

            <h3>
                DELIVERING TO
            </h3>

            <p>
                ${order.address}
            </p>

        </div>


        <div class="delivery-box">

            <h3>
                ORDER TOTAL
            </h3>

            <p>
                ₹${order.total}
            </p>

        </div>

    `;


    modal.style.display = "block";

}


/* =========================================
   TRACKING STATUS
========================================= */

function isStepComplete(currentStatus, step) {

    const statusOrder = [
        "processing",
        "shipped",
        "delivered"
    ];

    const currentIndex =
        statusOrder.indexOf(currentStatus.toLowerCase());

    const stepIndex =
        statusOrder.indexOf(step);

    if (currentIndex >= stepIndex) {
        return "completed";
    }

    return "";

}


/* =========================================
   CLOSE MODAL
========================================= */

function closeOrderModal() {

    document.getElementById("orderModal").style.display = "none";

}


/* =========================================
   BUY AGAIN
========================================= */

function buyAgain(index) {

    const order = orders[index];

    alert(
        `${order.product} has been added to your cart!`
    );

    /* Later we will connect this to your actual cart. */

}


/* =========================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================= */

window.addEventListener("click", function(event) {

    const modal = document.getElementById("orderModal");

    if (event.target === modal) {

        closeOrderModal();

    }

});


/* =========================================
   LOAD ORDERS
========================================= */

displayOrders();