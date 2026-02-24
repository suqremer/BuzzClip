"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPatch } from "@/lib/api";

interface Report {
  id: string;
  video_id: string;
  reason: string;
  status: string;
  created_at: string;
}

interface AdminVideo {
  id: string;
  title: string | null;
  url: string;
  platform: string;
  is_active: boolean;
  vote_count: number;
  created_at: string;
}

type Tab = "reports" | "videos";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/signin");
    }
    if (!authLoading && user && !user.is_admin) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || !user.is_admin) return;
    setLoading(true);
    setError("");
    if (tab === "reports") {
      apiGet<Report[]>("/api/admin/reports")
        .then(setReports)
        .catch((e) => setError(e.message || "通報一覧の取得に失敗しました"))
        .finally(() => setLoading(false));
    } else {
      apiGet<AdminVideo[]>("/api/admin/videos")
        .then(setVideos)
        .catch((e) => setError(e.message || "動画一覧の取得に失敗しました"))
        .finally(() => setLoading(false));
    }
  }, [tab, user]);

  async function handleReportAction(reportId: string, action: string) {
    try {
      await apiPatch<Report>(`/api/admin/reports/${reportId}`, { status: action });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: action } : r))
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "操作に失敗しました";
      setError(msg);
    }
  }

  async function handleToggleActive(videoId: string, isActive: boolean) {
    try {
      await apiPatch<AdminVideo>(`/api/admin/videos/${videoId}`, {
        is_active: !isActive,
      });
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId ? { ...v, is_active: !isActive } : v
        )
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "操作に失敗しました";
      setError(msg);
    }
  }

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" role="status" aria-label="読み込み中" />
      </div>
    );
  }

  if (!user || !user.is_admin) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "reports", label: "通報一覧" },
    { key: "videos", label: "動画管理" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">管理画面</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" role="status" aria-label="読み込み中" />
        </div>
      ) : tab === "reports" ? (
        <ReportsTable
          reports={reports}
          onAction={handleReportAction}
        />
      ) : (
        <VideosTable videos={videos} onToggle={handleToggleActive} />
      )}
    </div>
  );
}

function ReportsTable({
  reports,
  onAction,
}: {
  reports: Report[];
  onAction: (id: string, action: string) => void;
}) {
  if (reports.length === 0) {
    return <p className="py-8 text-center text-gray-500">通報はありません</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">理由</th>
            <th className="px-4 py-3">動画</th>
            <th className="px-4 py-3">ステータス</th>
            <th className="px-4 py-3">日時</th>
            <th className="px-4 py-3">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {reports.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">{r.reason}</td>
              <td className="px-4 py-3">
                <a
                  href={`/video/${r.video_id}`}
                  className="text-indigo-600 hover:underline"
                >
                  {r.video_id.slice(0, 8)}...
                </a>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "resolved"
                      ? "bg-green-100 text-green-700"
                      : r.status === "dismissed"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(r.created_at).toLocaleDateString("ja-JP")}
              </td>
              <td className="px-4 py-3">
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAction(r.id, "resolved")}
                      className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                    >
                      対応済み
                    </button>
                    <button
                      onClick={() => onAction(r.id, "dismissed")}
                      className="rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600"
                    >
                      却下
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VideosTable({
  videos,
  onToggle,
}: {
  videos: AdminVideo[];
  onToggle: (id: string, isActive: boolean) => void;
}) {
  if (videos.length === 0) {
    return <p className="py-8 text-center text-gray-500">動画はありません</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">タイトル</th>
            <th className="px-4 py-3">投票数</th>
            <th className="px-4 py-3">ステータス</th>
            <th className="px-4 py-3">日時</th>
            <th className="px-4 py-3">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {videos.map((v) => (
            <tr key={v.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <a
                  href={`/video/${v.id}`}
                  className="text-indigo-600 hover:underline"
                >
                  {v.title || v.url.slice(0, 30) + "..."}
                </a>
              </td>
              <td className="px-4 py-3">{v.vote_count}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    v.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {v.is_active ? "公開中" : "非公開"}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(v.created_at).toLocaleDateString("ja-JP")}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggle(v.id, v.is_active)}
                  className={`rounded px-3 py-1 text-xs text-white ${
                    v.is_active
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {v.is_active ? "非公開にする" : "公開する"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
