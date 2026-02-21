"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/constants";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      if (!code) {
        setError("認証コードが見つかりません");
        return;
      }

      try {
        const res = await fetch(
          `${API_URL}/api/auth/google/callback?${searchParams.toString()}`,
          { credentials: "include" },
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({ detail: "Google認証に失敗しました" }));
          setError(body.detail || "Google認証に失敗しました");
          return;
        }

        const data = await res.json();
        await login(data.access_token);
        router.push("/");
      } catch {
        setError("Google認証に失敗しました");
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
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" role="status" aria-label="認証中" />
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
