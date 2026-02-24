"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPatch } from "@/lib/api";

// --- Types ---

interface Stats {
  total_users: number;
  total_videos: number;
  pending_reports: number;
  new_feedbacks: number;
}

interface Report {
  id: string;
  video_id: string;
  reason: string;
  status: string;
  created_at: string;
}

interface AdminFeedback {
  id: string;
  user_id: string | null;
  category: string;
  body: string;
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

interface AdminUser {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
}

type Tab = "reports" | "feedbacks" | "videos" | "users";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Main ---

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("reports");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/signin");
    if (!authLoading && user && !user.is_admin) router.replace("/");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user?.is_admin) return;
    apiGet<Stats>("/api/admin/stats")
      .then(setStats)
      .catch(() => {});
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-medium border-t-brand" />
      </div>
    );
  }
  if (!user || !user.is_admin) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "reports", label: `通報${stats?.pending_reports ? ` (${stats.pending_reports})` : ""}` },
    { key: "feedbacks", label: `FB${stats?.new_feedbacks ? ` (${stats.new_feedbacks})` : ""}` },
    { key: "videos", label: "動画" },
    { key: "users", label: "ユーザー" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">管理画面</h1>

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="ユーザー数" value={stats.total_users} />
          <StatCard label="動画数" value={stats.total_videos} />
          <StatCard label="未対応通報" value={stats.pending_reports} highlight={stats.pending_reports > 0} />
          <StatCard label="新規FB" value={stats.new_feedbacks} highlight={stats.new_feedbacks > 0} />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-chip-bg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-surface text-brand-text shadow-sm"
                : "text-text-primary hover:text-text-heading"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {tab === "reports" && <ReportsPanel onError={setError} />}
      {tab === "feedbacks" && <FeedbacksPanel onError={setError} />}
      {tab === "videos" && <VideosPanel onError={setError} />}
      {tab === "users" && <UsersPanel onError={setError} />}
    </div>
  );
}

// --- Stat Card ---

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${highlight ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20" : "border-border-main bg-surface"}`}>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? "text-red-600 dark:text-red-400" : "text-text-heading"}`}>{value}</p>
    </div>
  );
}

// --- Pagination ---

function Pagination({ page, hasNext, total, perPage, onPageChange }: {
  page: number;
  hasNext: boolean;
  total: number;
  perPage: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-text-muted">{total}件中 {(page - 1) * perPage + 1}-{Math.min(page * perPage, total)}件</span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded border border-input-border px-3 py-1 text-text-primary transition hover:bg-hover-bg disabled:opacity-30"
        >
          前へ
        </button>
        <span className="px-2 py-1 text-text-muted">{page} / {totalPages}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className="rounded border border-input-border px-3 py-1 text-text-primary transition hover:bg-hover-bg disabled:opacity-30"
        >
          次へ
        </button>
      </div>
    </div>
  );
}

// --- Reports Panel ---

function ReportsPanel({ onError }: { onError: (e: string) => void }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const perPage = 20;

  const fetch = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await apiGet<PaginatedResponse<Report>>(`/api/admin/reports?page=${p}&per_page=${perPage}`);
      setReports(data.items);
      setTotal(data.total);
      setHasNext(data.has_next);
    } catch (e) {
      onError(e instanceof Error ? e.message : "通報一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => { fetch(page); }, [page, fetch]);

  const handleAction = async (id: string, action: string) => {
    try {
      await apiPatch(`/api/admin/reports/${id}`, { status: action });
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)));
    } catch {
      onError("操作に失敗しました");
    }
  };

  if (loading) return <Spinner />;
  if (reports.length === 0) return <Empty text="通報はありません" />;

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border-main">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-surface-secondary text-xs uppercase text-text-secondary">
            <tr>
              <th className="px-4 py-3">理由</th>
              <th className="px-4 py-3">動画</th>
              <th className="px-4 py-3">ステータス</th>
              <th className="px-4 py-3">日時</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-hover-bg">
                <td className="px-4 py-3">{r.reason}</td>
                <td className="px-4 py-3">
                  <a href={`/video/${r.video_id}`} className="text-brand-text hover:underline">
                    {r.video_id.slice(0, 8)}...
                  </a>
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-text-muted">{formatDate(r.created_at)}</td>
                <td className="px-4 py-3">
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <ActionBtn label="対応済み" color="green" onClick={() => handleAction(r.id, "resolved")} />
                      <ActionBtn label="却下" color="gray" onClick={() => handleAction(r.id, "dismissed")} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} hasNext={hasNext} total={total} perPage={perPage} onPageChange={setPage} />
    </>
  );
}

