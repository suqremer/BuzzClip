"use client";

import Link from "next/link";
import type { Video } from "@/types/video";
import { PLATFORMS } from "@/lib/constants";
import { VoteButton } from "./VoteButton";
import { MuteButton } from "./MuteButton";
import { ShareButtons } from "./ShareButtons";
import { AddToPlaylistButton } from "./AddToPlaylistButton";

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const platformInfo = PLATFORMS.find((p) => p.value === video.platform);
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/video/${video.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xl">
          {platformInfo?.icon ?? "𝕏"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-800">
            {video.title || video.author_name || "動画を見る"}
          </p>
          {video.author_name && video.title && (
            <p className="truncate text-xs text-gray-400">{video.author_name}</p>
          )}
        </div>
        <span className="shrink-0 text-xs text-gray-400">{platformInfo?.label}</span>
      </Link>
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {video.categories.map((cat) => (
            <span
              key={cat.slug}
              className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600"
            >
              {cat.icon} {cat.name_ja}
            </span>
          ))}
          {video.tags?.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-600"
            >
              #{tag.name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <ShareButtons videoId={video.id} title={video.title ?? undefined} />
          <AddToPlaylistButton videoId={video.id} />
          <VoteButton
            videoId={video.id}
            initialCount={video.vote_count}
            initialVoted={video.user_voted}
          />
        </div>
      </div>
      {video.comment && (
        <div className="border-t border-gray-100 px-4 py-2">
          <p className="text-xs text-gray-500">{video.comment}</p>
        </div>
      )}
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
