"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Googleアカウントの認証が拒否されました",
  invalid_state: "認証セッションが無効です（もう一度お試しください）",
  no_code: "認証コードが取得できませんでした",
  token_failed: "Googleとのトークン交換に失敗しました",
  userinfo_failed: "Googleからユーザー情報を取得できませんでした",
  incomplete_profile: "Googleアカウントのプロフィール情報が不足しています",
  db_error: "サーバーエラーが発生しました",
};

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const errorParam = searchParams.get("error");
      if (errorParam) {
        const detail = searchParams.get("detail");
        const message =
          ERROR_MESSAGES[errorParam] || "Google認証に失敗しました";
        setError(detail ? `${message}（${detail}）` : message);
        return;
      }

      const token = searchParams.get("token");
      if (!token) {
        setError("認証トークンが見つかりません");
        return;
      }

      try {
        await login(token);
        router.push("/");
      } catch {
        setError("ログインに失敗しました");
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  if (error) {
    return (
      <div className="text-center">
        <p className="mb-4 text-red-500">{error}</p>
        <a href="/auth/signin" className="text-indigo-600 hover:underline">
          ログインページに戻る
        </a>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div
        className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
        role="status"
        aria-label="認証中"
      />
      <p className="text-gray-500">Google認証中...</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="text-gray-500">読み込み中...</p>
          </div>
        }
      >
        <GoogleCallbackContent />
      </Suspense>
    </div>
  );
}
