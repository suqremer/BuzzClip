"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/contexts/PreferencesContext";

interface MuteButtonProps {
  userId: string;
  displayName: string;
}

export function MuteButton({ userId, displayName }: MuteButtonProps) {
  const { user } = useAuth();
  const { isUserMuted, muteUser, unmuteUser } = usePreferences();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Don't show mute button for own posts or if not logged in
  if (!user || user.id === userId) return null;

  const muted = isUserMuted(userId);

  const handleMute = async () => {
    if (muted) {
      setLoading(true);
      try {
        await unmuteUser(userId);
      } catch (e) { console.error("Failed to unmute user:", e); }
      setLoading(false);
      return;
    }
    setShowConfirm(true);
  };

  const confirmMute = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await muteUser(userId);
    } catch (e) { console.error("Failed to mute user:", e); }
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleMute}
        disabled={loading}
        className={`text-xs transition ${
          muted
            ? "font-medium text-orange-500 hover:text-orange-600"
            : "text-gray-300 hover:text-gray-500"
        }`}
        title={muted ? `${displayName}のミュートを解除` : `${displayName}をミュート`}
      >
        {muted ? (
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            ミュート中
          </span>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        )}
      </button>
      {showConfirm && (
        <div className="absolute bottom-full right-0 z-10 mb-2 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs text-gray-600">
            <strong>{displayName}</strong> をミュートしますか？この投稿者の動画がランキングに表示されなくなります。
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmMute}
              className="flex-1 rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
            >
              ミュート
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
