"""
Tests for health check endpoints
"""

import pytest


@pytest.mark.asyncio
async def test_health_check(client):
    """Test basic health check endpoint"""
    response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert data["service"] == "EssentiElles API"


@pytest.mark.asyncio
async def test_detailed_health_check(client):
    """Test detailed health check with database status"""
    response = await client.get("/health/detailed")

    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "checks" in data
    assert "database" in data["checks"]
    assert "environment" in data["checks"]


@pytest.mark.asyncio
async def test_metrics_endpoint(client):
    """Test metrics endpoint"""
    response = await client.get("/metrics")

    assert response.status_code == 200
    data = response.json()
    assert "timestamp" in data
    assert "uptime_seconds" in data
