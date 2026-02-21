"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/social/NotificationBell";

export function Header() {
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          BuzzClip
        </Link>

        <nav className="hidden gap-6 md:flex">
          <Link href="/ranking" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
            ランキング
          </Link>
          <Link href="/search" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
            検索
          </Link>
          <Link href="/submit" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
            投稿する
          </Link>
          {user && (
            <Link href="/mypage" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
              マイページ
            </Link>
          )}
        </nav>

        <div className="hidden md:block">
          {loading ? (
            <div className="h-8 w-16" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">
                {user.display_name}
              </span>
              <button
                onClick={logout}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/signin"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ログイン
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                新規登録
              </Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="メニュー"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 md:hidden">
          <Link href="/ranking" className="block py-2 text-gray-700" onClick={() => setMenuOpen(false)}>
            ランキング
          </Link>
          <Link href="/search" className="block py-2 text-gray-700" onClick={() => setMenuOpen(false)}>
            検索
          </Link>
          <Link href="/submit" className="block py-2 text-gray-700" onClick={() => setMenuOpen(false)}>
            投稿する
          </Link>
          {user && (
            <Link href="/mypage" className="block py-2 text-gray-700" onClick={() => setMenuOpen(false)}>
              マイページ
            </Link>
          )}
          {user ? (
            <>
              <div className="flex items-center gap-2 border-t border-gray-100 py-2 text-sm text-gray-500">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                    {user.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                {user.display_name}
              </div>
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="block w-full py-2 text-left text-red-500"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="block py-2 font-medium text-gray-700" onClick={() => setMenuOpen(false)}>
                ログイン
              </Link>
              <Link href="/auth/signup" className="block py-2 font-medium text-indigo-600" onClick={() => setMenuOpen(false)}>
                新規登録
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
