"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

interface PlaylistStatus {
  playlist_id: string;
  playlist_name: string;
  contains: boolean;
}

interface AddToPlaylistButtonProps {
  videoId: string;
}

export function AddToPlaylistButton({ videoId }: AddToPlaylistButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistStatus[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    apiGet<{ playlists: PlaylistStatus[] }>(`/api/playlists/video/${videoId}`)
      .then((data) => setPlaylists(data.playlists))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, videoId, user]);

  const toggle = async (playlistId: string, contains: boolean) => {
    try {
      if (contains) {
        await apiDelete(`/api/playlists/${playlistId}/videos/${videoId}`);
      } else {
        await apiPost(`/api/playlists/${playlistId}/videos`, { video_id: videoId });
      }
      setPlaylists((prev) =>
        prev.map((p) =>
          p.playlist_id === playlistId ? { ...p, contains: !contains } : p
        )
      );
    } catch {
      // ignore
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full bg-gray-100 p-1.5 text-xs text-gray-500 transition hover:bg-gray-200"
        title="リストに追加"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
            <p className="px-3 pb-2 text-xs font-medium text-gray-500">リストに追加</p>
            {loading ? (
              <div className="flex justify-center py-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              </div>
            ) : playlists.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">リストがありません</p>
            ) : (
              playlists.map((p) => (
                <button
                  key={p.playlist_id}
                  onClick={() => toggle(p.playlist_id, p.contains)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded border ${
                    p.contains ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300"
                  }`}>
                    {p.contains && (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="truncate">{p.playlist_name}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
