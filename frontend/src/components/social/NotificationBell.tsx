"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost } from "@/lib/api";
import type { Notification, NotificationListResponse } from "@/types/notification";

export function NotificationBell() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const userId = user?.id;

  // Poll unread count
  useEffect(() => {
    if (!userId) return;
    const fetchCount = () => {
      apiGet<{ count: number }>("/api/notifications/unread-count")
        .then((data) => setCount(data.count))
        .catch((e) => { console.error("Failed to fetch unread notification count:", e); });
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Fetch notifications when opened
  const fetchNotifications = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    apiGet<NotificationListResponse>("/api/notifications?page=1&per_page=15")
      .then((data) => {
        setNotifications(data.items);
        setFetched(true);
      })
      .catch((e) => { console.error("Failed to fetch notifications:", e); })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      fetchNotifications();
    }
  };

  const markAllRead = async () => {
    try {
      await apiPost("/api/notifications/mark-read", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setCount(0);
    } catch (e) {
      console.error("Failed to mark all notifications as read:", e);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="relative p-1"
        title="通知"
        aria-label="通知"
      >
        <svg className="h-5 w-5 text-gray-600 hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <span className="text-sm font-bold text-gray-800">通知</span>
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                すべて既読
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && !fetched ? (
              <div className="flex justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">通知はまだありません</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.type === "vote" && n.video_id ? `/video/${n.video_id}` : `/user/${n.actor.id}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-2.5 px-4 py-2.5 transition hover:bg-gray-50 ${!n.is_read ? "bg-indigo-50/60" : ""}`}
                >
                  {n.actor.avatar_url ? (
                    <img src={n.actor.avatar_url} alt={n.actor.display_name} className="h-7 w-7 shrink-0 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                      {n.actor.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-700">
                      <span className="font-medium">{n.actor.display_name}</span>
                      {n.type === "vote" ? "がいいね" : "がフォロー"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {new Date(n.created_at).toLocaleDateString("ja-JP", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                  )}
                </Link>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-gray-100 px-4 py-2.5 text-center text-xs font-medium text-indigo-600 hover:bg-gray-50"
          >
            すべての通知を見る
          </Link>
        </div>
      )}
    </div>
  );
}
