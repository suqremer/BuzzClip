"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { apiGet, apiPatch, apiUpload, apiDelete } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";
import type { Video } from "@/types/video";
import { VideoCard } from "@/components/video/VideoCard";

interface Profile {
  submitted_videos: Video[];
  voted_videos: Video[];
}

function AvatarEditor({
  avatarUrl,
  displayName,
  onChanged,
}: {
  avatarUrl: string | null;
  displayName: string;
  onChanged: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("JPEG、PNG、WebP のみ対応しています");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("2MB以下の画像を選んでください");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      await apiUpload("/api/auth/me/avatar", formData);
      await onChanged();
    } catch {
      setError("アップロードに失敗しました");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async () => {
    setUploading(true);
    setError("");
    try {
      await apiDelete("/api/auth/me/avatar");
      await onChanged();
    } catch {
      setError("削除に失敗しました");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="group relative cursor-pointer">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-20 w-20 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-indigo-400"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 ring-2 ring-gray-200 group-hover:ring-indigo-400">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition group-hover:bg-black/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100"
          >
            <path d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8z" />
            <path d="M10 14a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        </div>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </label>
      {avatarUrl && (
        <button
          onClick={handleDelete}
          disabled={uploading}
          className="text-xs text-gray-400 hover:text-red-500"
        >
          画像を削除
        </button>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
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
      <div className="mt-4 flex items-center gap-4">
        <AvatarEditor
          avatarUrl={user.avatar_url}
          displayName={user.display_name}
          onChanged={refreshUser}
        />
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

      {/* 表示設定 */}
      <CategoryVisibilitySettings />

      {/* ミュート管理 */}
      <MuteManagement />
    </div>
  );
}

function CategoryVisibilitySettings() {
  const { preferences, toggleHiddenCategory } = usePreferences();

  return (
    <section className="mt-10">
      <h2 className="mb-2 text-lg font-bold">カテゴリ表示設定</h2>
      <p className="mb-4 text-sm text-gray-500">
        苦手なジャンルを非表示にできます。非表示にしたカテゴリはランキングのタブから消え、「すべて」表示でもフィルタされます。
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const hidden = preferences.hiddenCategorySlugs.includes(cat.slug);
          return (
            <button
              key={cat.slug}
              onClick={() => toggleHiddenCategory(cat.slug)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                hidden
                  ? "border-gray-200 bg-gray-50 text-gray-400 line-through"
                  : "border-indigo-200 bg-white text-gray-700 hover:border-indigo-400"
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="flex-1 text-left">{cat.nameJa}</span>
              {hidden ? (
                <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.11 6.11m3.769 3.769l4.242 4.242M6.11 6.11L3 3m3.11 3.11l4.243 4.243m4.242 4.242L21 21" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MuteManagement() {
  const { preferences, unmuteUser } = usePreferences();
  const [mutedUsers, setMutedUsers] = useState<Array<{ id: string; display_name: string; avatar_url: string | null }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preferences.mutedUserIds.length === 0) {
      setMutedUsers([]);
      return;
    }
    setLoading(true);
    apiGet<{ muted_users: Array<{ id: string; display_name: string; avatar_url: string | null }> }>("/api/auth/me/mutes")
      .then((data) => setMutedUsers(data.muted_users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [preferences.mutedUserIds.length]);

  const handleUnmute = async (userId: string) => {
    await unmuteUser(userId);
    setMutedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <section className="mt-10">
      <h2 className="mb-2 text-lg font-bold">ミュート中のユーザー</h2>
      <p className="mb-4 text-sm text-gray-500">
        ミュートしたユーザーの投稿はランキングに表示されなくなります。
      </p>
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : mutedUsers.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">
          ミュート中のユーザーはいません。
        </p>
      ) : (
        <div className="space-y-2">
          {mutedUsers.map((mu) => (
            <div key={mu.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
              <div className="flex items-center gap-3">
                {mu.avatar_url ? (
                  <img src={mu.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                    {mu.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">{mu.display_name}</span>
              </div>
              <button
                onClick={() => handleUnmute(mu.id)}
                className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
              >
                ミュート解除
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
