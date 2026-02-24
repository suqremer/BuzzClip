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
        <h1 className="mb-8 text-center text-2xl font-bold">新規登録</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-display-name" className="mb-1 block text-sm font-medium text-gray-700">
              表示名
            </label>
            <input
              id="signup-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="BuzzClipユーザー"
            />
          </div>
          <div>
            <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="mail@example.com"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-gray-700">
              パスワード
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="8文字以上"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "登録中..." : "アカウントを作成"}
          </button>
        </form>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-400">または</span>
          </div>
        </div>
        <GoogleLoginButton />
        <p className="mt-4 text-center text-sm text-gray-500">
          既にアカウントがある？{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-indigo-600 hover:underline"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
