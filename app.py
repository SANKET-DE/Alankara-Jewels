from flask import (
    Flask,
    request,
    jsonify,
    render_template,
    session,
    redirect
)

import firebase_admin
from firebase_admin import credentials, firestore
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from datetime import timedelta


from dotenv import load_dotenv

load_dotenv()


# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)

app.secret_key = os.environ["SECRET_KEY"]

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_SAMESITE="Lax"
)
app.permanent_session_lifetime = timedelta(minutes=30)


limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=[]
)

@app.route("/robots.txt")
def robots_txt():
    return app.send_static_file("robots.txt")


@app.route("/sitemap.xml")
def sitemap():
    return render_template("sitemap.xml")

# =========================================================
# FIREBASE
# =========================================================

db = None

try:
    if not firebase_admin._apps:

        cred = credentials.Certificate(
            "serviceAccountKey.json"
        )

        firebase_admin.initialize_app(
            cred
        )

    db = firestore.client()

    print("Firebase connected successfully")

except Exception as e:

    print(
        "Firebase connection error:",
        e
    )


# =========================================================
# ADMIN LOGIN
# =========================================================

ADMIN_USERNAME = os.environ["ADMIN_USERNAME"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]


def admin_required():

    return session.get(
        "admin_logged_in",
        False
    )


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# =========================================================
# ADMIN LOGIN
# =========================================================

@app.route(
    "/admin/login",
    methods=["GET", "POST"]
)
@limiter.limit("5 per minute")
def admin_login():

    if request.method == "GET":
        return render_template(
            "admin_login.html"
        )

    data = request.get_json(silent=True) or {}

    username = str(
        data.get("username", "")
    ).strip()

    password = str(
        data.get("password", "")
    ).strip()

    if (
        username == ADMIN_USERNAME
        and
        password == ADMIN_PASSWORD
    ):

        session.permanent = True
        session["admin_logged_in"] = True

        return jsonify({
            "success": True,
            "message": "Login successful"
        })

    return jsonify({
        "success": False,
        "message": "Invalid username or password"
    }), 401

# =========================================================
# ADMIN LOGOUT
# =========================================================

@app.route(
    "/admin/logout"
)
def admin_logout():

    session.pop(
        "admin_logged_in",
        None
    )

    return redirect(
        "/admin/login"
    )


# =========================================================
# ADMIN DASHBOARD
# =========================================================

@app.route("/admin")
def admin_dashboard():

    if not admin_required():

        return redirect(
            "/admin/login"
        )

    return render_template(
        "admin.html"
    )


# =========================================================
# PRODUCTS
# =========================================================

@app.route(
    "/api/products",
    methods=["GET"]
)
def get_products():

    if db is None:

        return jsonify({
            "success": False,
            "message":
                "Firebase is not connected"
        }), 500

    try:

        products_ref = (
            db.collection("products")
            .stream()
        )

        products = []

        for document in products_ref:

            product = document.to_dict()

            product["id"] = document.id

            products.append(
                product
            )

        return jsonify({
            "success": True,
            "products": products
        })

    except Exception as e:

        print(
            "GET PRODUCTS ERROR:",
            e
        )

        return jsonify({
            "success": False,
            "message":
                "Could not load products"
        }), 500


# =========================================================
# ADMIN ADD PRODUCT
# =========================================================

@app.route(
    "/api/admin/products",
    methods=["POST"]
)
def add_product():

    if not admin_required():

        return jsonify({
            "success": False,
            "message": "Unauthorized"
        }), 401

    if db is None:

        return jsonify({
            "success": False,
            "message":
                "Firebase is not connected"
        }), 500

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message":
                "Invalid product data"
        }), 400

    try:

        document = (
            db.collection("products")
            .add(data)
        )

        product_id = document[1].id

        return jsonify({
            "success": True,
            "message":
                "Product added successfully",
            "product_id":
                product_id
        })

    except Exception as e:

        print(
            "ADD PRODUCT ERROR:",
            e
        )

        return jsonify({
            "success": False,
            "message":
                "Could not add product"
        }), 500


# =========================================================
# ADMIN UPDATE PRODUCT
# =========================================================

