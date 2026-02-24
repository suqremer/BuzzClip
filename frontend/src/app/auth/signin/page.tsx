"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import type { AuthResponse } from "@/types/api";

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiPost<AuthResponse>("/api/auth/login", {
        email,
        password,
      });
      await login();
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ログインに失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex rounded-lg bg-chip-bg p-1">
          <div className="flex-1 rounded-md bg-surface px-4 py-2 text-center text-sm font-bold text-text-heading shadow-sm">
            ログイン
          </div>
          <Link
            href="/auth/signup"
            className="flex-1 rounded-md px-4 py-2 text-center text-sm font-medium text-text-secondary transition hover:text-text-primary"
          >
            新規登録
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signin-email" className="mb-1 block text-sm font-medium text-text-primary">
              メールアドレス
            </label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-input-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="mail@example.com"
            />
          </div>
          <div>
            <label htmlFor="signin-password" className="mb-1 block text-sm font-medium text-text-primary">
              パスワード
            </label>
            <input
              id="signin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-input-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-bold text-white transition hover:bg-brand-hover disabled:opacity-50"
          >
            {loading ? "ログイン中..." : "ログイン"}
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
          アカウントがない？{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-brand-text hover:underline"
          >
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
