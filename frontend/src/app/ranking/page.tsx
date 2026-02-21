"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { Video } from "@/types/video";
import type { PaginatedResponse } from "@/types/api";
import { VideoCard } from "@/components/video/VideoCard";
import { RankingTabs } from "@/components/ranking/RankingTabs";
import { CategoryFilter } from "@/components/ranking/CategoryFilter";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { usePreferences } from "@/contexts/PreferencesContext";

function RankingContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const { preferences } = usePreferences();

  const [period, setPeriod] = useState("24h");
  const [category, setCategory] = useState<string | null>(initialCategory);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");

  const fetchVideos = useCallback(
    async (p: number, reset: boolean) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          period,
          page: String(p),
          per_page: "20",
        });
        if (category) params.set("category", category);
        const data = await apiGet<PaginatedResponse<Video>>(
          `/api/rankings?${params}`
        );
        setVideos((prev) => (reset ? data.items : [...prev, ...data.items]));
        setHasMore(data.has_next);
      } catch {
        setError("ランキングの読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    },
    [period, category]
  );

  useEffect(() => {
    setPage(1);
    fetchVideos(1, true);
  }, [fetchVideos]);

  const loadMore = useCallback(() => {
    if (loading) return;
    const next = page + 1;
    setPage(next);
    fetchVideos(next, false);
  }, [loading, page, fetchVideos]);

  const sentinelRef = useInfiniteScroll(loadMore, { enabled: hasMore && !loading });

  // Filter out videos from muted users and hidden categories (when viewing "all")
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      // Filter muted users
      if (video.submitted_by && preferences.mutedUserIds.includes(video.submitted_by.id)) {
        return false;
      }
      // Filter hidden categories (only when viewing "all" / no specific category)
      if (!category && preferences.hiddenCategorySlugs.length > 0) {
        const videoSlugs = video.categories.map((c) => c.slug);
        if (videoSlugs.length > 0 && videoSlugs.every((s) => preferences.hiddenCategorySlugs.includes(s))) {
          return false;
        }
      }
      return true;
    });
  }, [videos, preferences.mutedUserIds, preferences.hiddenCategorySlugs, category]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">ランキング</h1>

      <div className="mb-4">
        <RankingTabs activePeriod={period} onPeriodChange={setPeriod} />
      </div>
      <div className="mb-6">
        <CategoryFilter
          activeCategory={category}
          onCategoryChange={setCategory}
        />
      </div>

      {loading && filteredVideos.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" role="status" aria-label="読み込み中" />
        </div>
      ) : error ? (
        <p className="py-12 text-center text-red-500">{error}</p>
      ) : filteredVideos.length === 0 ? (
        <p className="py-12 text-center text-gray-400">
          この条件に合う動画はまだありません。
        </p>
      ) : (
        <div className="space-y-4">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {loading && (
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RankingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      }
    >
      <RankingContent />
    </Suspense>
  );
}