@app.route(
    "/api/admin/products/<product_id>",
    methods=["PUT"]
)
def update_product(product_id):

    if not admin_required():

        return jsonify({
            "success": False,
            "message": "Unauthorized"
        }), 401

    if db is None:

        return jsonify({
            "success": False,
            "message":
                "Firebase is not connected"
        }), 500

    data = request.get_json() or {}

    try:

        product_ref = (
            db.collection("products")
            .document(product_id)
        )

        if not product_ref.get().exists:

            return jsonify({
                "success": False,
                "message":
                    "Product not found"
            }), 404

        product_ref.update(
            data
        )

        return jsonify({
            "success": True,
            "message":
                "Product updated successfully"
        })

    except Exception as e:

        print(
            "UPDATE PRODUCT ERROR:",
            e
        )

        return jsonify({
            "success": False,
            "message":
                "Could not update product"
        }), 500


# =========================================================
# ADMIN DELETE PRODUCT
# =========================================================

@app.route(
    "/api/admin/products/<product_id>",
    methods=["DELETE"]
)
def delete_product(product_id):

    if not admin_required():

        return jsonify({
            "success": False,
            "message": "Unauthorized"
        }), 401

    if db is None:

        return jsonify({
            "success": False,
            "message":
                "Firebase is not connected"
        }), 500

    try:

        product_ref = (
            db.collection("products")
            .document(product_id)
        )

        if not product_ref.get().exists:

            return jsonify({
                "success": False,
                "message":
                    "Product not found"
            }), 404

        product_ref.delete()

        return jsonify({
            "success": True,
            "message":
                "Product deleted successfully"
        })

    except Exception as e:

        print(
            "DELETE PRODUCT ERROR:",
            e
        )

        return jsonify({
            "success": False,
            "message":
                "Could not delete product"
        }), 500


# =========================================================
# CREATE ORDER
# =========================================================

@app.route(
    "/api/orders",
    methods=["POST"]
)
def create_order():

    if db is None:

        return jsonify({
            "success": False,
            "message":
                "Firebase is not connected"
        }), 500

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message":
                "Invalid order data"
        }), 400

    customer = data.get(
        "customer",
        {}
    )

    items = data.get(
        "items",
        []
    )

    total = data.get(
        "total",
        0
    )

    # =====================================================
    # PAYMENT INFORMATION
    # =====================================================
    # IMPORTANT:
    # Customer orders always start with Submitted.
    # Only admin can later change it to Verified/Failed.

    payment_method = "UPI"

    payment_status = "Submitted"

    utr_id = str(
        data.get(
            "utr_id",
            ""
        )
    ).strip()

    # -----------------------------
    # VALIDATION
    # -----------------------------

    if not customer.get("name"):

        return jsonify({
            "success": False,
            "message":
                "Customer name is required"
        }), 400

    if not customer.get("phone"):

        return jsonify({
            "success": False,
            "message":
                "Phone number is required"
        }), 400

    if not items:

        return jsonify({
            "success": False,
            "message":
                "Cart is empty"
        }), 400

    if payment_method == "UPI" and not utr_id:

        return jsonify({
            "success": False,
            "message":
                "UPI transaction ID is required"
        }), 400

    order = {

        "customer": customer,

        "items": items,

        "total": total,

        "status": "Pending",

        "payment_method":
            payment_method,

        "payment_status":
            payment_status,

        "utr_id":
            utr_id,

        "created_at":
            firestore.SERVER_TIMESTAMP
    }

    try:

        document = (
            db.collection("orders")
            .add(order)
        )

        order_id = document[1].id

        return jsonify({

            "success": True,

            "message":
                "Order placed successfully",

            "order_id":
                order_id
        })

    except Exception as e:

        print(
            "CREATE ORDER ERROR:",
            e
        )

        return jsonify({
            "success": False,
            "message":
                "Could not create order"
        }), 500


# =========================================================
# CUSTOMER ORDER TRACKING
# ORDER ID + PHONE NUMBER
# =========================================================

@app.route(
    "/api/order/track",
    methods=["POST"]
)
@limiter.limit("10 per minute")

