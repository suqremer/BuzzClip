"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { apiGet, apiPost, apiPatch, apiUpload, apiDelete } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";
import type { Video } from "@/types/video";
import type { Playlist } from "@/types/playlist";
import { VideoCard } from "@/components/video/VideoCard";
import { BadgeList } from "@/components/social/BadgeList";
import { useT } from "@/hooks/useTranslation";
import { t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";

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
      setError(t("avatarFormats"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(t("avatarSizeLimit"));
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
      setError(t("uploadFailed"));
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
      setError(t("deleteFailed"));
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
            className="h-20 w-20 rounded-full object-cover ring-2 ring-border-main group-hover:ring-brand"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-medium text-2xl font-bold text-brand-text ring-2 ring-border-main group-hover:ring-brand">
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
          className="text-xs text-text-muted hover:text-red-500"
        >
          {t("deleteAvatar")}
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
      setError(t("nameLength"));
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
    } catch (e) {
      setError(e instanceof Error ? e.message : t("nameChangeFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-text-secondary">{currentName}</p>
        <button
          onClick={() => {
            setName(currentName);
            setEditing(true);
          }}
          className="text-text-muted hover:text-brand-text"
          title={t("changeName")}
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
          className="rounded border border-input-border px-2 py-1 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {saving ? "..." : t("save")}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="rounded border border-input-border px-3 py-1 text-xs font-medium text-text-primary hover:bg-hover-bg"
        >
          {t("cancel")}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function VideoEditForm({
  video,
  onSave,
  onCancel,
}: {
  video: Video;
  onSave: (updated: Video) => void;
  onCancel: () => void;
}) {
  const [comment, setComment] = useState(video.comment ?? "");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    video.categories.map((c) => c.slug),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleCategory = (slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < 3
          ? [...prev, slug]
          : prev,
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await apiPatch<Video>(`/api/videos/${video.id}`, {
        comment: comment.trim() || null,
        category_slugs: selectedSlugs,
      });
      onSave(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("editFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-brand-medium bg-brand-light/30 p-4">
      <p className="mb-3 text-sm font-medium text-text-primary">{t("editPost")}</p>
      <div className="mb-3">
        <label className="mb-1 block text-xs text-text-secondary">{t("commentMax200")}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={200}
          rows={2}
          className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          placeholder={t("comment")}
        />
      </div>
      <div className="mb-4">
        <label className="mb-1 block text-xs text-text-secondary">{t("categoryMax3")}</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const selected = selectedSlugs.includes(cat.slug);
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => toggleCategory(cat.slug)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  selected
                    ? "bg-brand text-white"
                    : "bg-chip-bg text-text-primary hover:bg-chip-hover"
                }`}
              >
                {cat.icon} {cat.nameJa}
              </button>
            );
          })}
        </div>
      </div>
      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-brand px-4 py-2 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {saving ? t("saving") : t("save")}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-input-border px-4 py-2 text-xs font-medium text-text-primary hover:bg-hover-bg"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

export default function MyPage() {
  useT(); // subscribe to locale changes for sub-components using t() directly
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    apiGet<Profile>("/api/auth/profile")
      .then((data) => setProfile(data))
      .catch(() => setError(t("profileError")))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await apiDelete(`/api/videos/${videoId}`);
      setProfile((prev) =>
        prev
          ? { ...prev, submitted_videos: prev.submitted_videos.filter((v) => v.id !== videoId) }
          : prev,
      );
    } catch {
      alert(t("deleteFailed"));
    }
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideoId(video.id);
  };

  const handleEditSave = (updated: Video) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            submitted_videos: prev.submitted_videos.map((v) =>
              v.id === updated.id ? updated : v,
            ),
          }
        : prev,
    );
    setEditingVideoId(null);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-medium border-t-brand" role="status" aria-label={t("loading")} />
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
        <h1 className="text-2xl font-bold text-text-heading">{t("loginRequired")}</h1>
        <p className="mt-3 text-text-secondary">
          {t("loginRequiredDesc")}
        </p>
        <Link
          href="/auth/signin"
          className="mt-6 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-hover"
        >
          {t("loginButton")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">{t("myPage")}</h1>
      <div className="mt-4 flex items-center gap-4">
        <AvatarEditor
          avatarUrl={user.avatar_url}
          displayName={user.display_name}
          onChanged={refreshUser}
        />
        <div>
          <DisplayNameEditor
            currentName={user.display_name}
            onSaved={refreshUser}
          />
          <div className="mt-2">
            <BadgeList userId={user.id} />
          </div>
        </div>
      </div>

      {/* フォロー中 */}
      <FollowingList />

      {/* プレイリスト */}
      <PlaylistManagement />

      {/* 投稿した動画 */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold">{t("submittedVideos")}</h2>
        {profile && profile.submitted_videos.length > 0 ? (
          <div className="space-y-4">
            {profile.submitted_videos.map((video) => (
              <div key={video.id} className="space-y-2">
                <VideoCard video={video} onDelete={handleDeleteVideo} onEdit={handleEditVideo} />
                {editingVideoId === video.id && (
                  <VideoEditForm
                    video={video}
                    onSave={handleEditSave}
                    onCancel={() => setEditingVideoId(null)}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-text-muted">
            {t("noSubmitted")}
          </p>
        )}
      </section>

      {/* いいねした動画 */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold">{t("likedVideos")}</h2>
        {profile && profile.voted_videos.length > 0 ? (
          <div className="space-y-4">
            {profile.voted_videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-text-muted">
            {t("noLiked")}
          </p>
        )}
      </section>

      {/* 表示設定 */}
      <CategoryVisibilitySettings />

      {/* ミュート管理 */}
      <MuteManagement />

      {/* フィードバック */}
      <section className="mt-10">
        <Link
          href="/feedback"
          className="inline-flex items-center gap-2 rounded-lg border border-border-main px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-hover-bg"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {t("sendFeedback")}
        </Link>
      </section>
    </div>
  );
}

function PlaylistManagement() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!user) return;
    apiGet<{ playlists: Playlist[] }>("/api/playlists")
      .then((data) => setPlaylists(data.playlists))
      .catch((e) => { console.error("Failed to fetch playlists:", e); })
      .finally(() => setLoading(false));
  }, [user]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const pl = await apiPost<Playlist>("/api/playlists", { name: newName.trim() });
      setPlaylists((prev) => [pl, ...prev]);
      setNewName("");
    } catch {
      setCreateError(t("createListFailed"));
      setTimeout(() => setCreateError(""), 3000);
    } finally {
      setCreating(false);
    }
  };

  if (!user) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-bold">{t("myList")}</h2>
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t("newListName")}
          maxLength={100}
          className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {t("create")}
        </button>
      </div>
      {createError && (
        <p className="mb-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{createError}</p>
      )}
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-medium border-t-brand" />
        </div>
      ) : playlists.length === 0 ? (
        <p className="py-4 text-center text-sm text-text-muted">{t("noLists")}</p>
      ) : (
        <div className="space-y-2">
          {playlists.map((pl) => (
            <Link
              key={pl.id}
              href={`/list/${pl.id}`}
              className="flex items-center justify-between rounded-lg border border-border-main px-4 py-3 transition hover:bg-hover-bg"
            >
              <div>
                <span className="text-sm font-medium text-text-primary">{pl.name}</span>
                <span className="ml-2 text-xs text-text-muted">{pl.video_count} {t("items")}</span>
              </div>
              <span className="text-xs text-text-muted">{pl.is_public ? t("public") : t("private")}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryVisibilitySettings() {
  const { preferences, toggleHiddenCategory } = usePreferences();

  return (
    <section className="mt-10">
      <h2 className="mb-2 text-lg font-bold">{t("categorySettings")}</h2>
      <p className="mb-4 text-sm text-text-secondary">
        {t("categorySettingsDesc")}
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
                  ? "border-border-main bg-surface-secondary text-text-muted line-through"
                  : "border-brand-medium bg-surface text-text-primary hover:border-brand"
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="flex-1 text-left">{t(cat.slug as TranslationKey)}</span>
              {hidden ? (
                <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      .catch((e) => { console.error("Failed to fetch muted users:", e); })
      .finally(() => setLoading(false));
  }, [preferences.mutedUserIds.length]);

  const handleUnmute = async (userId: string) => {
    await unmuteUser(userId);
    setMutedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <section className="mt-10">
      <h2 className="mb-2 text-lg font-bold">{t("mutedUsers")}</h2>
      <p className="mb-4 text-sm text-text-secondary">
        {t("mutedUsersDesc")}
      </p>
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-medium border-t-brand" />
        </div>
      ) : mutedUsers.length === 0 ? (
        <p className="py-4 text-center text-sm text-text-muted">
          {t("noMuted")}
        </p>
      ) : (
        <div className="space-y-2">
          {mutedUsers.map((mu) => (
            <div key={mu.id} className="flex items-center justify-between rounded-lg border border-border-main px-4 py-3">
              <div className="flex items-center gap-3">
                {mu.avatar_url ? (
                  <img src={mu.avatar_url} alt={mu.display_name} className="h-8 w-8 rounded-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-medium text-sm font-bold text-brand-text">
                    {mu.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-text-primary">{mu.display_name}</span>
              </div>
              <button
                onClick={() => handleUnmute(mu.id)}
                className="rounded-lg border border-input-border px-3 py-1 text-xs font-medium text-text-primary transition hover:bg-hover-bg"
              >
                {t("unmute")}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FollowingList() {
  const { user } = useAuth();
  const [users, setUsers] = useState<Array<{ id: string; display_name: string; avatar_url: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiGet<{ users: Array<{ id: string; display_name: string; avatar_url: string | null }>; total: number }>(`/api/follows/${user.id}/following?per_page=100`)
      .then((data) => setUsers(data.users))
      .catch((e) => { console.error("Failed to fetch following:", e); })
      .finally(() => setLoading(false));
  }, [user]);

  const handleUnfollow = async (targetId: string) => {
    setUnfollowingId(targetId);
    try {
      await apiDelete(`/api/follows/${targetId}`);
      setUsers((prev) => prev.filter((u) => u.id !== targetId));
    } catch {
      alert(t("unfollowFailed"));
    } finally {
      setUnfollowingId(null);
    }
  };

  if (!user) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-bold">{t("following")}</h2>
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-medium border-t-brand" />
        </div>
      ) : users.length === 0 ? (
        <p className="py-4 text-center text-sm text-text-muted">
          {t("noFollowing")}
        </p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-border-main px-4 py-3">
              <Link href={`/user/${u.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.display_name} className="h-8 w-8 rounded-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-medium text-sm font-bold text-brand-text">
                    {u.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="truncate text-sm font-medium text-text-primary">{u.display_name}</span>
              </Link>
              <button
                onClick={() => handleUnfollow(u.id)}
                disabled={unfollowingId === u.id}
                className="ml-2 shrink-0 rounded-lg border border-input-border px-3 py-1 text-xs font-medium text-text-primary transition hover:bg-hover-bg disabled:opacity-50"
              >
                {unfollowingId === u.id ? "..." : t("unfollow")}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
