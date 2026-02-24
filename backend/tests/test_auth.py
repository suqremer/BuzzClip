import pytest

from tests.conftest import extract_token


@pytest.mark.asyncio
async def test_signup_success(client):
    res = await client.post("/api/auth/signup", json={
        "email": "test@example.com",
        "password": "password123",
        "display_name": "テストユーザー",
    })
    assert res.status_code == 201
    data = res.json()
    assert "buzzclip_session" in res.cookies
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["display_name"] == "テストユーザー"


@pytest.mark.asyncio
async def test_signup_duplicate_email(client):
    await client.post("/api/auth/signup", json={
        "email": "dup@example.com",
        "password": "password123",
        "display_name": "User1",
    })
    res = await client.post("/api/auth/signup", json={
        "email": "dup@example.com",
        "password": "password456",
        "display_name": "User2",
    })
    assert res.status_code == 400  # Generic error to prevent email enumeration


@pytest.mark.asyncio
async def test_signup_short_password(client):
    res = await client.post("/api/auth/signup", json={
        "email": "short@example.com",
        "password": "1234567",
        "display_name": "User",
    })
    assert res.status_code == 422  # Pydantic validation


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/api/auth/signup", json={
        "email": "login@example.com",
        "password": "password123",
        "display_name": "LoginUser",
    })
    res = await client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "password123",
    })
    assert res.status_code == 200
    assert "buzzclip_session" in res.cookies


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/auth/signup", json={
        "email": "wrong@example.com",
        "password": "password123",
        "display_name": "User",
    })
    res = await client.post("/api/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrongpassword",
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_endpoint(client):
    signup = await client.post("/api/auth/signup", json={
        "email": "me@example.com",
        "password": "password123",
        "display_name": "MeUser",
    })
    token = extract_token(signup)
    res = await client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {token}",
    })
    assert res.status_code == 200
    assert res.json()["email"] == "me@example.com"


@pytest.mark.asyncio
async def test_me_no_auth(client):
    res = await client.get("/api/auth/me")
    assert res.status_code == 401
