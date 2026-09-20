"""
Pytest configuration — runs the app against an embedded in-memory database,
no external MongoDB server required.
"""

import os

# Must be set BEFORE importing the app so server.py picks the memory backend.
os.environ.setdefault("DB_BACKEND", "memory")
os.environ.setdefault("JWT_SECRET", "test_secret_key")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SEED_DEMO_DATA", "false")
os.environ.setdefault("RATE_LIMIT_PER_MINUTE", "0")

import uuid

import pytest
from asgi_lifespan import LifespanManager
from httpx import ASGITransport, AsyncClient

import server


@pytest.fixture
async def client():
    """HTTP client bound to the FastAPI app (lifespan = seeds + indexes)."""
    async with LifespanManager(server.app):
        async with AsyncClient(
            transport=ASGITransport(app=server.app),
            base_url="http://test",
        ) as ac:
            yield ac


@pytest.fixture
async def admin_token(client):
    res = await client.post(
        "/api/auth/login",
        json={"email": "admin@livrella.com", "password": "Admin2026!"},
    )
    assert res.status_code == 200, res.text
    return res.json()["token"]


def unique_email(prefix="user") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}@test.fr"


@pytest.fixture
async def auth_headers(client):
    """Register a fresh customer and return its Authorization headers."""
    res = await client.post(
        "/api/auth/register",
        json={
            "email": unique_email("customer"),
            "password": "Test1234!",
            "firstName": "Jeanne",
            "lastName": "Test",
        },
    )
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['token']}"}
