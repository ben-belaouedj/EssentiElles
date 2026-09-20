"""
End-to-end API tests covering the critical sales flows:
auth, catalog, secure checkout (server-side prices), subscriptions, admin.
"""

import pytest
from conftest import unique_email


async def _first_product(client):
    res = await client.get("/api/products?limit=1")
    assert res.status_code == 200
    products = res.json()["products"]
    assert products, "catalog must be seeded"
    return products[0]


async def _register(client, email=None):
    email = email or unique_email("marie")
    res = await client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "Test1234!",
            "firstName": "Marie",
            "lastName": "Dupont",
        },
    )
    assert res.status_code == 200, res.text
    return email, res.json()


async def _add_address(client, headers):
    res = await client.post(
        "/api/addresses",
        headers=headers,
        json={
            "label": "Maison",
            "firstName": "Marie",
            "lastName": "Dupont",
            "street": "12 Rue des Lilas",
            "city": "Paris",
            "zipCode": "75011",
            "country": "France",
        },
    )
    assert res.status_code == 200, res.text
    return res.json()


# ──────────────────────────── AUTH ────────────────────────────


@pytest.mark.asyncio
async def test_register_login_me(client):
    email, data = await _register(client)
    assert data["token"]
    assert data["user"]["role"] == "customer"

    login = await client.post(
        "/api/auth/login",
        json={"email": email, "password": "Test1234!"},
    )
    assert login.status_code == 200

    me = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {data['token']}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == email

    # Registration sends a welcome notification
    notifs = (
        await client.get(
            "/api/notifications", headers={"Authorization": f"Bearer {data['token']}"}
        )
    ).json()
    assert any("Bienvenue" in n["title"] for n in notifs)


