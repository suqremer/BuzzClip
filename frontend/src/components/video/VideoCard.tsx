"use client";

import Link from "next/link";
import type { Video } from "@/types/video";
import { VideoEmbed } from "./VideoEmbed";
import { VoteButton } from "./VoteButton";

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/video/${video.id}`}>
        {video.oembed_html && (
          <div className="p-3">
            <VideoEmbed oembedHtml={video.oembed_html} />
          </div>
        )}
      </Link>
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
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
        <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
          投稿:{" "}
          <Link
            href={`/user/${video.submitted_by.id}`}
            className="text-indigo-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {video.submitted_by.display_name}
          </Link>
        </div>
      )}
    </div>
  );
}
