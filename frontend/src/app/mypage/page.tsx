"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPatch } from "@/lib/api";
import type { Video } from "@/types/video";
import { VideoCard } from "@/components/video/VideoCard";

interface Profile {
  submitted_videos: Video[];
  voted_videos: Video[];
}

function DisplayNameEditor({
  currentName,
  onSaved,
}: {
  currentName: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 50) {
      setError("1〜50文字で入力してください");
      return;
    }
    if (trimmed === currentName) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiPatch("/api/auth/me", { display_name: trimmed });
      await onSaved();
      setEditing(false);
    } catch {
      setError("名前の変更に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-gray-500">{currentName}</p>
        <button
          onClick={() => {
            setName(currentName);
            setEditing(true);
          }}
          className="text-gray-400 hover:text-indigo-600"
          title="名前を変更"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          autoFocus
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "..." : "保存"}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          取消
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function MyPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    apiGet<Profile>("/api/auth/profile")
      .then((data) => setProfile(data))
      .catch(() => setError("プロフィールの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-800">ログインが必要です</h1>
        <p className="mt-3 text-gray-500">
          マイページを表示するにはログインしてください。
        </p>
        <Link
          href="/auth/signin"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
        >
          ログインする
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">マイページ</h1>
      <div className="mt-1">
        <DisplayNameEditor
          currentName={user.display_name}
          onSaved={refreshUser}
        />
      </div>

      {/* 投稿した動画 */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold">投稿した動画</h2>
        {profile && profile.submitted_videos.length > 0 ? (
          <div className="space-y-4">
            {profile.submitted_videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-gray-400">
            まだ動画を投稿していません。
          </p>
        )}
      </section>

      {/* いいねした動画 */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold">いいねした動画</h2>
        {profile && profile.voted_videos.length > 0 ? (
          <div className="space-y-4">
            {profile.voted_videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-gray-400">
            まだ動画にいいねしていません。
          </p>
        )}
      </section>
    </div>
  );
}