// --- Feedbacks Panel ---

function FeedbacksPanel({ onError }: { onError: (e: string) => void }) {
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const perPage = 20;

  const fetch = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await apiGet<PaginatedResponse<AdminFeedback>>(`/api/admin/feedbacks?page=${p}&per_page=${perPage}`);
      setFeedbacks(data.items);
      setTotal(data.total);
      setHasNext(data.has_next);
    } catch (e) {
      onError(e instanceof Error ? e.message : "FBの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => { fetch(page); }, [page, fetch]);

  const handleAction = async (id: string, action: string) => {
    try {
      await apiPatch(`/api/admin/feedbacks/${id}`, { status: action });
      setFeedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, status: action } : f)));
    } catch {
      onError("操作に失敗しました");
    }
  };

  if (loading) return <Spinner />;
  if (feedbacks.length === 0) return <Empty text="フィードバックはありません" />;

  return (
    <>
      <div className="space-y-3">
        {feedbacks.map((f) => (
          <div key={f.id} className="rounded-lg border border-border-main bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-chip-bg px-2.5 py-0.5 text-xs font-medium text-text-primary">{f.category}</span>
                <StatusBadge status={f.status} />
              </div>
              <span className="text-xs text-text-muted">{formatDate(f.created_at)}</span>
            </div>
            <p className="mb-3 whitespace-pre-wrap text-sm text-text-primary">{f.body}</p>
            {(f.status === "new" || f.status === "reviewing") && (
              <div className="flex gap-2">
                {f.status === "new" && (
                  <ActionBtn label="確認中" color="blue" onClick={() => handleAction(f.id, "reviewing")} />
                )}
                <ActionBtn label="対応済み" color="green" onClick={() => handleAction(f.id, "resolved")} />
                <ActionBtn label="却下" color="gray" onClick={() => handleAction(f.id, "dismissed")} />
              </div>
            )}
          </div>
        ))}
      </div>
      <Pagination page={page} hasNext={hasNext} total={total} perPage={perPage} onPageChange={setPage} />
    </>
  );
}

// --- Videos Panel ---

