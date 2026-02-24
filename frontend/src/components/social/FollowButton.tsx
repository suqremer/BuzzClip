"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

interface FollowButtonProps {
  userId: string;
}

export function FollowButton({ userId }: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user || user.id === userId) return;
    apiGet<{ is_following: boolean }>(`/api/follows/${userId}/status`)
      .then((data) => setIsFollowing(data.is_following))
      .catch((e) => { console.error("Failed to fetch follow status:", e); })
      .finally(() => setChecked(true));
  }, [user, userId]);

  if (!user || user.id === userId || !checked) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        await apiDelete(`/api/follows/${userId}`);
        setIsFollowing(false);
      } else {
        await apiPost(`/api/follows/${userId}`);
        setIsFollowing(true);
      }
    } catch (e) {
      console.error("Failed to toggle follow status:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`rounded-lg px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
        isFollowing
          ? "border border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-500"
          : "bg-indigo-600 text-white hover:bg-indigo-700"
      }`}
    >
      {isFollowing ? "フォロー中" : "フォロー"}
    </button>
  );
}
