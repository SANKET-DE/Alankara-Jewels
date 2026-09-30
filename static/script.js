/* =====================================================
   ALANKARA JEWELS - MAIN SCRIPT
   Products + Cart + Checkout + Manual UPI Payment
===================================================== */


/* ================= PRODUCTS ================= */

let products = [];


/* ================= VARIABLES ================= */

let cart =
    JSON.parse(localStorage.getItem("alankaraCart")) || [];

let selectedProduct = null;


/* ================= ELEMENTS ================= */

const productsContainer =
    document.getElementById("products");

const cartCount =
    document.getElementById("cartCount");

const cartItems =
    document.getElementById("cartItems");

const cartTotal =
    document.getElementById("cartTotal");

const cartElement =
    document.querySelector(".cart");

const cartOverlay =
    document.getElementById("cartOverlay");

const toast =
    document.getElementById("toast");


/* =====================================================
   LOAD PRODUCTS
===================================================== */

async function loadProducts() {

    try {

        if (!productsContainer) {
            console.error("Products container not found.");
            return;
        }

        productsContainer.innerHTML = `
            <p style="
                grid-column:1/-1;
                text-align:center;
                padding:50px;
            ">
                Loading jewellery...
            </p>
        `;

        const response =
            await fetch("/api/products");

        if (!response.ok) {
            throw new Error(
                "Could not load products"
            );
        }

        const data =
            await response.json();

        console.log(
            "Products response:",
            data
        );

        if (!data.success) {
            throw new Error(
                data.message ||
                "Could not load products"
            );
        }

        products =
            (data.products || []).filter(
                product =>
                    product.active !== false
            );

        displayProducts();

    } catch (error) {

        console.error(
            "PRODUCT LOAD ERROR:",
            error
        );

        if (productsContainer) {

            productsContainer.innerHTML = `
                <p style="
                    grid-column:1/-1;
                    text-align:center;
                    padding:50px;
                ">
                    Unable to load products.
                    <br>
                    Please refresh the page.
                </p>
            `;

        }

    }

}


/* =====================================================
   DISPLAY PRODUCTS
===================================================== */

function displayProducts(
    category = "all",
    search = ""
) {

    if (!productsContainer) return;

    const filteredProducts =
        products.filter(product => {

            const categoryMatch =
                category === "all" ||
                product.category === category;

            const searchMatch =
                String(product.name || "")
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    );

            return categoryMatch &&
                searchMatch;

        });


    productsContainer.innerHTML = "";


    if (filteredProducts.length === 0) {

        productsContainer.innerHTML = `
            <p style="
                grid-column:1/-1;
                text-align:center;
                padding:50px;
            ">
                No jewellery found.
            </p>
        `;

        return;
    }


    filteredProducts.forEach(product => {

        const productElement =
            document.createElement("div");

        productElement.className =
            "product";


        productElement.innerHTML = `

            <div class="product-image">

                <img
                    src="${product.image || ""}"
                    alt="${product.name || "Jewellery"}"
                    onerror="
                        this.src='https://via.placeholder.com/500x500?text=No+Image'
                    "
                >

                <button
                    class="wishlist"
                    onclick="toggleWishlist(this)"
                >
                    ♡
                </button>

            </div>


            <div class="product-info">

                <span class="product-category">
                    ${product.category || "Jewellery"}
                </span>

                <h3>
                    ${product.name || "Unnamed Product"}
                </h3>

                <p class="product-price">
                    ₹${Number(
                        product.price || 0
                    ).toLocaleString("en-IN")}
                </p>


                <div class="product-actions">

                    <button
                        onclick="addToCart('${product.id}')"
                        ${
                            Number(product.stock || 0) <= 0
                                ? "disabled"
                                : ""
                        }
                    >

                        ${
                            Number(product.stock || 0) <= 0
                                ? "Out of Stock"
                                : "Add To Cart"
                        }

                    </button>


                    <button
                        onclick="openProduct('${product.id}')"
                    >
                        View
                    </button>

                </div>

            </div>

        `;


        productsContainer.appendChild(
            productElement
        );

    });

}