@pytest.mark.asyncio
async def test_register_rejects_weak_password(client):
    res = await client.post(
        "/api/auth/register",
        json={
            "email": "weak@test.fr",
            "password": "123",
            "firstName": "A",
            "lastName": "B",
        },
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_wrong_password_rejected(client):
    email, _ = await _register(client)
    res = await client.post(
        "/api/auth/login",
        json={"email": email, "password": "WrongPass1!"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_password_reset_flow(client):
    email, _ = await _register(client)
    forgot = await client.post("/api/auth/forgot-password", json={"email": email})
    assert forgot.status_code == 200
    code = forgot.json().get("devCode")  # exposed outside production only
    assert code

    reset = await client.post(
        "/api/auth/reset-password",
        json={"email": email, "code": code, "newPassword": "NewPass123!"},
    )
    assert reset.status_code == 200

    login = await client.post(
        "/api/auth/login",
        json={"email": email, "password": "NewPass123!"},
    )
    assert login.status_code == 200


# ──────────────────────────── CATALOG ────────────────────────────


@pytest.mark.asyncio
async def test_catalog_seeded(client):
    res = await client.get("/api/products?limit=100")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    first = data["products"][0]
    assert {"id", "name", "price", "subscriptionPrice", "stockCount"} <= set(
        first.keys()
    )

    featured = await client.get("/api/products/featured")
    assert featured.status_code == 200
    assert isinstance(featured.json(), list)

    cats = await client.get("/api/categories")
    assert len(cats.json()) >= 4


# ──────────────────────────── CHECKOUT / ORDERS ────────────────────────────


@pytest.mark.asyncio
async def test_order_prices_are_server_side(client, auth_headers):
    """Client must NOT be able to tamper with prices."""
    product = await _first_product(client)
    await _add_address(client, auth_headers)
    addr = (await client.get("/api/addresses", headers=auth_headers)).json()[0]

    # Even if the client claims the product costs 0.01, the server must price
    # it from the catalog.
    res = await client.post(
        "/api/orders",
        headers=auth_headers,
        json={
            "items": [
                {
                    "productId": product["id"],
                    "quantity": 2,
                    "unitPrice": 0.01,  # tampered field
                    "totalPrice": 0.02,  # tampered field
                    "productName": "hack",  # tampered field
                }
            ],
            "addressId": addr["id"],
        },
    )
    assert res.status_code == 200, res.text
    order = res.json()
    expected = round(product["price"] * 2, 2)
    assert order["total"] == expected
    assert order["items"][0]["unitPrice"] == product["price"]
    assert order["items"][0]["productName"] == product["name"]


@pytest.mark.asyncio
async def test_order_decrements_stock(client, auth_headers):
    product = await _first_product(client)
    await _add_address(client, auth_headers)
    addr_id = (await client.get("/api/addresses", headers=auth_headers)).json()[0]["id"]

    res = await client.post(
        "/api/orders",
        headers=auth_headers,
        json={
            "items": [{"productId": product["id"], "quantity": 3}],
            "addressId": addr_id,
        },
    )
    assert res.status_code == 200

    after = await client.get(f"/api/products/{product['id']}")
    assert after.json()["stockCount"] == product["stockCount"] - 3


@pytest.mark.asyncio
async def test_order_rejects_foreign_address(client, auth_headers, admin_token):
    """An order cannot ship to an address owned by another user."""
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    # Admin creates an address for themselves
    await _add_address(client, admin_headers)
    admin_addr = (await client.get("/api/addresses", headers=admin_headers)).json()[0]

    product = await _first_product(client)
    res = await client.post(
        "/api/orders",
        headers=auth_headers,
        json={
            "items": [{"productId": product["id"], "quantity": 1}],
            "addressId": admin_addr["id"],
        },
    )
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_order_requires_address(client, auth_headers):
    product = await _first_product(client)
    res = await client.post(
        "/api/orders",
        headers=auth_headers,
        json={
            "items": [{"productId": product["id"], "quantity": 1}],
            "addressId": "000000000000000000000000",
        },
    )
    assert res.status_code == 404


# ──────────────────────────── SUBSCRIPTIONS ────────────────────────────


@pytest.mark.asyncio
async def test_subscription_lifecycle(client, auth_headers):
    product = await _first_product(client)
    await _add_address(client, auth_headers)
    addr_id = (await client.get("/api/addresses", headers=auth_headers)).json()[0]["id"]

    res = await client.post(
        "/api/subscriptions",
        headers=auth_headers,
        json={
            "productId": product["id"],
            "addressId": addr_id,
            "frequency": "monthly",
            "quantity": 1,
        },
    )
    assert res.status_code == 200, res.text
    sub = res.json()
    assert sub["status"] == "active"
    assert sub["unitPrice"] == product["subscriptionPrice"]

    # A first order + invoice is auto-created
    orders = (await client.get("/api/orders", headers=auth_headers)).json()
    assert len(orders) == 1
    invoices = (await client.get("/api/invoices", headers=auth_headers)).json()
    assert len(invoices) == 1

    pause = await client.post(
        f"/api/subscriptions/{sub['id']}/pause", headers=auth_headers
    )
    assert pause.json()["status"] == "paused"

    resume = await client.post(
        f"/api/subscriptions/{sub['id']}/resume", headers=auth_headers
    )
    assert resume.json()["status"] == "active"

    bad = await client.put(
        f"/api/subscriptions/{sub['id']}",
        headers=auth_headers,
        json={"frequency": "daily"},
    )
    assert bad.status_code == 400

    cancel = await client.delete(
        f"/api/subscriptions/{sub['id']}", headers=auth_headers
    )
    assert cancel.status_code == 200


@pytest.mark.asyncio
async def test_subscription_reserves_stock(client, auth_headers):
    product = await _first_product(client)
    await _add_address(client, auth_headers)
    addr_id = (await client.get("/api/addresses", headers=auth_headers)).json()[0]["id"]

    res = await client.post(
        "/api/subscriptions",
        headers=auth_headers,
        json={
            "productId": product["id"],
            "addressId": addr_id,
            "frequency": "weekly",
            "quantity": 2,
        },
    )
    assert res.status_code == 200
    after = await client.get(f"/api/products/{product['id']}")
    assert after.json()["stockCount"] == product["stockCount"] - 2


# ──────────────────────────── ADMIN ────────────────────────────


@pytest.mark.asyncio
async def test_admin_endpoints_require_admin(client, auth_headers):
    res = await client.get("/api/admin/dashboard", headers=auth_headers)
    assert res.status_code == 403

    res = await client.get(
        "/api/admin/dashboard", headers={"Authorization": "Bearer bad"}
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_admin_dashboard_and_order_flow(client, auth_headers, admin_token):
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    dashboard = await client.get("/api/admin/dashboard", headers=admin_headers)
    assert dashboard.status_code == 200
    assert "totalRevenue" in dashboard.json()

    # Customer orders
    product = await _first_product(client)
    await _add_address(client, auth_headers)
    addr_id = (await client.get("/api/addresses", headers=auth_headers)).json()[0]["id"]
    order = (
        await client.post(
            "/api/orders",
            headers=auth_headers,
            json={
                "items": [{"productId": product["id"], "quantity": 1}],
                "addressId": addr_id,
            },
        )
    ).json()

    # Admin sees all products (including inactive)
    prods = await client.get("/api/admin/products", headers=admin_headers)
    assert prods.status_code == 200
    assert prods.json()["total"] > 0

    # Admin updates order status → customer gets notified
    res = await client.put(
        f"/api/admin/orders/{order['id']}/status",
        headers=admin_headers,
        json={"status": "shipped"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "shipped"
    assert res.json()["trackingNumber"]  # generated on shipping

    notifs = (await client.get("/api/notifications", headers=auth_headers)).json()
    assert any("Expédiée" in n["title"] or "Expédiée" in n["body"] for n in notifs)


@pytest.mark.asyncio
async def test_invalid_order_status_rejected(client, admin_token):
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.put(
        "/api/admin/orders/000000000000000000000000/status",
        headers=admin_headers,
        json={"status": "not_a_status"},
    )
    assert res.status_code == 400


# ──────────────────────── SKIP NEXT DELIVERY ────────────────────────


@pytest.mark.asyncio
async def test_skip_next_delivery_postpones_and_notifies(client, auth_headers):
    """Skipping a box pushes the next delivery one cycle later + notifies."""
    product = await _first_product(client)
    await _add_address(client, auth_headers)
    addr_id = (await client.get("/api/addresses", headers=auth_headers)).json()[0]["id"]

    created = await client.post(
        "/api/subscriptions",
        headers=auth_headers,
        json={
            "productId": product["id"],
            "addressId": addr_id,
            "frequency": "monthly",
            "quantity": 1,
        },
    )
    assert created.status_code == 200, created.text
    sub = created.json()
    original_next = sub["nextDeliveryDate"]

    skipped = await client.post(
        f"/api/subscriptions/{sub['id']}/skip", headers=auth_headers
    )
    assert skipped.status_code == 200, skipped.text
    updated = skipped.json()

    assert updated["nextDeliveryDate"] > original_next
    assert updated["skippedDeliveries"] == 1
    assert updated["status"] == "active"

    notifications = (
        await client.get("/api/notifications", headers=auth_headers)
    ).json()
    assert any("report" in n["title"].lower() for n in notifications)


@pytest.mark.asyncio
async def test_skip_next_delivery_requires_active_subscription(client, auth_headers):
    product = await _first_product(client)
    await _add_address(client, auth_headers)
    addr_id = (await client.get("/api/addresses", headers=auth_headers)).json()[0]["id"]

    created = await client.post(
        "/api/subscriptions",
        headers=auth_headers,
        json={
            "productId": product["id"],
            "addressId": addr_id,
            "frequency": "weekly",
            "quantity": 1,
        },
    )
    sub = created.json()
    await client.post(f"/api/subscriptions/{sub['id']}/pause", headers=auth_headers)

    blocked = await client.post(
        f"/api/subscriptions/{sub['id']}/skip", headers=auth_headers
    )
    assert blocked.status_code == 400

    other = await client.post(
        "/api/subscriptions/000000000000000000000000/skip", headers=auth_headers
    )
    assert other.status_code in (400, 404)
