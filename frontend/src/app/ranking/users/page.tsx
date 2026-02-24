"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";

interface RankedUser {
  rank: number;
  user: { id: string; display_name: string; avatar_url: string | null };
  count: number;
}

const SORT_OPTIONS = [
  { value: "likes" as const, label: "いいね数", icon: "❤️" },
  { value: "posts" as const, label: "投稿数", icon: "📝" },
];

const PERIOD_OPTIONS = [
  { value: "1w" as const, label: "1週間" },
  { value: "1m" as const, label: "1ヶ月" },
  { value: "all" as const, label: "全期間" },
];

const RANK_STYLES = ["text-yellow-500", "text-gray-400", "text-amber-600"];

export default function UserRankingPage() {
  const [sort, setSort] = useState<"likes" | "posts">("likes");
  const [period, setPeriod] = useState<"1w" | "1m" | "all">("1w");
  const [rankings, setRankings] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<{ rankings: RankedUser[] }>(
        `/api/rankings/users?sort=${sort}&period=${period}&limit=30`
      );
      setRankings(data.rankings);
    } catch (e) {
      console.error("Failed to fetch user rankings:", e);
    } finally {
      setLoading(false);
    }
  }, [sort, period]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/ranking"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-brand-text"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          ランキングに戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold">ユーザーランキング</h1>
      </div>

      {/* Sort toggle */}
      <div className="mb-4 flex gap-2">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              sort === opt.value
                ? "bg-brand text-white"
                : "bg-chip-bg text-text-primary hover:bg-chip-hover"
            }`}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      {/* Period toggle */}
      <div className="mb-6 flex gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              period === opt.value
                ? "bg-brand text-white"
                : "bg-chip-bg text-text-primary hover:bg-chip-hover"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Rankings list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-medium border-t-brand" />
        </div>
      ) : rankings.length === 0 ? (
        <p className="py-12 text-center text-text-muted">
          この期間のデータはまだありません。
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-main bg-surface">
          {rankings.map((r, i) => (
            <Link
              key={r.user.id}
              href={`/user/${r.user.id}`}
              className={`flex items-center gap-4 px-4 py-3 transition hover:bg-hover-bg ${
                i > 0 ? "border-t border-border-light" : ""
              }`}
            >
              <span
                className={`w-8 text-center text-lg font-bold ${RANK_STYLES[r.rank - 1] || "text-text-muted"}`}
              >
                {r.rank}
              </span>
              {r.user.avatar_url ? (
                <img
                  src={r.user.avatar_url}
                  alt={r.user.display_name}
                  className="h-10 w-10 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-medium text-sm font-bold text-brand-text">
                  {r.user.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="flex-1 truncate font-medium text-text-primary">
                {r.user.display_name}
              </span>
              <div className="text-right">
                <span className="text-lg font-bold text-text-heading">{r.count}</span>
                <span className="ml-1 text-xs text-text-muted">
                  {sort === "likes" ? "likes" : "posts"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