/* =====================================================
   CATEGORY FILTER
===================================================== */

document
    .querySelectorAll(".category")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".category")
                    .forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                const search =
                    document.getElementById(
                        "searchInput"
                    );


                displayProducts(
                    button.dataset.category,
                    search
                        ? search.value
                        : ""
                );

            }
        );

    });


/* =====================================================
   SEARCH
===================================================== */

const searchBtn =
    document.getElementById(
        "searchBtn"
    );

const searchBox =
    document.getElementById(
        "searchBox"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );


if (searchBtn && searchBox) {

    searchBtn.addEventListener(
        "click",
        () => {

            searchBox.classList.toggle(
                "active"
            );


            if (
                searchBox.classList.contains(
                    "active"
                ) &&
                searchInput
            ) {

                searchInput.focus();

            }

        }
    );

}


if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const activeCategory =
                document.querySelector(
                    ".category.active"
                );


            displayProducts(
                activeCategory
                    ? activeCategory.dataset.category
                    : "all",

                searchInput.value
            );

        }
    );

}


/* =====================================================
   CART
===================================================== */

function addToCart(productId) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) {

        showToast(
            "Product not found"
        );

        return;
    }


    if (
        Number(product.stock || 0) <= 0
    ) {

        showToast(
            "This product is out of stock"
        );

        return;
    }


    const existing =
        cart.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (existing) {

        if (
            existing.quantity >=
            Number(product.stock)
        ) {

            showToast(
                "Maximum available stock reached"
            );

            return;
        }


        existing.quantity++;

    } else {

        cart.push({

            ...product,

            quantity: 1

        });

    }


    saveCart();

    showToast(
        "Added to cart"
    );

}


/* =====================================================
   REMOVE FROM CART
===================================================== */

function removeFromCart(productId) {

    cart =
        cart.filter(
            item =>
                String(item.id) !==
                String(productId)
        );


    saveCart();

}


/* =====================================================
   SAVE CART
===================================================== */

function saveCart() {

    localStorage.setItem(
        "alankaraCart",
        JSON.stringify(cart)
    );


    updateCart();

}


/* =====================================================
   UPDATE CART
===================================================== */

function updateCart() {

    if (
        !cartCount ||
        !cartItems ||
        !cartTotal
    ) {
        return;
    }


    const totalQuantity =
        cart.reduce(
            (sum, item) =>
                sum +
                Number(item.quantity || 0),
            0
        );


    cartCount.textContent =
        totalQuantity;


    cartItems.innerHTML = "";


    if (cart.length === 0) {

        cartItems.innerHTML = `
            <p class="empty-cart">
                Your cart is empty.
            </p>
        `;

        cartTotal.textContent =
            "₹0";

        return;
    }


    let total = 0;


    cart.forEach(item => {

        const quantity =
            Number(item.quantity || 0);

        const price =
            Number(item.price || 0);


        total +=
            price * quantity;


        const element =
            document.createElement("div");

        element.className =
            "cart-item";


        element.innerHTML = `

            <img
                src="${item.image || ""}"
                alt="${item.name || ""}"
                onerror="
                    this.src='https://via.placeholder.com/100x100?text=No+Image'
                "
            >

            <div>

                <h4>
                    ${item.name || "Product"}
                </h4>

                <p>
                    ₹${price.toLocaleString("en-IN")}
                    × ${quantity}
                </p>

                <button
                    class="remove-item"
                    onclick="
                        removeFromCart('${item.id}')
                    "
                >
                    Remove
                </button>

            </div>

        `;


        cartItems.appendChild(
            element
        );

    });


    cartTotal.textContent =
        "₹" +
        total.toLocaleString(
            "en-IN"
        );

}


/* =====================================================
   CART OPEN / CLOSE
===================================================== */

const cartBtn =
    document.getElementById(
        "cartBtn"
    );

const closeCartBtn =
    document.getElementById(
        "closeCart"
    );


