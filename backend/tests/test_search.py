import pytest


async def _signup_and_get_token(client, email="search@example.com") -> str:
    res = await client.post("/api/auth/signup", json={
        "email": email,
        "password": "password123",
        "display_name": "SearchUser",
    })
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_search_videos_by_title(client):
    token = await _signup_and_get_token(client)

    # Submit a video with a title
    await client.post(
        "/api/videos",
        json={
            "url": "https://x.com/user/status/555666777",
            "category_slugs": [],
            "title": "Amazing cat compilation",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    # Search should find it
    res = await client.get("/api/videos", params={"q": "cat"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    titles = [v["title"] for v in data["items"]]
    assert any("cat" in (t or "").lower() for t in titles)


@pytest.mark.asyncio
async def test_search_videos_no_results(client):
    res = await client.get("/api/videos", params={"q": "xyznonexistent"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 0
    assert data["items"] == []
