"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiDelete, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface VoteButtonProps {
  videoId: string;
  initialCount: number;
  initialVoted: boolean;
}

export function VoteButton({ videoId, initialCount, initialVoted }: VoteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);

  // Sync state when props change (e.g. parent re-fetch)
  useEffect(() => { setVoted(initialVoted); }, [initialVoted]);
  useEffect(() => { setCount(initialCount); }, [initialCount]);
  const [loading, setLoading] = useState(false);
  const [showLoginMsg, setShowLoginMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleClick = async () => {
    if (loading) return;

    if (!user) {
      setShowLoginMsg(true);
      setTimeout(() => {
        setShowLoginMsg(false);
        router.push("/auth/signin");
      }, 1200);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      if (voted) {
        const res = await apiDelete<{ new_vote_count: number }>(`/api/votes/${videoId}`);
        setCount(res.new_vote_count);
        setVoted(false);
      } else {
        const res = await apiPost<{ new_vote_count: number }>(`/api/votes/${videoId}`);
        setCount(res.new_vote_count);
        setVoted(true);
      }
    } catch {
      setErrorMsg("エラーが発生しました");
      setTimeout(() => setErrorMsg(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          voted
            ? "bg-pink-100 text-pink-600"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        <svg
          className="h-4 w-4"
          fill={voted ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        {count}
      </button>
      {showLoginMsg && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2.5 py-1 text-xs text-white shadow">
          ログインが必要です
        </div>
      )}
      {errorMsg && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-red-600 px-2.5 py-1 text-xs text-white shadow">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
