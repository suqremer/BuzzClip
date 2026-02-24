"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { Badge } from "@/types/badge";

interface BadgeListProps {
  userId: string;
}

export function BadgeList({ userId }: BadgeListProps) {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    apiGet<{ badges: Badge[] }>(`/api/badges/${userId}`)
      .then((data) => setBadges(data.badges))
      .catch((e) => { console.error("Failed to fetch user badges:", e); });
  }, [userId]);

  const earned = badges.filter((b) => b.earned);
  if (earned.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {earned.map((badge) => (
        <span
          key={badge.key}
          title={badge.description}
          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        >
          <span>{badge.icon}</span>
          {badge.label}
        </span>
      ))}
    </div>
  );
}
