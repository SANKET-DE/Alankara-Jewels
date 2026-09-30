let products = [];
let allOrders = [];
let currentOrderId = null;


// ==============================
// PAGE LOAD
// ==============================

document.addEventListener("DOMContentLoaded", () => {

    loadProducts();
    loadOrders();

    setupNavigation();
    setupProductForm();
    setupImagePreview();

});


// ==============================
// NAVIGATION
// ==============================

function setupNavigation() {

    const buttons = document.querySelectorAll(".nav-btn");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            buttons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            document.querySelectorAll(".admin-section")
                .forEach(section => {
                    section.classList.add("hidden");
                });

            const sectionId = button.dataset.section;

            const section =
                document.getElementById(sectionId);

            if (section) {
                section.classList.remove("hidden");
            }

            // Refresh orders whenever Orders is opened
            if (sectionId === "ordersSection") {
                loadOrders();
            }

        });

    });

}


// ==============================
// LOAD PRODUCTS
// ==============================

async function loadProducts() {

    try {

        const response =
            await fetch("/api/products");

        const data =
            await response.json();

        if (!data.success) {

            showProductMessage(
                data.message ||
                "Could not load products.",
                "error"
            );

            return;
        }

        products =
            data.products || [];

        renderProducts();

    } catch (error) {

        console.error(error);

        showProductMessage(
            "Could not load products.",
            "error"
        );

    }

}


// ==============================
// DISPLAY PRODUCTS
// ==============================

function renderProducts() {

    const container =
        document.getElementById(
            "productsContainer"
        );

    const count =
        document.getElementById(
            "productCount"
        );

    if (!container || !count) {
        return;
    }

    count.textContent =
        products.length;


    if (products.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No products yet</h3>
                <p>
                    Click "Add Product" to add your first jewellery item.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        products.map(product => {

            const image =
                product.image ||
                "https://via.placeholder.com/500x400?text=No+Image";

            const active =
                product.active !== false;

            return `

                <div class="product-card">

                    <img
                        class="product-image"
                        src="${escapeHtml(image)}"
                        alt="${escapeHtml(
                            product.name || "Product"
                        )}"
                        onerror="this.src='https://via.placeholder.com/500x400?text=No+Image'"
                    >

                    <div class="product-info">

                        <div class="product-name">
                            ${escapeHtml(
                                product.name ||
                                "Unnamed Product"
                            )}
                        </div>

                        <div class="product-category">
                            ${escapeHtml(
                                product.category ||
                                "Other"
                            )}
                        </div>

                        <div class="product-price">
                            ₹${Number(
                                product.price || 0
                            ).toLocaleString("en-IN")}
                        </div>

                        <div class="product-stock">
                            Stock: ${Number(
                                product.stock || 0
                            )}
                        </div>

                        <span class="status ${
                            active
                                ? "active"
                                : "inactive"
                        }">
                            ${
                                active
                                    ? "Active"
                                    : "Inactive"
                            }
                        </span>

                        <div class="card-actions">

                            <button
                                class="edit-btn"
                                onclick="editProduct('${escapeHtml(
                                    product.id
                                )}')">
                                Edit
                            </button>

                            <button
                                class="delete-btn"
                                onclick="deleteProduct('${escapeHtml(
                                    product.id
                                )}')">
                                Delete
                            </button>

                        </div>

                    </div>

                </div>

            `;

        }).join("");

}


// ==============================
// OPEN ADD PRODUCT MODAL
// ==============================

function openProductModal() {

    document.getElementById(
        "productForm"
    ).reset();

    document.getElementById(
        "productId"
    ).value = "";

    document.getElementById(
        "modalTitle"
    ).textContent =
        "Add Product";

    document.getElementById(
        "saveProductBtn"
    ).textContent =
        "Add Product";

    document.getElementById(
        "imagePreview"
    ).style.display =
        "none";

    document.getElementById(
        "productModal"
    ).classList.add("show");

}


// ==============================
// CLOSE PRODUCT MODAL
// ==============================

function closeProductModal() {

    document.getElementById(
        "productModal"
    ).classList.remove("show");

}


// ==============================
// EDIT PRODUCT
// ==============================

function editProduct(id) {

    const product =
        products.find(
            item => item.id === id
        );

    if (!product) {

        alert("Product not found.");

        return;
    }


    document.getElementById(
        "productId"
    ).value =
        product.id;

    document.getElementById(
        "productName"
    ).value =
        product.name || "";

    document.getElementById(
        "productCategory"
    ).value =
        product.category || "";

    document.getElementById(
        "productPrice"
    ).value =
        product.price || 0;

    document.getElementById(
        "productStock"
    ).value =
        product.stock || 0;

    document.getElementById(
        "productImage"
    ).value =
        product.image || "";

    document.getElementById(
        "productDescription"
    ).value =
        product.description || "";

    document.getElementById(
        "productActive"
    ).value =
        product.active === false
            ? "false"
            : "true";


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Edit Product";

    document.getElementById(
        "saveProductBtn"
    ).textContent =
        "Save Changes";


    updateImagePreview(
        product.image
    );


    document.getElementById(
        "productModal"
    ).classList.add("show");

}


// ==============================
// PRODUCT FORM
// ==============================

function setupProductForm() {

    const form =
        document.getElementById(
            "productForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const id =
                document.getElementById(
                    "productId"
                ).value;


            const productData = {

                name:
                    document.getElementById(
                        "productName"
                    ).value.trim(),

                category:
                    document.getElementById(
                        "productCategory"
                    ).value,

                price:
                    Number(
                        document.getElementById(
                            "productPrice"
                        ).value
                    ),

                stock:
                    Number(
                        document.getElementById(
                            "productStock"
                        ).value
                    ),

                image:
                    document.getElementById(
                        "productImage"
                    ).value.trim(),

                description:
                    document.getElementById(
                        "productDescription"
                    ).value.trim(),

                active:
                    document.getElementById(
                        "productActive"
                    ).value === "true"

            };


            if (!productData.name) {

                alert(
                    "Please enter a product name."
                );

                return;
            }


            if (!productData.category) {

                alert(
                    "Please select a category."
                );

                return;
            }


            const saveButton =
                document.getElementById(
                    "saveProductBtn"
                );

            saveButton.disabled = true;

            saveButton.textContent =
                "Saving...";


            try {

                let response;


                // EDIT
                if (id) {

                    response =
                        await fetch(
                            `/api/admin/products/${id}`,
                            {
                                method: "PUT",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        productData
                                    )
                            }
                        );

                }


                // ADD
                else {

                    response =
                        await fetch(
                            "/api/admin/products",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        productData
                                    )
                            }
                        );

                }


                const data =
                    await response.json();


                if (!data.success) {

                    alert(
                        data.message ||
                        "Something went wrong."
                    );

                    return;
                }


                closeProductModal();

                await loadProducts();


                showProductMessage(
                    id
                        ? "Product updated successfully."
                        : "Product added successfully.",
                    "success"
                );


            } catch (error) {

                console.error(error);

                alert(
                    "Server error. Please try again."
                );

            } finally {

                saveButton.disabled = false;

                saveButton.textContent =
                    id
                        ? "Save Changes"
                        : "Add Product";

            }

        }
    );

}


