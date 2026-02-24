"""Tests for playlist endpoints."""
import pytest

from tests.conftest import extract_token


async def _signup(client, email="playlist@example.com"):
    res = await client.post("/api/auth/signup", json={
        "email": email,
        "password": "password123",
        "display_name": "PlaylistUser",
    })
    return extract_token(res)


@pytest.mark.asyncio
async def test_list_playlists_autocreates_default(client):
    token = await _signup(client)
    res = await client.get("/api/playlists", headers={
        "Authorization": f"Bearer {token}",
    })
    assert res.status_code == 200
    playlists = res.json()["playlists"]
    assert len(playlists) == 1
    assert playlists[0]["name"] == "お気に入り"


@pytest.mark.asyncio
async def test_create_playlist(client):
    token = await _signup(client, "plcreate@example.com")
    res = await client.post("/api/playlists", json={
        "name": "マイリスト",
        "is_public": True,
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    assert res.json()["name"] == "マイリスト"


@pytest.mark.asyncio
async def test_create_duplicate_playlist_name(client):
    token = await _signup(client, "pldup@example.com")
    await client.post("/api/playlists", json={
        "name": "重複テスト",
        "is_public": False,
    }, headers={"Authorization": f"Bearer {token}"})

    res = await client.post("/api/playlists", json={
        "name": "重複テスト",
        "is_public": False,
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_playlists_require_auth(client):
    res = await client.get("/api/playlists")
    assert res.status_code == 401
