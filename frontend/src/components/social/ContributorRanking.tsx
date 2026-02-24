"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { Contributor } from "@/types/badge";

export function ContributorRanking() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ contributors: Contributor[]; period: string }>("/api/rankings/contributors")
      .then((data) => setContributors(data.contributors))
      .catch((e) => { console.error("Failed to fetch contributor rankings:", e); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-medium border-t-brand" />
      </div>
    );
  }

  if (contributors.length === 0) return null;

  const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];

  return (
    <div className="rounded-xl border border-border-main bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary">
          Weekly 投稿者ランキング
        </h3>
        <Link
          href="/ranking/users"
          className="text-xs text-text-muted hover:text-brand-text"
        >
          もっと見る →
        </Link>
      </div>
      <div className="space-y-2">
        {contributors.map((c) => (
          <Link
            key={c.user.id}
            href={`/user/${c.user.id}`}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-hover-bg"
          >
            <span className={`w-5 text-center text-sm font-bold ${rankColors[c.rank - 1] || "text-text-muted"}`}>
              {c.rank}
            </span>
            {c.user.avatar_url ? (
              <img src={c.user.avatar_url} alt={c.user.display_name} className="h-7 w-7 rounded-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-medium text-xs font-bold text-brand-text">
                {c.user.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="flex-1 truncate text-sm font-medium text-text-primary">
              {c.user.display_name}
            </span>
            <span className="text-xs text-text-muted">{c.vote_count} votes</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
