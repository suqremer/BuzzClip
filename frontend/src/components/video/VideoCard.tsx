"use client";

import { memo } from "react";
import Link from "next/link";
import type { Video } from "@/types/video";
import { PLATFORMS } from "@/lib/constants";
import { VoteButton } from "./VoteButton";
import { MuteButton } from "./MuteButton";
import { ShareButtons } from "./ShareButtons";
import { AddToPlaylistButton } from "./AddToPlaylistButton";
import { useT } from "@/hooks/useTranslation";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}`;
}

interface VideoCardProps {
  video: Video;
  onDelete?: (videoId: string) => void;
  onEdit?: (video: Video) => void;
  onTagClick?: (tagName: string) => void;
}

export const VideoCard = memo(function VideoCard({ video, onDelete, onEdit, onTagClick }: VideoCardProps) {
  const t = useT();
  const platformInfo = PLATFORMS.find((p) => p.value === video.platform);
  return (
    <div className="overflow-hidden rounded-xl border border-border-main bg-surface shadow-sm transition hover:shadow-md">
      <Link href={`/video/${video.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-hover-bg">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-chip-bg text-xl">
          {platformInfo?.icon ?? "𝕏"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-heading">
            {video.title || video.author_name || t("viewVideo")}
          </p>
          {video.author_name && video.title && (
            <p className="truncate text-xs text-text-muted">{video.author_name}</p>
          )}
        </div>
        <span className="shrink-0 text-xs text-text-muted">{platformInfo?.label}</span>
      </Link>
      <div className="flex items-center justify-between border-t border-border-light px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {video.categories.map((cat) => (
            <span
              key={cat.slug}
              className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand-text"
            >
              {cat.icon} {cat.name_ja}
            </span>
          ))}
          {video.tags?.map((tag) =>
            onTagClick ? (
              <button
                key={tag.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTagClick(tag.name);
                }}
                className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-600 transition hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
              >
                #{tag.name}
              </button>
            ) : (
              <Link
                key={tag.id}
                href={`/ranking?tag=${encodeURIComponent(tag.name)}`}
                onClick={(e) => e.stopPropagation()}
                className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-600 transition hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
              >
                #{tag.name}
              </Link>
            )
          )}
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
      {video.url && (
        <div className="border-t border-border-light px-4 py-2">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-xs text-text-muted hover:text-brand-text"
            onClick={(e) => e.stopPropagation()}
          >
            {video.url}
          </a>
        </div>
      )}
      {video.comment && (
        <div className="border-t border-border-light px-4 py-2">
          <p className="text-xs text-text-secondary">{video.comment}</p>
        </div>
      )}
      {video.submitted_by && (
        <div className="flex items-center justify-between border-t border-border-light px-4 py-2">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            {video.submitted_by.avatar_url && (
              <img src={video.submitted_by.avatar_url} alt={video.submitted_by.display_name} className="h-4 w-4 rounded-full object-cover" loading="lazy" />
            )}
            <span>{t("postedBy")}</span>
            <Link
              href={`/user/${video.submitted_by.id}`}
              className="text-brand-text hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {video.submitted_by.display_name}
            </Link>
            {video.created_at && (
              <time dateTime={video.created_at} className="ml-1">
                {formatDate(video.created_at)}
              </time>
            )}
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <button
                onClick={() => onEdit(video)}
                className="text-xs text-text-muted hover:text-brand-text"
              >
                {t("edit")}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(video.id)}
                className="text-xs text-text-muted hover:text-red-500"
              >
                {t("delete")}
              </button>
            )}
            <MuteButton userId={video.submitted_by.id} displayName={video.submitted_by.display_name} />
          </div>
        </div>
      )}
    </div>
  );
});