if (cartBtn) {

    cartBtn.addEventListener(
        "click",
        () => {

            if (cartElement)
                cartElement.classList.add(
                    "active"
                );

            if (cartOverlay)
                cartOverlay.classList.add(
                    "active"
                );

        }
    );

}


if (closeCartBtn) {

    closeCartBtn.addEventListener(
        "click",
        closeCart
    );

}


if (cartOverlay) {

    cartOverlay.addEventListener(
        "click",
        closeCart
    );

}


function closeCart() {

    if (cartElement)
        cartElement.classList.remove(
            "active"
        );


    if (cartOverlay)
        cartOverlay.classList.remove(
            "active"
        );

}


/* =====================================================
   PRODUCT MODAL
===================================================== */

function openProduct(productId) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) return;


    selectedProduct =
        product;


    const modalImage =
        document.getElementById(
            "modalImage"
        );

    const modalName =
        document.getElementById(
            "modalName"
        );

    const modalCategory =
        document.getElementById(
            "modalCategory"
        );

    const modalDescription =
        document.getElementById(
            "modalDescription"
        );

    const modalPrice =
        document.getElementById(
            "modalPrice"
        );

    const productModal =
        document.getElementById(
            "productModal"
        );


    if (modalImage)
        modalImage.src =
            product.image || "";


    if (modalName)
        modalName.textContent =
            product.name || "";


    if (modalCategory)
        modalCategory.textContent =
            product.category ||
            "Jewellery";


    if (modalDescription)
        modalDescription.textContent =
            product.description || "";


    if (modalPrice)
        modalPrice.textContent =
            "₹" +
            Number(
                product.price || 0
            ).toLocaleString(
                "en-IN"
            );


    if (productModal)
        productModal.classList.add(
            "active"
        );

}


const closeModalBtn =
    document.getElementById(
        "closeModal"
    );


if (closeModalBtn) {

    closeModalBtn.addEventListener(
        "click",
        closeModal
    );

}


function closeModal() {

    const modal =
        document.getElementById(
            "productModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


const modalAddCart =
    document.getElementById(
        "modalAddCart"
    );


if (modalAddCart) {

    modalAddCart.addEventListener(
        "click",
        () => {

            if (selectedProduct) {

                addToCart(
                    selectedProduct.id
                );

                closeModal();

            }

        }
    );

}


/* =====================================================
   WISHLIST
===================================================== */

function toggleWishlist(button) {

    if (!button) return;


    if (
        button.textContent.trim() ===
        "♡"
    ) {

        button.textContent =
            "♥";

    } else {

        button.textContent =
            "♡";

    }

}


/* =====================================================
   MOBILE MENU
===================================================== */

const menuBtn =
    document.getElementById(
        "menuBtn"
    );

const navMenu =
    document.getElementById(
        "navMenu"
    );


if (menuBtn && navMenu) {

    menuBtn.addEventListener(
        "click",
        () => {

            navMenu.classList.toggle(
                "active"
            );

        }
    );

}


/* =====================================================
   NEWSLETTER
===================================================== */

const newsletterForm =
    document.getElementById(
        "newsletterForm"
    );


if (newsletterForm) {

    newsletterForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            showToast(
                "Thank you for subscribing!"
            );

            event.target.reset();

        }
    );

}


/* =====================================================
   CHECKOUT TOTAL
===================================================== */

function getCartTotal() {

    return cart.reduce(
        (total, item) => {

            return total +
                (
                    Number(
                        item.price || 0
                    ) *
                    Number(
                        item.quantity || 0
                    )
                );

        },
        0
    );

}


/* =====================================================
   CHECKOUT SUMMARY
===================================================== */

