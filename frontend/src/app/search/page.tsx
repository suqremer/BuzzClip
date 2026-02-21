"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { Video } from "@/types/video";
import type { PaginatedResponse } from "@/types/api";
import { VideoCard } from "@/components/video/VideoCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [input, setInput] = useState(query);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchResults = useCallback(
    async (p: number, reset: boolean) => {
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
        );
        setVideos((prev) => (reset ? data.items : [...prev, ...data.items]));
        setHasMore(data.has_next);
        setTotal(data.total);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [query],
  );

  useEffect(() => {
    setPage(1);
    fetchResults(1, true);
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
      <h1 className="mb-6 text-2xl font-bold">検索</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="動画タイトル、投稿者名で検索..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            検索
          </button>
        </div>
      </form>

      {query && (
        <p className="mb-4 text-sm text-gray-500">
          「{query}」の検索結果: {total}件
        </p>
      )}

      {loading && videos.length === 0 ? (
        <div className="flex justify-center py-12">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
            role="status"
            aria-label="検索中"
          />
        </div>
      ) : videos.length === 0 && query ? (
        <p className="py-12 text-center text-gray-400">
          該当する動画が見つかりませんでした。
        </p>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
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

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
