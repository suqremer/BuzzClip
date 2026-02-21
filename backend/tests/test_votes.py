import pytest


async def _create_user_and_video(client) -> tuple[str, str]:
    """Create a user and submit a video, return (token, video_id)."""
    signup = await client.post("/api/auth/signup", json={
        "email": "voter@example.com",
        "password": "password123",
        "display_name": "Voter",
    })
    token = signup.json()["access_token"]

    video = await client.post(
        "/api/videos",
        json={
            "url": "https://x.com/user/status/999888777",
            "category_slugs": [],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    video_id = video.json()["id"]
    return token, video_id


@pytest.mark.asyncio
async def test_vote_and_unvote(client):
    token, video_id = await _create_user_and_video(client)

    # Vote
    res = await client.post(
        f"/api/votes/{video_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["user_voted"] is True
    assert res.json()["new_vote_count"] == 1

    # Vote again - should be 409
    res = await client.post(
        f"/api/votes/{video_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 409

    # Unvote
    res = await client.delete(
        f"/api/votes/{video_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["user_voted"] is False
    assert res.json()["new_vote_count"] == 0


@pytest.mark.asyncio
async def test_vote_no_auth(client):
    res = await client.post("/api/votes/some-id")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_vote_nonexistent_video(client):
    signup = await client.post("/api/auth/signup", json={
        "email": "ghost@example.com",
        "password": "password123",
        "display_name": "Ghost",
    })
    token = signup.json()["access_token"]

    res = await client.post(
        "/api/votes/nonexistent-id",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 404