function VideosPanel({ onError }: { onError: (e: string) => void }) {
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const perPage = 30;

  const fetch = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await apiGet<PaginatedResponse<AdminVideo>>(`/api/admin/videos?page=${p}&per_page=${perPage}`);
      setVideos(data.items);
      setTotal(data.total);
      setHasNext(data.has_next);
    } catch (e) {
      onError(e instanceof Error ? e.message : "動画一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => { fetch(page); }, [page, fetch]);

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await apiPatch(`/api/admin/videos/${id}`, { is_active: !isActive });
      setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, is_active: !isActive } : v)));
    } catch {
      onError("操作に失敗しました");
    }
  };

  if (loading) return <Spinner />;
  if (videos.length === 0) return <Empty text="動画はありません" />;

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border-main">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-surface-secondary text-xs uppercase text-text-secondary">
            <tr>
              <th className="px-4 py-3">タイトル</th>
              <th className="px-4 py-3">投票数</th>
              <th className="px-4 py-3">状態</th>
              <th className="px-4 py-3">日時</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {videos.map((v) => (
              <tr key={v.id} className="hover:bg-hover-bg">
                <td className="max-w-[200px] truncate px-4 py-3">
                  <a href={`/video/${v.id}`} className="text-brand-text hover:underline">
                    {v.title || v.url.slice(0, 40) + "..."}
                  </a>
                </td>
                <td className="px-4 py-3">{v.vote_count}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    v.is_active
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {v.is_active ? "公開中" : "非公開"}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-muted">{formatDate(v.created_at)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(v.id, v.is_active)}
                    className={`rounded px-3 py-1 text-xs text-white ${
                      v.is_active ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {v.is_active ? "非公開" : "公開"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} hasNext={hasNext} total={total} perPage={perPage} onPageChange={setPage} />
    </>
  );
}

// --- Users Panel ---

function UsersPanel({ onError }: { onError: (e: string) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const perPage = 30;

  const fetch = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), per_page: String(perPage) });
      if (q) params.set("q", q);
      const data = await apiGet<PaginatedResponse<AdminUser>>(`/api/admin/users?${params}`);
      setUsers(data.items);
      setTotal(data.total);
      setHasNext(data.has_next);
    } catch (e) {
      onError(e instanceof Error ? e.message : "ユーザー一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => { fetch(page, query); }, [page, query, fetch]);

  const handleSearch = () => {
    setPage(1);
    setQuery(search);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    if (!confirm(isActive ? "このユーザーをBANしますか？" : "このユーザーのBANを解除しますか？")) return;
    try {
      await apiPatch(`/api/admin/users/${id}`, { is_active: !isActive });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: !isActive } : u)));
    } catch (e) {
      onError(e instanceof Error ? e.message : "操作に失敗しました");
    }
  };

  return (
    <>
      {/* Search */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          placeholder="名前・メールで検索..."
          className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button
          onClick={handleSearch}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          検索
        </button>
      </div>

      {loading ? <Spinner /> : users.length === 0 ? <Empty text="ユーザーが見つかりません" /> : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border-main">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-surface-secondary text-xs uppercase text-text-secondary">
                <tr>
                  <th className="px-4 py-3">ユーザー</th>
                  <th className="px-4 py-3">メール</th>
                  <th className="px-4 py-3">状態</th>
                  <th className="px-4 py-3">登録日</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-hover-bg">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-medium text-xs font-bold text-brand-text">
                            {u.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <a href={`/user/${u.id}`} className="text-brand-text hover:underline">
                          {u.display_name}
                        </a>
                        {u.is_admin && <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">ADMIN</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {u.is_active ? "有効" : "BAN"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      {!u.is_admin && (
                        <button
                          onClick={() => handleToggle(u.id, u.is_active)}
                          className={`rounded px-3 py-1 text-xs text-white ${
                            u.is_active ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {u.is_active ? "BAN" : "解除"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} hasNext={hasNext} total={total} perPage={perPage} onPageChange={setPage} />
        </>
      )}
    </>
  );
}

// --- Shared Components ---

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-medium border-t-brand" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-text-muted">{text}</p>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    reviewing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    dismissed: "bg-chip-bg text-text-muted",
  };
  const labels: Record<string, string> = {
    pending: "未対応",
    new: "新規",
    reviewing: "確認中",
    resolved: "対応済み",
    dismissed: "却下",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-chip-bg text-text-muted"}`}>
      {labels[status] || status}
    </span>
  );
}

function ActionBtn({ label, color, onClick }: { label: string; color: "green" | "gray" | "blue"; onClick: () => void }) {
  const styles = {
    green: "bg-green-600 hover:bg-green-700",
    gray: "bg-gray-500 hover:bg-gray-600",
    blue: "bg-blue-600 hover:bg-blue-700",
  };
  return (
    <button onClick={onClick} className={`rounded px-2.5 py-1 text-xs text-white ${styles[color]}`}>
      {label}
    </button>
  );
}
