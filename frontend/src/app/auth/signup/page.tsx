"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import type { AuthResponse } from "@/types/api";

export default function SignUpPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("パスワードは8文字以上必要です");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiPost<AuthResponse>("/api/auth/signup", {
        email,
        password,
        display_name: displayName,
      });
      await login();
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "登録に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex rounded-lg bg-chip-bg p-1">
          <Link
            href="/auth/signin"
            className="flex-1 rounded-md px-4 py-2 text-center text-sm font-medium text-text-secondary transition hover:text-text-primary"
          >
            ログイン
          </Link>
          <div className="flex-1 rounded-md bg-surface px-4 py-2 text-center text-sm font-bold text-text-heading shadow-sm">
            新規登録
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-display-name" className="mb-1 block text-sm font-medium text-text-primary">
              表示名
            </label>
            <input
              id="signup-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full rounded-lg border border-input-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="BuzzClipユーザー"
            />
            <p className="mt-1 text-xs text-text-muted">あとからでも変更できます</p>
          </div>
          <div>
            <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-text-primary">
              メールアドレス
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-input-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="mail@example.com"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-text-primary">
              パスワード
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-input-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="8文字以上"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-bold text-white transition hover:bg-brand-hover disabled:opacity-50"
          >
            {loading ? "登録中..." : "アカウントを作成"}
          </button>
        </form>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-main" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-4 text-text-muted">または</span>
          </div>
        </div>
        <GoogleLoginButton />
        <p className="mt-4 text-center text-sm text-text-secondary">
          既にアカウントがある？{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-brand-text hover:underline"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
