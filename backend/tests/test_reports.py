import pytest

from tests.conftest import extract_token


async def _signup_and_get_token(client, email="report@example.com") -> str:
    res = await client.post("/api/auth/signup", json={
        "email": email,
        "password": "password123",
        "display_name": "ReportUser",
    })
    return extract_token(res)


async def _create_video(client, token: str) -> str:
    res = await client.post(
        "/api/videos",
        json={
            "url": "https://x.com/user/status/999888777",
            "category_slugs": [],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    return res.json()["id"]


@pytest.mark.asyncio
async def test_create_report_success(client):
    token = await _signup_and_get_token(client)
    video_id = await _create_video(client, token)

    res = await client.post(
        "/api/reports",
        json={"video_id": video_id, "reason": "spam"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201


@pytest.mark.asyncio
async def test_create_report_no_auth(client):
    token = await _signup_and_get_token(client)
    video_id = await _create_video(client, token)

    # Clear cookies to simulate unauthenticated request
    client.cookies.clear()
    res = await client.post(
        "/api/reports",
        json={"video_id": video_id, "reason": "spam"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_create_report_invalid_reason(client):
    token = await _signup_and_get_token(client)
    video_id = await _create_video(client, token)

    res = await client.post(
        "/api/reports",
        json={"video_id": video_id, "reason": "invalid_reason"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_create_report_duplicate(client):
    token = await _signup_and_get_token(client)
    video_id = await _create_video(client, token)

    # First report
    res = await client.post(
        "/api/reports",
        json={"video_id": video_id, "reason": "spam"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201

    # Duplicate report
    res = await client.post(
        "/api/reports",
        json={"video_id": video_id, "reason": "inappropriate"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 409
