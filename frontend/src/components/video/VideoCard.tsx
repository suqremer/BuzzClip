"use client";

import Link from "next/link";
import type { Video } from "@/types/video";
import { PLATFORMS } from "@/lib/constants";
import { VideoEmbed } from "./VideoEmbed";
import { VoteButton } from "./VoteButton";
import { MuteButton } from "./MuteButton";

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/video/${video.id}`}>
        {video.oembed_html && (
          <div className="p-3">
            <VideoEmbed oembedHtml={video.oembed_html} platform={video.platform} />
          </div>
        )}
      </Link>
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            {PLATFORMS.find((p) => p.value === video.platform)?.icon ?? "𝕏"}
          </span>
          {video.categories.map((cat) => (
            <span
              key={cat.slug}
              className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600"
            >
              {cat.icon} {cat.name_ja}
            </span>
          ))}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <VoteButton
            videoId={video.id}
            initialCount={video.vote_count}
            initialVoted={video.user_voted}
          />
        </div>
      </div>
      {video.submitted_by && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {video.submitted_by.avatar_url && (
              <img src={video.submitted_by.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
            )}
            <span>投稿:</span>
            <Link
              href={`/user/${video.submitted_by.id}`}
              className="text-indigo-500 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {video.submitted_by.display_name}
            </Link>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <MuteButton userId={video.submitted_by.id} displayName={video.submitted_by.display_name} />
          </div>
        </div>
      )}
    </div>
  );
}
