"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { Video } from "@/types/video";
import type { PaginatedResponse } from "@/types/api";
import { VideoCard } from "@/components/video/VideoCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useT } from "@/hooks/useTranslation";
import { getLocale } from "@/lib/i18n";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const t = useT();
  const [input, setInput] = useState(query);

  // Sync input with URL query param changes (e.g. browser back/forward)
  useEffect(() => { setInput(query); }, [query]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchResults = useCallback(
    async (p: number, reset: boolean, signal?: AbortSignal) => {
      if (!query) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          page: String(p),
          per_page: "20",
        });
        const data = await apiGet<PaginatedResponse<Video>>(
          `/api/videos?${params}`,
          signal ? { signal } : undefined,
        );
        setVideos((prev) => (reset ? data.items : [...prev, ...data.items]));
        setHasMore(data.has_next);
        setTotal(data.total);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.error("Failed to fetch search results:", e);
      } finally {
        setLoading(false);
      }
    },
    [query],
  );

  useEffect(() => {
    const controller = new AbortController();
    setPage(1);
    fetchResults(1, true, controller.signal);
    return () => controller.abort();
  }, [fetchResults]);

  const loadMore = useCallback(() => {
    if (loading) return;
    const next = page + 1;
    setPage(next);
    fetchResults(next, false);
  }, [loading, page, fetchResults]);

  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: hasMore && !loading,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      router.push(`/search?q=${encodeURIComponent(input.trim())}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("search")}</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <label htmlFor="search-input" className="sr-only">{t("search")}</label>
        <div className="flex gap-2">
          <input
            id="search-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("searchInputPlaceholder")}
            className="flex-1 rounded-lg border border-input-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover"
          >
            {t("search")}
          </button>
        </div>
      </form>

      {query && (
        <p className="mb-4 text-sm text-text-secondary">
          {getLocale() === "ja"
            ? `「${query}」${t("searchResultsFor")} ${total}${t("searchResultCount")}`
            : `${total} ${t("searchResultsFor")} "${query}"`}
        </p>
      )}

      {loading && videos.length === 0 ? (
        <div className="flex justify-center py-12">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-brand-medium border-t-brand"
            role="status"
            aria-label={t("searching")}
          />
        </div>
      ) : videos.length === 0 && query ? (
        <p className="py-12 text-center text-text-muted">
          {t("noSearchResults")}
        </p>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
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
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-medium border-t-brand" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
