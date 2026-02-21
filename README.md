# BuzzClip

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

X(Twitter)でバズった動画をみんなで集めてランキング化するプラットフォーム

## 概要

BuzzClipは、X(Twitter)上で話題になった動画をユーザーが投稿・共有し、いいね数によるランキングで人気動画を発見できるWebアプリケーションです。URLを貼るだけでoEmbed情報を自動取得し、カテゴリ分類やトレンド機能で今注目の動画をすぐに見つけられます。

## 主な機能

- [x] **URL投稿** - XのURLを貼るだけ、oEmbedで動画情報を自動取得
- [x] **いいねランキング** - 期間別 (24h / 週間 / 月間) / Hot / トレンド
- [x] **カテゴリ分類** - 11ジャンルで動画を整理
- [x] **検索** - 動画タイトル・投稿者名で検索
- [x] **Google OAuth + メール認証** - 2種類のログイン方法に対応
- [x] **通報機能** - 不適切な動画をユーザーが通報可能
- [x] **管理画面** - 通報処理・動画管理の管理者ダッシュボード
- [x] **レスポンシブ対応** - モバイル・タブレット・デスクトップに最適化

## 技術スタック

| レイヤー | 技術 |
|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 |
| Backend | FastAPI + SQLAlchemy 2.0 (async) + Alembic |
| DB | SQLite (開発) / PostgreSQL 16 (本番) |
| Auth | JWT (python-jose) + Google OAuth (Authlib) |
| Deploy | Docker Compose / Vercel + Railway 対応 |

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/<your-username>/buzzclip.git
cd buzzclip
```

### 2. バックエンド

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env  # 環境変数を編集
uvicorn app.main:app --reload
```

バックエンドが http://localhost:8000 で起動します。

### 3. フロントエンド

```bash
cd frontend
npm install
npm run dev
```

フロントエンドが http://localhost:3000 で起動します。

### 4. Docker Compose (オプション)

```bash
cp .env.example .env  # JWT_SECRET_KEY, POSTGRES_PASSWORD を設定
docker compose up -d
```

## API概要

| メソッド | エンドポイント | 説明 |
|---|---|---|
| POST | `/api/auth/signup` | ユーザー登録 |
| POST | `/api/auth/login` | ログイン (JWT発行) |
| GET | `/api/auth/me` | ログインユーザー情報取得 |
| POST | `/api/videos` | 動画投稿 (X URL) |
| GET | `/api/videos` | 動画一覧 (検索・カテゴリ絞り込み) |
| GET | `/api/rankings` | いいねランキング (期間別) |
| GET | `/api/rankings/trending` | トレンドランキング |
| POST | `/api/votes/{video_id}` | いいね |
| GET | `/api/categories` | カテゴリ一覧 |

APIドキュメント (Swagger UI): http://localhost:8000/docs

## ライセンス

MIT
