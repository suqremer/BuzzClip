"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPatch, apiDelete, apiPost } from "@/lib/api";
import type { PlaylistDetail } from "@/types/playlist";
import { VideoCard } from "@/components/video/VideoCard";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchPlaylist = useCallback(() => {
    setLoading(true);
    apiGet<PlaylistDetail>(`/api/playlists/${id}`)
      .then((data) => {
        setPlaylist(data);
        setEditName(data.name);
      })
      .catch(() => setError("リストが見つかりません"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  const isOwner = user && playlist && playlist.owner.id === user.id;

  const handleRename = async () => {
    if (!editName.trim()) return;
    try {
      await apiPatch(`/api/playlists/${id}`, { name: editName.trim() });
      setEditing(false);
      fetchPlaylist();
    } catch {
      setActionError("名前の変更に失敗しました");
      setTimeout(() => setActionError(""), 3000);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm("このリストを削除しますか？")) return;
    try {
      await apiDelete(`/api/playlists/${id}`);
      router.push("/mypage");
    } catch {
      setActionError("削除に失敗しました");
      setTimeout(() => setActionError(""), 3000);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    try {
      await apiDelete(`/api/playlists/${id}/videos/${videoId}`);
      fetchPlaylist();
    } catch (e) {
      console.error("Failed to remove video from playlist:", e);
    }
  };

  const handleTogglePublic = async () => {
    if (!playlist) return;
    try {
      await apiPatch(`/api/playlists/${id}`, { is_public: !playlist.is_public });
      fetchPlaylist();
    } catch (e) {
      console.error("Failed to toggle playlist visibility:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" role="status" aria-label="読み込み中" />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg text-gray-500">{error || "リストが見つかりません"}</p>
        <Link href="/mypage" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
          マイページに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/mypage" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        マイページに戻る
      </Link>

      <div className="mb-6 flex items-center justify-between">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-lg font-bold focus:border-indigo-500 focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <button onClick={handleRename} className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700">
              保存
            </button>
            <button onClick={() => setEditing(false)} className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600">
              取消
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{playlist.name}</h1>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {playlist.is_public ? "公開" : "非公開"}
            </span>
          </div>
        )}
        {isOwner && !editing && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePublic}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              {playlist.is_public ? "非公開にする" : "公開する"}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              名前変更
            </button>
            <button
              onClick={handleDeletePlaylist}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
            >
              削除
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{actionError}</p>
      )}

      <p className="mb-4 text-sm text-gray-400">{playlist.video_count}件の動画</p>

      {playlist.videos.length > 0 ? (
        <div className="space-y-4">
          {playlist.videos.map((video) => (
            <div key={video.id} className="relative">
              <VideoCard video={video} />
              {isOwner && (
                <button
                  onClick={() => handleRemoveVideo(video.id)}
                  className="absolute right-2 top-2 rounded-full bg-white/80 p-1 text-gray-400 shadow hover:text-red-500"
                  title="リストから削除"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-gray-400">
          このリストにはまだ動画がありません。
        </p>
      )}
    </div>
  );
}