function updateCheckoutSummary() {

    const summary =
        document.getElementById(
            "checkoutSummary"
        );


    if (!summary) return;


    let html = "";


    cart.forEach(item => {

        const quantity =
            Number(
                item.quantity || 0
            );

        const price =
            Number(
                item.price || 0
            );

        const itemTotal =
            price * quantity;


        html += `

            <div class="checkout-summary-row">

                <span>
                    ${item.name}
                    × ${quantity}
                </span>

                <strong>
                    ₹${itemTotal.toLocaleString(
                        "en-IN"
                    )}
                </strong>

            </div>

        `;

    });


    html += `

        <div class="
            checkout-summary-row
            checkout-summary-total
        ">

            <span>
                Total
            </span>

            <strong>
                ₹${getCartTotal().toLocaleString(
                    "en-IN"
                )}
            </strong>

        </div>

    `;


    summary.innerHTML =
        html;

}


/* =====================================================
   UPI PAYMENT
===================================================== */

function updateUpiPayment() {

    const amountElement =
        document.getElementById(
            "upiAmount"
        );

    const qrElement =
        document.getElementById(
            "upiQrCode"
        );


    if (
        !amountElement ||
        !qrElement
    ) {

        console.warn(
            "UPI payment elements not found."
        );

        return;

    }


    const total =
        getCartTotal();


    amountElement.textContent =
        "₹" +
        total.toLocaleString(
            "en-IN"
        );


    qrElement.innerHTML =
        "";


    const upiUrl =
        "upi://pay" +
        "?pa=soham01mahapatra@okicici" +
        "&pn=Alankara%20Jewels" +
        "&am=" +
        total.toFixed(2) +
        "&cu=INR";


    if (
        typeof QRCode ===
        "undefined"
    ) {

        qrElement.innerHTML = `
            <p style="color:red;">
                QR code library could not load.
            </p>
        `;

        console.error(
            "QRCode library not found."
        );

        return;

    }


    new QRCode(
        qrElement,
        {
            text: upiUrl,
            width: 220,
            height: 220
        }
    );

}


/* =====================================================
   OPEN CHECKOUT
===================================================== */

function openCheckout() {

    if (
        !cart ||
        cart.length === 0
    ) {

        showToast(
            "Your cart is empty"
        );

        return;
    }


    const modal =
        document.getElementById(
            "checkoutModal"
        );


    if (!modal) {

        console.error(
            "Checkout modal not found."
        );

        return;
    }


    updateCheckoutSummary();

    updateUpiPayment();


    const message =
        document.getElementById(
            "checkoutMessage"
        );


    if (message) {

        message.textContent =
            "";

        message.className =
            "checkout-message";

    }


    modal.classList.add(
        "active"
    );

}


/* =====================================================
   CLOSE CHECKOUT
===================================================== */

function closeCheckout() {

    const modal =
        document.getElementById(
            "checkoutModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


/* =====================================================
   CHECKOUT CLOSE EVENTS
===================================================== */

const checkoutClose =
    document.getElementById(
        "checkoutClose"
    );


if (checkoutClose) {

    checkoutClose.addEventListener(
        "click",
        closeCheckout
    );

}


const checkoutModal =
    document.getElementById(
        "checkoutModal"
    );


if (checkoutModal) {

    checkoutModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                checkoutModal
            ) {

                closeCheckout();

            }

        }
    );

}


/* =====================================================
   PLACE ORDER
===================================================== */

