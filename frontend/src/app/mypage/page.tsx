"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet } from "@/lib/api";
import type { Video } from "@/types/video";
import { VideoCard } from "@/components/video/VideoCard";

interface Profile {
  submitted_videos: Video[];
  voted_videos: Video[];
}

export default function MyPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    apiGet<Profile>("/api/auth/profile")
      .then((data) => setProfile(data))
      .catch(() => setError("プロフィールの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-800">ログインが必要です</h1>
        <p className="mt-3 text-gray-500">
          マイページを表示するにはログインしてください。
        </p>
        <Link
          href="/auth/signin"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
        >
          ログインする
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">マイページ</h1>
      <p className="mt-1 text-gray-500">{user.display_name}</p>

      {/* 投稿した動画 */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold">投稿した動画</h2>
        {profile && profile.submitted_videos.length > 0 ? (
          <div className="space-y-4">
            {profile.submitted_videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-gray-400">
            まだ動画を投稿していません。
          </p>
        )}
      </section>

      {/* いいねした動画 */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold">いいねした動画</h2>
        {profile && profile.voted_videos.length > 0 ? (
          <div className="space-y-4">
            {profile.voted_videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-gray-400">
            まだ動画にいいねしていません。
          </p>
        )}
      </section>
    </div>
  );
}
