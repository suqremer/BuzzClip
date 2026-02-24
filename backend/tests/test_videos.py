import pytest

from tests.conftest import extract_token


async def _signup_and_get_token(client) -> str:
    res = await client.post("/api/auth/signup", json={
        "email": "video@example.com",
        "password": "password123",
        "display_name": "VideoUser",
    })
    return extract_token(res)


@pytest.mark.asyncio
async def test_submit_video_success(client):
    token = await _signup_and_get_token(client)
    res = await client.post(
        "/api/videos",
        json={
            "url": "https://x.com/user/status/123456789",
            "category_slugs": [],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["external_id"] == "123456789"
    assert "id" in data


@pytest.mark.asyncio
async def test_submit_video_no_auth(client):
    res = await client.post("/api/videos", json={
        "url": "https://x.com/user/status/123456789",
        "category_slugs": [],
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_submit_invalid_url(client):
    token = await _signup_and_get_token(client)
    res = await client.post(
        "/api/videos",
        json={
            "url": "https://instagram.com/p/abc123",
            "category_slugs": [],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_list_videos(client):
    res = await client.get("/api/videos")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert "has_next" in data


@pytest.mark.asyncio
async def test_health_check(client):
    res = await client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
