"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { Video, UserBrief } from "@/types/video";
import { VideoCard } from "@/components/video/VideoCard";
import { MuteButton } from "@/components/video/MuteButton";
import { FollowButton } from "@/components/social/FollowButton";
import { BadgeList } from "@/components/social/BadgeList";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface UserProfile {
  user: UserBrief;
  submitted_videos: Video[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

export default function UserProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<UserBrief | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiGet<UserProfile>(`/api/users/${id}?page=1&per_page=20`)
      .then((data) => {
        setUser(data.user);
        setVideos(data.submitted_videos);
        setHasNext(data.has_next);
        setTotal(data.total);
        setFollowersCount(data.followers_count ?? 0);
        setFollowingCount(data.following_count ?? 0);
        setPage(1);
      })
      .catch(() => setError("ユーザーが見つかりませんでした"))
      .finally(() => setLoading(false));
  }, [id]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    apiGet<UserProfile>(`/api/users/${id}?page=${nextPage}&per_page=20`)
      .then((data) => {
        setVideos((prev) => [...prev, ...data.submitted_videos]);
        setHasNext(data.has_next);
        setPage(nextPage);
      })
      .catch((e) => { console.error("Failed to load more user videos:", e); })
      .finally(() => setLoadingMore(false));
  }, [id, page, hasNext, loadingMore]);

  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: hasNext && !loadingMore,
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" role="status" aria-label="読み込み中" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg text-gray-500">
          {error || "ユーザーが見つかりません"}
        </p>
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
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center gap-4">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.display_name} className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">
            {user.display_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{user.display_name}</h1>
            <FollowButton userId={user.id} />
            <MuteButton userId={user.id} displayName={user.display_name} />
          </div>
          <div className="mt-1">
            <BadgeList userId={user.id} />
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
            <span>投稿 {total}件</span>
            <span>フォロワー {followersCount}</span>
            <span>フォロー中 {followingCount}</span>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold">投稿した動画</h2>
        {videos.length > 0 ? (
          <div className="space-y-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-gray-400">
            まだ動画を投稿していません。
          </p>
        )}
      </section>

      <div ref={sentinelRef} className="h-4" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      )}
    </div>
  );
}