// ==============================
// DELETE PRODUCT
// ==============================

async function deleteProduct(id) {

    const product =
        products.find(
            item => item.id === id
        );


    if (!product) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${product.name}"?\n\nThis cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/admin/products/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Could not delete product."
            );

            return;
        }


        await loadProducts();


        showProductMessage(
            "Product deleted successfully.",
            "success"
        );


    } catch (error) {

        console.error(error);

        alert(
            "Server error."
        );

    }

}


// ==============================
// IMAGE PREVIEW
// ==============================

function setupImagePreview() {

    const imageInput =
        document.getElementById(
            "productImage"
        );

    if (!imageInput) {
        return;
    }

    imageInput.addEventListener(
        "input",
        () => {

            updateImagePreview(
                imageInput.value.trim()
            );

        }
    );

}


function updateImagePreview(url) {

    const preview =
        document.getElementById(
            "imagePreview"
        );


    if (!url) {

        preview.style.display =
            "none";

        return;
    }


    preview.src =
        url;

    preview.style.display =
        "block";


    preview.onerror =
        () => {

            preview.style.display =
                "none";

        };

}


// ==================================================
// ORDERS
// ==================================================


// ==============================
// LOAD ORDERS
// ==============================

async function loadOrders() {

    try {

        const response =
            await fetch(
                "/api/admin/orders"
            );


        if (!response.ok) {

            throw new Error(
                `HTTP error ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            showOrderMessage(
                data.message ||
                "Could not load orders.",
                "error"
            );

            return;
        }


        allOrders =
            data.orders || [];


        renderOrders(
            allOrders
        );


    } catch (error) {

        console.error(error);

        showOrderMessage(
            "Could not connect to server.",
            "error"
        );

    }

}


// ==============================
// DISPLAY ORDERS
// ==============================

function renderOrders(orders) {

    const tbody =
        document.getElementById(
            "ordersTableBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML =
        "";


    if (
        !orders ||
        orders.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="3"
                    style="text-align:center;padding:40px;">
                    No orders yet.
                </td>
            </tr>
        `;

        return;
    }


    orders.forEach(order => {

        const customer =
            order.customer || {};


        const customerId =
            order.id || "-";


        const customerName =
            customer.name ||
            "Unknown Customer";


        const currentStatus =
            order.status ||
            "Pending";


        const row =
            document.createElement("tr");


        // Customer ID
        const idCell =
            document.createElement("td");

        const idText =
            document.createElement("strong");

        idText.className =
            "order-id";

        idText.textContent =
            customerId;

        idCell.appendChild(
            idText
        );


        // Customer Name
        const nameCell =
            document.createElement("td");


        const nameButton =
            document.createElement("button");

        nameButton.type =
            "button";

        nameButton.className =
            "customer-name-btn";

        nameButton.textContent =
            `${customerName} →`;

        nameButton.addEventListener(
            "click",
            () => openOrderDetails(
                customerId
            )
        );

        nameCell.appendChild(
            nameButton
        );


        // Status
        const statusCell =
            document.createElement("td");


        const statusSelect =
            document.createElement("select");

        statusSelect.className =
            "order-status";


        const statuses = [

            "Pending",

            "Confirmed",

            "Preparing",

            "Shipped",

            "Delivered",

            "Cancelled"

        ];


        statuses.forEach(status => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                status;

            option.textContent =
                status;

            if (
                currentStatus ===
                status
            ) {

                option.selected =
                    true;

            }

            statusSelect.appendChild(
                option
            );

        });


        statusSelect.addEventListener(
            "change",
            () => {

                updateOrderStatus(
                    customerId,
                    statusSelect.value
                );

            }
        );


        statusCell.appendChild(
            statusSelect
        );


        row.appendChild(
            idCell
        );

        row.appendChild(
            nameCell
        );

        row.appendChild(
            statusCell
        );


        tbody.appendChild(
            row
        );

    });

}


// ==============================
// UPDATE PAYMENT STATUS
// ==============================

async function updatePaymentStatus() {

    if (!currentOrderId) {

        alert(
            "No order selected."
        );

        return;
    }


    const paymentStatusElement =
        document.getElementById(
            "detailPaymentStatus"
        );


    if (!paymentStatusElement) {

        alert(
            "Payment status field not found."
        );

        return;
    }


    const paymentStatus =
        paymentStatusElement.value;


    try {

        const response =
            await fetch(
                `/api/admin/orders/${currentOrderId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            payment_status:
                                paymentStatus
                        })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Could not update payment status."
            );

            return;
        }


        // Update local order data
        const order =
            allOrders.find(
                item =>
                    String(item.id) ===
                    String(currentOrderId)
            );


        if (order) {

            order.payment_status =
                paymentStatus;

        }


        alert(
            "Payment status updated successfully."
        );


        closeOrderDetails();


        // Reload orders from Firebase
        await loadOrders();


    } catch (error) {

        console.error(
            "PAYMENT STATUS ERROR:",
            error
        );

        alert(
            "Server error. Please try again."
        );

    }

}


// ==============================
// OPEN ORDER DETAILS
// ==============================

function openOrderDetails(orderId) {

    const order =
        allOrders.find(
            item => item.id === orderId
        );


    if (!order) {
        return;
    }


    currentOrderId =
        orderId;


    const customer =
        order.customer || {};

    const items =
        order.items || [];


    // ==============================
    // CUSTOMER DETAILS
    // ==============================

    setDetail(
        "detailCustomerId",
        order.id || "-"
    );

    setDetail(
        "detailCustomerName",
        customer.name || "-"
    );

    setDetail(
        "detailPhone",
        customer.phone || "-"
    );

    setDetail(
        "detailEmail",
        customer.email || "-"
    );

    setDetail(
        "detailCity",
        customer.city || "-"
    );

    setDetail(
        "detailPin",
        customer.pin || "-"
    );

    setDetail(
        "detailAddress",
        customer.address || "-"
    );

    setDetail(
        "detailNote",
        customer.note || "-"
    );


    // ==============================
    // ITEMS
    // ==============================

    const itemsElement =
        document.getElementById(
            "detailItems"
        );


    if (
        !itemsElement
    ) {
        return;
    }


    if (
        items.length === 0
    ) {

        itemsElement.textContent =
            "-";

    } else {

        itemsElement.innerHTML =
            items.map(item => {

                const quantity =
                    Number(
                        item.quantity || 1
                    );

                const price =
                    Number(
                        item.price || 0
                    );

                const itemTotal =
                    price * quantity;


                return `
                    <div class="order-detail-item">

                        <strong>
                            ${escapeHtml(
                                item.name ||
                                "Product"
                            )}
                        </strong>

                        × ${quantity}

                        <span>
                            ₹${itemTotal.toLocaleString(
                                "en-IN"
                            )}
                        </span>

                    </div>
                `;

            }).join("");

    }


    // ==============================
    // ORDER DETAILS
    // ==============================

    setDetail(
        "detailTotal",
        `₹${Number(
            order.total || 0
        ).toLocaleString("en-IN")}`
    );


    setDetail(
        "detailStatus",
        order.status ||
        "Pending"
    );


    setDetail(
        "detailDate",
        formatOrderDate(
            order.created_at
        )
    );


    // ==============================
    // PAYMENT DETAILS
    // ==============================

    setDetail(
        "detailPaymentMethod",
        order.payment_method ||
        "UPI"
    );


    const paymentStatus =
        order.payment_status ||
        "Submitted";


    const paymentStatusElement =
        document.getElementById(
            "detailPaymentStatus"
        );


    if (paymentStatusElement) {

        paymentStatusElement.value =
            paymentStatus;

    }


    setDetail(
        "detailUtr",
        order.utr_id ||
        "-"
    );


    // ==============================
    // OPEN MODAL
    // ==============================

    const modal =
        document.getElementById(
            "orderDetailsModal"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }

}


// ==============================
// CLOSE ORDER DETAILS
// ==============================

function closeOrderDetails() {

    const modal =
        document.getElementById(
            "orderDetailsModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

        modal.style.display =
            "none";

    }


    currentOrderId =
        null;

}


// ==============================
// SET DETAIL TEXT
// ==============================

function setDetail(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? "-";

    }

}


// ==============================
// FORMAT FIRESTORE DATE
// ==============================

function formatOrderDate(timestamp) {

    if (!timestamp) {
        return "-";
    }


    try {

        // Firestore timestamp returned as:
        // { _seconds: ..., _nanoseconds: ... }

        if (
            typeof timestamp === "object" &&
            timestamp._seconds !== undefined
        ) {

            const date =
                new Date(
                    timestamp._seconds * 1000
                );


            if (
                !isNaN(
                    date.getTime()
                )
            ) {

                return date.toLocaleString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

            }

        }


        // Firestore timestamp sometimes:
        // { seconds: ... }

        if (
            typeof timestamp === "object" &&
            timestamp.seconds !== undefined
        ) {

            const date =
                new Date(
                    Number(
                        timestamp.seconds
                    ) * 1000
                );


            if (
                !isNaN(
                    date.getTime()
                )
            ) {

                return date.toLocaleString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

            }

        }


        // Normal date string
        const date =
            new Date(timestamp);


        if (
            !isNaN(
                date.getTime()
            )
        ) {

            return date.toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        }

    } catch (error) {

        console.error(
            "Date formatting error:",
            error
        );

    }


    return "-";

}


// ==============================
// UPDATE ORDER STATUS
// ==============================

async function updateOrderStatus(
    id,
    status
) {

    try {

        const response =
            await fetch(
                `/api/admin/orders/${id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status: status
                        })
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Could not update order."
            );

            return;
        }


        // Update local order data
        const order =
            allOrders.find(
                item => item.id === id
            );


        if (order) {

            order.status =
                status;

        }


        // If details popup is currently open,
        // update its status too.
        const detailStatus =
            document.getElementById(
                "detailStatus"
            );


        if (
            detailStatus &&
            document.getElementById(
                "orderDetailsModal"
            )?.classList.contains("show")
        ) {

            detailStatus.textContent =
                status;

        }


        showOrderMessage(
            "Order status updated.",
            "success"
        );


    } catch (error) {

        console.error(error);

        alert(
            "Server error."
        );

    }

}


// ==============================
// MESSAGES
// ==============================

function showProductMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "productMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `message show ${type}`;


    setTimeout(() => {

        element.classList.remove(
            "show"
        );

    }, 3000);

}


function showOrderMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "orderMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `message show ${type}`;


    setTimeout(() => {

        element.classList.remove(
            "show"
        );

    }, 3000);

}


// ==============================
// BASIC HTML ESCAPING
// ==============================

function escapeHtml(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}