async function placeOrder(event) {

    event.preventDefault();


    console.log(
        "🔥 PLACE ORDER BUTTON CLICKED"
    );


    if (
        !cart ||
        cart.length === 0
    ) {

        showToast(
            "Your cart is empty"
        );

        return;
    }


    const message =
        document.getElementById(
            "checkoutMessage"
        );

    const button =
        document.getElementById(
            "placeOrderBtn"
        );


    const name =
        document.getElementById(
            "checkoutName"
        ).value.trim();


    const phone =
        document.getElementById(
            "checkoutPhone"
        ).value.trim();


    const email =
        document.getElementById(
            "checkoutEmail"
        ).value.trim();


    const city =
        document.getElementById(
            "checkoutCity"
        ).value.trim();


    const address =
        document.getElementById(
            "checkoutAddress"
        ).value.trim();


    const pin =
        document.getElementById(
            "checkoutPin"
        ).value.trim();


    const note =
        document.getElementById(
            "checkoutNote"
        ).value.trim();


    const utrInput =
        document.getElementById(
            "checkoutUtr"
        );


    const utr =
        utrInput
            ? utrInput.value.trim()
            : "";


    /* =================================================
       VALIDATION
    ================================================= */

    if (!name) {

        message.textContent =
            "Please enter your name.";

        message.className =
            "checkout-message show error";

        return;
    }


    if (
        !/^[0-9]{10}$/.test(
            phone
        )
    ) {

        message.textContent =
            "Please enter a valid 10-digit mobile number.";

        message.className =
            "checkout-message show error";

        return;
    }


    if (
        !/^[0-9]{6}$/.test(
            pin
        )
    ) {

        message.textContent =
            "Please enter a valid 6-digit PIN code.";

        message.className =
            "checkout-message show error";

        return;
    }


    if (!utr) {

        message.textContent =
            "Please enter your UTR / Transaction ID after completing the UPI payment.";

        message.className =
            "checkout-message show error";

        if (utrInput) {

            utrInput.focus();

        }

        return;
    }


    /* =================================================
       CUSTOMER
    ================================================= */

    const customer = {

        name: name,

        phone: phone,

        email: email,

        address: address,

        city: city,

        pin: pin,

        note: note

    };


    /* =================================================
       ORDER
    ================================================= */

    const orderData = {

        customer: customer,

        items: cart.map(
            item => ({

                id: item.id,

                name: item.name,

                price:
                    Number(
                        item.price || 0
                    ),

                quantity:
                    Number(
                        item.quantity || 0
                    ),

                image:
                    item.image || ""

            })
        ),

        total:
            getCartTotal(),


        payment_method:
            "UPI",

        payment_status:
            "Submitted",

        utr_id:
            utr

    };


    console.log(
        "📦 Sending order:",
        orderData
    );


    /* =================================================
       BUTTON STATE
    ================================================= */

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Placing Order...";

    }


    if (message) {

        message.textContent =
            "";

        message.className =
            "checkout-message";

    }


    /* =================================================
       SEND TO FLASK
    ================================================= */

    try {

        const response =
            await fetch(
                "/api/orders",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            orderData
                        )

                }
            );


        console.log(
            "Server HTTP status:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "📥 Server response:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Could not place order"
            );

        }


        /* =================================================
           ORDER SUCCESS
        ================================================= */

        const orderId =
            data.order_id ||
            "Pending";


        /*
           Clear cart only after
           successful server response.
        */

        cart = [];


        localStorage.removeItem(
            "alankaraCart"
        );


        updateCart();


        /*
           Show confirmation
        */

        const checkoutBox =
            document.querySelector(
                ".checkout-box"
            );


        if (checkoutBox) {

            checkoutBox.innerHTML = `

                <div class="order-success">

                    <div class="order-success-icon">
                        ✓
                    </div>


                    <h2>
                        Order Placed Successfully!
                    </h2>


                    <p>
                        Thank you,
                        <strong>
                            ${name}
                        </strong>.
                    </p>


                    <p>
                        Your order has been
                        received successfully.
                    </p>


                    <div class="order-id-box">

                        Order ID:
                        <strong>
                            ${orderId}
                        </strong>

                    </div>


                    <div
                        style="
                            margin-top:15px;
                            padding:12px;
                            border-radius:8px;
                            background:#f5f5f5;
                        "
                    >

                        Payment Status:
                        <strong>
                            Submitted
                        </strong>

                        <br>

                        UTR:
                        <strong>
                            ${utr}
                        </strong>

                    </div>


                    <p>

                        We will verify your
                        payment and contact you
                        on

                        <strong>
                            ${phone}
                        </strong>.

                    </p>


                    <!-- VIEW ORDER DETAILS BUTTON -->

                    <button
                        type="button"
                        class="checkout-submit"
                        id="viewOrderDetailsBtn"
                    >

                        View Order Details

                    </button>


                    <!-- CONTINUE SHOPPING BUTTON -->

                    <button
                        type="button"
                        class="checkout-submit"
                        id="continueShoppingBtn"
                    >

                        Continue Shopping

                    </button>

                </div>

            `;


            /* =================================================
               VIEW ORDER DETAILS
            ================================================= */

            const viewOrderDetailsBtn =
                document.getElementById(
                    "viewOrderDetailsBtn"
                );


            if (viewOrderDetailsBtn) {

                viewOrderDetailsBtn.addEventListener(
                    "click",
                    () => {

                        /*
                           Close checkout modal
                        */

                        closeCheckout();


                        /*
                           Close cart if open
                        */

                        if (cartElement) {

                            cartElement.classList.remove(
                                "active"
                            );

                        }


                        if (cartOverlay) {

                            cartOverlay.classList.remove(
                                "active"
                            );

                        }


                        /*
                           Put Order ID into
                           Track Order form
                        */

                        const trackOrderId =
                            document.getElementById(
                                "trackOrderId"
                            );


                        if (trackOrderId) {

                            trackOrderId.value =
                                orderId;

                        }


                        /*
                           Scroll to Track Order
                        */

                        const trackOrderSection =
                            document.getElementById(
                                "trackOrderSection"
                            );


                        if (trackOrderSection) {

                            trackOrderSection.scrollIntoView({
                                behavior: "smooth",
                                block: "center"
                            });

                        }

                    }
                );

            }


            /* =================================================
               CONTINUE SHOPPING
            ================================================= */

            const continueButton =
                document.getElementById(
                    "continueShoppingBtn"
                );


            if (continueButton) {

                continueButton.addEventListener(
                    "click",
                    () => {

                        closeCheckout();


                        if (cartElement) {

                            cartElement.classList.remove(
                                "active"
                            );

                        }


                        if (cartOverlay) {

                            cartOverlay.classList.remove(
                                "active"
                            );

                        }


                        /*
                           Reload page so checkout
                           form returns normally.
                        */

                        location.reload();

                    }
                );

            }

        }


    } catch (error) {

        console.error(
            "❌ ORDER ERROR:",
            error
        );


        if (message) {

            message.textContent =
                error.message ||
                "Unable to place order. Please try again.";

            message.className =
                "checkout-message show error";

        }


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Place Order";

        }

    }

}


