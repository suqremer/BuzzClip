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
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (contributors.length === 0) return null;

  const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-bold text-gray-700">
        Weekly 投稿者ランキング
      </h3>
      <div className="space-y-2">
        {contributors.map((c) => (
          <Link
            key={c.user.id}
            href={`/user/${c.user.id}`}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-gray-50"
          >
            <span className={`w-5 text-center text-sm font-bold ${rankColors[c.rank - 1] || "text-gray-400"}`}>
              {c.rank}
            </span>
            {c.user.avatar_url ? (
              <img src={c.user.avatar_url} alt={c.user.display_name} className="h-7 w-7 rounded-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                {c.user.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="flex-1 truncate text-sm font-medium text-gray-700">
              {c.user.display_name}
            </span>
            <span className="text-xs text-gray-400">{c.vote_count} votes</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