def track_order():

    if db is None:

        return jsonify({
            "success": False,
            "message":
                "Firebase is not connected"
        }), 500

    data = request.get_json() or {}

    order_id = str(
        data.get(
            "order_id",
            ""
        )
    ).strip()

    phone = str(
        data.get(
            "phone",
            ""
        )
    ).strip()

    if not order_id:

        return jsonify({
            "success": False,
            "message":
                "Order ID is required"
        }), 400

    if not phone:

        return jsonify({
            "success": False,
            "message":
                "Phone number is required"
        }), 400

    try:

        order_ref = (
            db.collection("orders")
            .document(order_id)
        )

        document = order_ref.get()

        if not document.exists:

            return jsonify({
                "success": False,
                "message":
                    "Order not found"
            }), 404

        order = document.to_dict()

        customer = order.get(
            "customer",
            {}
        )

        saved_phone = str(
            customer.get(
                "phone",
                ""
            )
        ).strip()

        if saved_phone != phone:

            return jsonify({
                "success": False,
                "message":
                    "Order ID and phone number do not match"
            }), 403

        return jsonify({

            "success": True,

            "order": {

                "id":
                    document.id,

                "items":
                    order.get(
                        "items",
                        []
                    ),

                "total":
                    order.get(
                        "total",
                        0
                    ),

                "status":
                    order.get(
                        "status",
                        "Pending"
                    ),

                "payment_method":
                    order.get(
                        "payment_method",
                        "UPI"
                    ),

                "payment_status":
                    order.get(
                        "payment_status",
                        "Submitted"
                    ),

                "utr_id":
                    order.get(
                        "utr_id",
                        ""
                    ),

                "created_at":
                    order.get(
                        "created_at"
                    )
            }
        })

    except Exception as e:

        print(
            "TRACK ORDER ERROR:",
            e
        )

        return jsonify({
            "success": False,
            "message":
                "Could not find order"
        }), 500


# =========================================================
# ADMIN ORDERS
# =========================================================

@app.route(
    "/api/admin/orders",
    methods=["GET"]
)
def get_orders():

    if not admin_required():

        return jsonify({
            "success": False,
            "message": "Unauthorized"
        }), 401

    if db is None:

        return jsonify({
            "success": False,
            "message":
                "Firebase is not connected"
        }), 500

    try:

        orders_ref = (
            db.collection("orders")
            .stream()
        )

        orders = []

        for document in orders_ref:

            order = document.to_dict()

            order["id"] = document.id

            orders.append(
                order
            )

        return jsonify({
            "success": True,
            "orders": orders
        })

    except Exception as e:

        print(
            "GET ORDERS ERROR:",
            e
        )

        return jsonify({
            "success": False,
            "message":
                "Could not load orders"
        }), 500


# =========================================================
# ADMIN UPDATE ORDER
# =========================================================

@app.route(
    "/api/admin/orders/<order_id>",
    methods=["PUT"]
)
def update_order(order_id):

    if not admin_required():

        return jsonify({
            "success": False,
            "message": "Unauthorized"
        }), 401

    if db is None:

        return jsonify({
            "success": False,
            "message":
                "Firebase is not connected"
        }), 500

    data = request.get_json() or {}

    status = data.get(
        "status"
    )

    payment_status = data.get(
        "payment_status"
    )

    allowed_statuses = [

        "Pending",

        "Confirmed",

        "Preparing",

        "Shipped",

        "Delivered",

        "Cancelled"
    ]

    allowed_payment_statuses = [

        "Submitted",

        "Verified",

        "Failed"
    ]

    if (
        status is None
        and
        payment_status is None
    ):

        return jsonify({
            "success": False,
            "message":
                "Nothing to update"
        }), 400

    if status is not None:

        if status not in allowed_statuses:

            return jsonify({
                "success": False,
                "message":
                    "Invalid order status"
            }), 400

    if payment_status is not None:

        if (
            payment_status
            not in
            allowed_payment_statuses
        ):

            return jsonify({
                "success": False,
                "message":
                    "Invalid payment status"
            }), 400

    try:

        order_ref = (
            db.collection("orders")
            .document(order_id)
        )

        if not order_ref.get().exists:

            return jsonify({
                "success": False,
                "message":
                    "Order not found"
            }), 404

        update_data = {}

        if status is not None:

            update_data[
                "status"
            ] = status

        if payment_status is not None:

            update_data[
                "payment_status"
            ] = payment_status

        order_ref.update(
            update_data
        )

        return jsonify({
            "success": True,
            "message":
                "Order updated successfully"
        })

    except Exception as e:

        print(
            "UPDATE ORDER ERROR:",
            e
        )

        return jsonify({
            "success": False,
            "message":
                "Could not update order"
        }), 500


# =========================================================
# RUN APP
# =========================================================

if __name__ == "__main__":
    app.run()