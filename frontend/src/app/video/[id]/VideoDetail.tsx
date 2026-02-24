"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { Video } from "@/types/video";
import type { PaginatedResponse } from "@/types/api";
import { VideoEmbed } from "@/components/video/VideoEmbed";
import { VoteButton } from "@/components/video/VoteButton";
import { ReportButton } from "@/components/video/ReportButton";
import { ShareButtons } from "@/components/video/ShareButtons";
import { AddToPlaylistButton } from "@/components/video/AddToPlaylistButton";
import { VideoCard } from "@/components/video/VideoCard";

interface VideoDetailProps {
  id: string;
}

export default function VideoDetail({ id }: VideoDetailProps) {
  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiGet<Video>(`/api/videos/${id}`)
      .then((data) => {
        setVideo(data);
        // Fetch related videos from same category
        if (data.categories.length > 0) {
          const catSlug = data.categories[0].slug;
          apiGet<PaginatedResponse<Video>>(
            `/api/rankings?period=24h&category=${catSlug}&limit=5`
          )
            .then((rel) =>
              setRelated(rel.items.filter((v) => v.id !== data.id).slice(0, 4))
            )
            .catch((e) => { console.error("Failed to fetch related videos:", e); });
        }
      })
      .catch(() => setError("動画が見つかりませんでした"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" role="status" aria-label="読み込み中" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg text-gray-500">{error || "動画が見つかりません"}</p>
        <Link
          href="/ranking"
          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
        >
          ランキングに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/ranking"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        ランキングに戻る
      </Link>

      {/* Video Embed */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {video.oembed_html && (
          <div className="p-4">
            <VideoEmbed oembedHtml={video.oembed_html} platform={video.platform} />
          </div>
        )}

        <div className="border-t border-gray-100 px-5 py-4">
          {/* Categories */}
          <div className="mb-3 flex flex-wrap gap-2">
            {video.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ranking?category=${cat.slug}`}
                className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100"
              >
                {cat.icon} {cat.name_ja}
              </Link>
            ))}
          </div>

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {video.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-600"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Comment */}
          {video.comment && (
            <p className="mb-3 text-sm text-gray-600">{video.comment}</p>
          )}

          {/* Vote Button (large) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <VoteButton
                videoId={video.id}
                initialCount={video.vote_count}
                initialVoted={video.user_voted}
              />
              <ShareButtons videoId={video.id} title={video.title ?? undefined} />
              <AddToPlaylistButton videoId={video.id} />
            </div>
            {video.submitted_by && (
              <Link
                href={`/user/${video.submitted_by.id}`}
                className="text-sm text-gray-400 hover:text-indigo-500 hover:underline"
              >
                投稿: {video.submitted_by.display_name}
              </Link>
            )}
          </div>

          {/* Report */}
          <div className="border-t border-gray-100 px-5 py-3">
            <ReportButton videoId={video.id} />
          </div>
        </div>
      </div>

      {/* Related Videos */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">他のバズ動画</h2>
          <div className="space-y-4">
            {related.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
