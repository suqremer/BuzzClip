"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost } from "@/lib/api";
import type { Notification, NotificationListResponse } from "@/types/notification";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const fetchNotifications = useCallback(
    (p: number, reset: boolean) => {
      if (!user) return;
      setLoading(true);
      apiGet<NotificationListResponse>(`/api/notifications?page=${p}&per_page=30`)
        .then((data) => {
          setNotifications((prev) => (reset ? data.items : [...prev, ...data.items]));
          setHasNext(data.has_next);
        })
        .catch((e) => { console.error("Failed to fetch notifications:", e); })
        .finally(() => setLoading(false));
    },
    [user]
  );

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }
    fetchNotifications(1, true);
  }, [user, authLoading, fetchNotifications]);

  const markAllRead = async () => {
    try {
      await apiPost("/api/notifications/mark-read", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error("Failed to mark all notifications as read:", e);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNotifications(next, false);
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-medium border-t-brand" role="status" aria-label="読み込み中" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-text-heading">ログインが必要です</h1>
        <Link
          href="/auth/signin"
          className="mt-6 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-hover"
        >
          ログインする
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">通知</h1>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={markAllRead}
            className="text-sm font-medium text-brand-text hover:underline"
          >
            すべて既読にする
          </button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-medium border-t-brand" role="status" aria-label="読み込み中" />
        </div>
      ) : notifications.length === 0 ? (
        <p className="py-12 text-center text-text-muted">通知はまだありません。</p>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg px-4 py-3 ${n.is_read ? "bg-surface" : "bg-brand-light"}`}
            >
              <div className="flex items-start gap-3">
                {n.actor.avatar_url ? (
                  <img src={n.actor.avatar_url} alt={n.actor.display_name} className="h-8 w-8 rounded-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-medium text-sm font-bold text-brand-text">
                    {n.actor.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-text-primary">
                    <Link href={`/user/${n.actor.id}`} className="font-medium hover:underline">
                      {n.actor.display_name}
                    </Link>
                    {n.type === "vote" && (
                      <>
                        さんがあなたの動画にいいねしました
                        {n.video_id && (
                          <Link href={`/video/${n.video_id}`} className="ml-1 text-brand-text hover:underline">
                            {n.video_title || "動画を見る"}
                          </Link>
                        )}
                      </>
                    )}
                    {n.type === "follow" && "さんがあなたをフォローしました"}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {new Date(n.created_at).toLocaleDateString("ja-JP", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-brand" />
                )}
              </div>
            </div>
          ))}
          {hasNext && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="rounded-lg border border-input-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-hover-bg disabled:opacity-50"
              >
                {loading ? "読み込み中..." : "もっと見る"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
