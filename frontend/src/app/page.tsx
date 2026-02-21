"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { apiGet } from "@/lib/api";
import type { Video } from "@/types/video";
import type { PaginatedResponse } from "@/types/api";
import { VideoCard } from "@/components/video/VideoCard";
import { TrendBadge } from "@/components/video/TrendBadge";

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGet<PaginatedResponse<Video>>("/api/rankings?period=24h&per_page=10"),
      apiGet<PaginatedResponse<Video>>("/api/rankings/trending").catch(() => ({ items: [] as Video[] })),
    ])
      .then(([rankingData, trendingData]) => {
        setVideos(rankingData.items);
        setTrendingVideos(trendingData.items);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 px-4 py-20 text-center text-white">
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          今バズってる動画、
          <br />
          ここに全部。
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-indigo-100">
          X(Twitter)でバズってる動画をみんなで集めてランキング化。
          <br />
          面白い・感動・衝撃の動画を見逃さない。
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/ranking"
            className="rounded-full bg-white px-6 py-3 text-sm font-bold text-indigo-600 shadow-lg transition hover:bg-indigo-50"
          >
            ランキングを見る
          </Link>
          <Link
            href="/submit"
            className="rounded-full border-2 border-white px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            動画を投稿する
          </Link>
        </div>
      </section>

      {/* Trending */}
      {trendingVideos.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-12">
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-xl font-bold">今バズり始め</h2>
            <TrendBadge />
          </div>
          <div className="space-y-4">
            {trendingVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* 24h Ranking */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">24時間ランキング</h2>
          <Link
            href="/ranking"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            もっと見る →
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" role="status" aria-label="読み込み中" />
          </div>
        ) : error ? (
          <p className="py-12 text-center text-gray-400">
            データの読み込みに失敗しました。ページを再読み込みしてください。
          </p>
        ) : videos.length === 0 ? (
          <p className="py-12 text-center text-gray-400">
            まだ動画がありません。最初の投稿者になろう！
          </p>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-xl font-bold">
            カテゴリから探す
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ranking?category=${cat.slug}`}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-sm font-medium text-gray-700">
                  {cat.nameJa}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">バズ動画、見つけた？</h2>
        <p className="mt-2 text-gray-500">
          みんなでシェアして、ランキングを育てよう。
        </p>
        <Link
          href="/submit"
          className="mt-6 inline-block rounded-full bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700"
        >
          動画を投稿する
        </Link>
      </section>
    </div>
  );
}
