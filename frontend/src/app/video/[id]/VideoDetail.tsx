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
        // Fetch related videos by shared categories & tags
        apiGet<PaginatedResponse<Video>>(`/api/videos/${id}/related?limit=6`)
          .then((rel) => setRelated(rel.items))
          .catch((e) => { console.error("Failed to fetch related videos:", e); });
      })
      .catch(() => setError("動画が見つかりませんでした"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-medium border-t-brand" role="status" aria-label="読み込み中" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg text-text-secondary">{error || "動画が見つかりません"}</p>
        <Link
          href="/ranking"
          className="mt-4 inline-block text-sm font-medium text-brand-text hover:underline"
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
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-brand-text"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        ランキングに戻る
      </Link>

      {/* Video Embed */}
      <div className="overflow-hidden rounded-xl border border-border-main bg-surface shadow-sm">
        <div className="p-4">
          <VideoEmbed
            oembedHtml={video.oembed_html}
            platform={video.platform}
            url={video.url}
            externalId={video.external_id}
          />
        </div>

        <div className="border-t border-border-light px-5 py-4">
          {/* Categories */}
          <div className="mb-3 flex flex-wrap gap-2">
            {video.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ranking?category=${cat.slug}`}
                className="rounded-full bg-brand-light px-3 py-1 text-sm font-medium text-brand-text transition hover:bg-brand-medium"
              >
                {cat.icon} {cat.name_ja}
              </Link>
            ))}
          </div>

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {video.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/ranking?tag=${encodeURIComponent(tag.name)}`}
                  className="rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-600 transition hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Comment */}
          {video.comment && (
            <p className="mb-3 text-sm text-text-primary">{video.comment}</p>
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
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Link
                  href={`/user/${video.submitted_by.id}`}
                  className="hover:text-brand-text hover:underline"
                >
                  投稿: {video.submitted_by.display_name}
                </Link>
                {video.created_at && (
                  <time dateTime={video.created_at}>
                    {new Date(video.created_at).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </time>
                )}
              </div>
            )}
          </div>

          {/* Report */}
          <div className="border-t border-border-light px-5 py-3">
            <ReportButton videoId={video.id} />
          </div>
        </div>
      </div>

      {/* Related Videos */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">関連動画</h2>
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
