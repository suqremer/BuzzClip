"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { Video } from "@/types/video";
import type { PaginatedResponse } from "@/types/api";
import { VideoCard } from "@/components/video/VideoCard";
import { SortToggle } from "@/components/ranking/SortToggle";
import { RankingTabs } from "@/components/ranking/RankingTabs";
import { CategoryFilter } from "@/components/ranking/CategoryFilter";
import { PlatformFilter } from "@/components/ranking/PlatformFilter";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { usePreferences } from "@/contexts/PreferencesContext";
import { ContributorRanking } from "@/components/social/ContributorRanking";

function RankingContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const initialTag = searchParams.get("tag");
  const { preferences, setPreferredPlatforms } = usePreferences();

  const [sortMode, setSortMode] = useState<"hot" | "new">("hot");
  const [period, setPeriod] = useState("24h");
  const [platforms, setPlatforms] = useState<string[]>(preferences.preferredPlatforms);
  const [category, setCategory] = useState<string | null>(initialCategory);
  const [activeTag, setActiveTag] = useState<string | null>(initialTag);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");

  const fetchVideos = useCallback(
    async (p: number, reset: boolean, signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: String(p),
          per_page: "20",
        });
        if (category) params.set("category", category);
        if (platforms.length > 0) params.set("platform", platforms.join(","));
        if (activeTag) params.set("tag", activeTag);

        let endpoint: string;
        if (sortMode === "hot") {
          params.set("period", period);
          endpoint = `/api/rankings?${params}`;
        } else {
          params.set("sort", "new");
          endpoint = `/api/videos?${params}`;
        }

        const data = await apiGet<PaginatedResponse<Video>>(
          endpoint,
          signal ? { signal } : undefined,
        );
        setVideos((prev) => (reset ? data.items : [...prev, ...data.items]));
        setHasMore(data.has_next);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError("ランキングの読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    },
    [sortMode, period, category, platforms, activeTag]
  );

  useEffect(() => {
    const controller = new AbortController();
    setPage(1);
    fetchVideos(1, true, controller.signal);
    return () => controller.abort();
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

  const handleTagClick = useCallback((tagName: string) => {
    setActiveTag(tagName);
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ランキング</h1>
        <SortToggle activeSort={sortMode} onSortChange={setSortMode} />
      </div>

      {sortMode === "hot" && (
        <div className="mb-4">
          <RankingTabs activePeriod={period} onPeriodChange={setPeriod} />
        </div>
      )}
      <div className="mb-4">
        <PlatformFilter selectedPlatforms={platforms} onPlatformsChange={(p) => { setPlatforms(p); setPreferredPlatforms(p); }} />
      </div>
      <div className={activeTag ? "mb-4" : "mb-6"}>
        <CategoryFilter
          activeCategory={category}
          onCategoryChange={setCategory}
        />
      </div>

      {activeTag && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-text-secondary">タグ:</span>
          <button
            onClick={() => setActiveTag(null)}
            className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 transition hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
          >
            #{activeTag}
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {loading && filteredVideos.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-medium border-t-brand" role="status" aria-label="読み込み中" />
        </div>
      ) : error ? (
        <p className="py-12 text-center text-red-500">{error}</p>
      ) : filteredVideos.length === 0 ? (
        <p className="py-12 text-center text-text-muted">
          この条件に合う動画はまだありません。
        </p>
      ) : (
        <div className="space-y-4">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} onTagClick={handleTagClick} />
          ))}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {loading && (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-medium border-t-brand" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Contributor Ranking */}
      <section className="mt-10">
        <ContributorRanking />
      </section>
    </div>
  );
}

export default function RankingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-medium border-t-brand" />
        </div>
      }
    >
      <RankingContent />
    </Suspense>
  );
}