/* =====================================================
   CHECKOUT FORM
===================================================== */

const checkoutForm =
    document.getElementById(
        "checkoutForm"
    );


if (checkoutForm) {

    checkoutForm.addEventListener(
        "submit",
        placeOrder
    );

}


/* =====================================================
   CHECKOUT BUTTON
===================================================== */

const checkoutBtn =
    document.getElementById(
        "checkoutBtn"
    );


if (checkoutBtn) {

    checkoutBtn.addEventListener(
        "click",
        openCheckout
    );

}


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

    if (!toast) {

        console.log(
            "TOAST:",
            message
        );

        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );

}


/* =====================================================
   CUSTOMER ORDER TRACKING
===================================================== */


/*
   Escape HTML before inserting
   Firestore/customer data into HTML.
*/

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


function createTrackOrderUI() {

    /*
       Prevent duplicate Track Order section
    */

    if (
        document.getElementById(
            "trackOrderSection"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.textContent = `

        #trackOrderSection {

            max-width: 700px;

            margin: 70px auto;

            padding: 20px;

        }


        .track-order-box {

            background: #ffffff;

            border-radius: 16px;

            padding: 30px;

            box-shadow:
                0 10px 35px
                rgba(0,0,0,0.10);

            border:
                1px solid #eeeeee;

        }


        .track-order-title {

            text-align: center;

            margin-bottom: 8px;

            font-size: 28px;

        }


        .track-order-subtitle {

            text-align: center;

            color: #777;

            margin-bottom: 25px;

        }


        .track-order-form {

            display: grid;

            gap: 15px;

        }


        .track-order-form label {

            font-weight: 600;

            font-size: 14px;

        }


        .track-order-form input {

            width: 100%;

            box-sizing: border-box;

            padding: 13px;

            border:
                1px solid #ddd;

            border-radius: 9px;

            font-size: 15px;

            margin-top: 6px;

            outline: none;

        }


        .track-order-form input:focus {

            border-color: #555;

        }


        .track-order-button {

            border: none;

            background: #222;

            color: white;

            padding: 14px;

            border-radius: 9px;

            font-size: 16px;

            font-weight: 700;

            cursor: pointer;

            margin-top: 5px;

        }


        .track-order-button:hover {

            background: #444;

        }


        .track-order-button:disabled {

            opacity: 0.6;

            cursor: not-allowed;

        }


        #trackOrderMessage {

            display: none;

            padding: 12px;

            border-radius: 8px;

            margin-top: 15px;

            font-size: 14px;

        }


        #trackOrderMessage.show {

            display: block;

        }


        #trackOrderMessage.error {

            background: #fdecec;

            color: #a21d1d;

        }


        #trackOrderMessage.success {

            background: #eaf8ef;

            color: #176b35;

        }


        #trackOrderResult {

            display: none;

            margin-top: 25px;

            background: #f8f6f2;

            padding: 20px;

            border-radius: 12px;

        }


        #trackOrderResult.show {

            display: block;

        }


        .track-result-header {

            display: flex;

            justify-content: space-between;

            align-items: center;

            gap: 15px;

            margin-bottom: 15px;

        }


        .track-result-header h3 {

            margin: 0;

        }


        .track-status {

            display: inline-block;

            padding: 7px 12px;

            border-radius: 20px;

            background: #222;

            color: white;

            font-size: 13px;

            font-weight: 700;

        }


        .track-payment {

            margin: 15px 0;

            padding: 12px;

            background: white;

            border-radius: 8px;

        }


        .track-item {

            display: flex;

            justify-content: space-between;

            gap: 15px;

            padding: 9px 0;

            border-bottom:
                1px solid #ddd;

        }


        .track-item:last-child {

            border-bottom: none;

        }


        .track-total {

            display: flex;

            justify-content: space-between;

            padding-top: 15px;

            margin-top: 8px;

            border-top:
                2px solid #ddd;

            font-size: 18px;

            font-weight: 700;

        }


        @media (max-width: 600px) {

            #trackOrderSection {

                margin: 40px auto;

                padding: 15px;

            }


            .track-order-box {

                padding: 20px;

            }


            .track-order-title {

                font-size: 23px;

            }


            .track-result-header {

                align-items: flex-start;

                flex-direction: column;

            }

        }

    `;


    document.head.appendChild(
        style
    );


    const section =
        document.createElement(
            "section"
        );


    section.id =
        "trackOrderSection";


    section.innerHTML = `

        <div class="track-order-box">

            <h2 class="track-order-title">
                Track Your Order
            </h2>


            <p class="track-order-subtitle">
                Enter your Order ID and phone number
                to check your order status.
            </p>


            <form
                id="trackOrderForm"
                class="track-order-form"
            >

                <div>

                    <label for="trackOrderId">
                        Order ID
                    </label>


                    <input
                        id="trackOrderId"
                        type="text"
                        placeholder="Enter your Order ID"
                        required
                    >

                </div>


                <div>

                    <label for="trackOrderPhone">
                        Phone Number
                    </label>


                    <input
                        id="trackOrderPhone"
                        type="tel"
                        inputmode="numeric"
                        maxlength="10"
                        pattern="[0-9]{10}"
                        placeholder="Enter your 10-digit phone number"
                        required
                    >

                </div>


                <button
                    type="submit"
                    class="track-order-button"
                    id="trackOrderButton"
                >

                    Track Order

                </button>

            </form>


            <div
                id="trackOrderMessage"
            ></div>


            <div
                id="trackOrderResult"
            ></div>

        </div>

    `;


    /*
       Put Track Order section before footer.
    */

    const footer =
        document.querySelector(
            "footer"
        );


    if (footer) {

        footer.parentNode.insertBefore(
            section,
            footer
        );

    } else {

        document.body.appendChild(
            section
        );

    }


    const trackForm =
        document.getElementById(
            "trackOrderForm"
        );


    if (trackForm) {

        trackForm.addEventListener(
            "submit",
            trackCustomerOrder
        );

    }

}


/* =====================================================
   TRACK CUSTOMER ORDER
===================================================== */

async function trackCustomerOrder(
    event
) {

    event.preventDefault();


    const orderIdElement =
        document.getElementById(
            "trackOrderId"
        );


    const phoneElement =
        document.getElementById(
            "trackOrderPhone"
        );


    const button =
        document.getElementById(
            "trackOrderButton"
        );


    const message =
        document.getElementById(
            "trackOrderMessage"
        );


    const result =
        document.getElementById(
            "trackOrderResult"
        );


    const orderId =
        orderIdElement
            ? orderIdElement.value.trim()
            : "";


    const phone =
        phoneElement
            ? phoneElement.value.trim()
            : "";


    /*
       Clear old result
    */

    if (result) {

        result.classList.remove(
            "show"
        );

        result.innerHTML =
            "";

    }


    /*
       Validation
    */

    if (!orderId) {

        if (message) {

            message.textContent =
                "Please enter your Order ID.";

            message.className =
                "show error";

        }

        return;

    }


    if (
        !/^[0-9]{10}$/.test(
            phone
        )
    ) {

        if (message) {

            message.textContent =
                "Please enter a valid 10-digit phone number.";

            message.className =
                "show error";

        }

        return;

    }


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Checking...";

    }


    if (message) {

        message.className =
            "";

    }


    try {

        const response =
            await fetch(
                "/api/order/track",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            order_id:
                                orderId,

                            phone:
                                phone

                        })

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Could not find your order."
            );

        }


        const order =
            data.order;


        /*
           Display items
        */

        let itemsHTML =
            "";


        (order.items || [])
            .forEach(item => {

                const quantity =
                    Number(
                        item.quantity || 0
                    );


                const price =
                    Number(
                        item.price || 0
                    );


                const subtotal =
                    price * quantity;


                itemsHTML += `

                    <div class="track-item">

                        <span>

                            ${escapeHtml(
                                item.name ||
                                "Product"
                            )}

                            × ${quantity}

                        </span>


                        <strong>

                            ₹${subtotal.toLocaleString(
                                "en-IN"
                            )}

                        </strong>

                    </div>

                `;

            });


        /*
           Display result
        */

        if (result) {

            result.innerHTML = `

                <div class="track-result-header">

                    <h3>
                        Order Details
                    </h3>


                    <span class="track-status">

                        ${escapeHtml(
                            order.status ||
                            "Pending"
                        )}

                    </span>

                </div>


                <p>

                    <strong>
                        Order ID:
                    </strong>

                    ${escapeHtml(
                        order.id ||
                        orderId
                    )}

                </p>


                <div class="track-payment">

                    <strong>
                        Payment
                    </strong>

                    <br>

                    Method:

                    ${escapeHtml(
                        order.payment_method ||
                        "UPI"
                    )}

                    <br>

                    Status:

                    <strong>

                        ${escapeHtml(
                            order.payment_status ||
                            "Submitted"
                        )}

                    </strong>

                </div>


                <h4>
                    Items
                </h4>


                ${itemsHTML}


                <div class="track-total">

                    <span>
                        Total
                    </span>


                    <strong>

                        ₹${Number(
                            order.total || 0
                        ).toLocaleString(
                            "en-IN"
                        )}

                    </strong>

                </div>

            `;


            result.classList.add(
                "show"
            );

        }


        if (message) {

            message.textContent =
                "Order found successfully.";

            message.className =
                "show success";

        }


    } catch (error) {

        console.error(
            "TRACK ORDER ERROR:",
            error
        );


        if (message) {

            message.textContent =
                error.message ||
                "Could not find your order.";

            message.className =
                "show error";

        }

    }


    if (button) {

        button.disabled =
            false;

        button.textContent =
            "Track Order";

    }

}


/* =====================================================
   INITIALIZE
===================================================== */

loadProducts();

updateCart();

createTrackOrderUI();