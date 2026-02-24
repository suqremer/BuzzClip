import pytest

from tests.conftest import extract_token


async def _signup(client, email="user@example.com", display_name="TestUser"):
    res = await client.post("/api/auth/signup", json={
        "email": email,
        "password": "password123",
        "display_name": display_name,
    })
    return res.json(), extract_token(res)


@pytest.mark.asyncio
async def test_get_public_profile(client):
    data, token = await _signup(client)
    user_id = data["user"]["id"]

    # Submit a video so the profile has content
    await client.post(
        "/api/videos",
        json={
            "url": "https://x.com/user/status/111222333",
            "category_slugs": [],
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    res = await client.get(f"/api/users/{user_id}")
    assert res.status_code == 200
    body = res.json()
    assert body["user"]["id"] == user_id
    assert body["user"]["display_name"] == "TestUser"
    assert body["total"] == 1
    assert len(body["submitted_videos"]) == 1


@pytest.mark.asyncio
async def test_get_public_profile_not_found(client):
    res = await client.get("/api/users/nonexistent-id-12345")
    assert res.status_code == 404
