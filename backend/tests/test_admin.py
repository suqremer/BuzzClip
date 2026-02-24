"""Tests for admin authorization."""
import pytest

from tests.conftest import extract_token


@pytest.mark.asyncio
async def test_admin_endpoint_requires_auth(client):
    res = await client.get("/api/admin/reports")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_admin_endpoint_requires_admin_role(client):
    signup = await client.post("/api/auth/signup", json={
        "email": "nonadmin@example.com",
        "password": "password123",
        "display_name": "NonAdmin",
    })
    token = extract_token(signup)

    res = await client.get("/api/admin/reports", headers={
        "Authorization": f"Bearer {token}",
    })
    assert res.status_code == 403
