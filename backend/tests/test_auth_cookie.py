"""Tests for httpOnly cookie authentication."""
import pytest


@pytest.mark.asyncio
async def test_signup_sets_cookie(client):
    res = await client.post("/api/auth/signup", json={
        "email": "cookie@example.com",
        "password": "password123",
        "display_name": "CookieUser",
    })
    assert res.status_code == 201
    assert "buzzclip_session" in res.cookies


@pytest.mark.asyncio
async def test_login_sets_cookie(client):
    await client.post("/api/auth/signup", json={
        "email": "cookielogin@example.com",
        "password": "password123",
        "display_name": "CookieLogin",
    })
    res = await client.post("/api/auth/login", json={
        "email": "cookielogin@example.com",
        "password": "password123",
    })
    assert res.status_code == 200
    assert "buzzclip_session" in res.cookies


@pytest.mark.asyncio
async def test_me_with_cookie(client):
    signup = await client.post("/api/auth/signup", json={
        "email": "cookieme@example.com",
        "password": "password123",
        "display_name": "CookieMe",
    })
    assert signup.status_code == 201

    # Extract cookie from response and pass explicitly
    cookie_value = signup.cookies.get("buzzclip_session")
    assert cookie_value is not None
    res = await client.get("/api/auth/me", cookies={"buzzclip_session": cookie_value})
    assert res.status_code == 200
    assert res.json()["email"] == "cookieme@example.com"


@pytest.mark.asyncio
async def test_logout_clears_cookie(client):
    await client.post("/api/auth/signup", json={
        "email": "cookieout@example.com",
        "password": "password123",
        "display_name": "LogoutUser",
    })
    res = await client.post("/api/auth/logout")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    # After logout, /me should fail
    res = await client.get("/api/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_bearer_token_still_works(client):
    signup = await client.post("/api/auth/signup", json={
        "email": "bearer@example.com",
        "password": "password123",
        "display_name": "BearerUser",
    })
    token = signup.cookies.get("buzzclip_session")

    # Clear cookies, use bearer header
    client.cookies.clear()
    res = await client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {token}",
    })
    assert res.status_code == 200
    assert res.json()["email"] == "bearer@example.com"
