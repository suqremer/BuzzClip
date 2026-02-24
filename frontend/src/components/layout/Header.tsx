"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/social/NotificationBell";
import { SearchPopover } from "./SearchPopover";
import { SubmitPopover } from "./SubmitPopover";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border-main bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
        <Link href="/" className="shrink-0 text-xl font-bold text-brand-text">
          BuzzClip
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
          <Link href="/ranking" className="text-sm font-medium text-text-primary hover:text-brand-text">
            ランキング
          </Link>
          <SearchPopover />
          <SubmitPopover />
        </nav>

        <div className="hidden shrink-0 md:block">
          {loading ? (
            <div className="h-8 w-16" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NotificationBell />
              <Link href="/mypage" className="flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-hover-bg">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-medium text-xs font-bold text-brand-text">
                    {user.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-text-primary">
                  {user.display_name}
                </span>
              </Link>
              <button
                onClick={logout}
                className="rounded-lg border border-input-border px-3 py-1.5 text-sm text-text-primary transition hover:bg-hover-bg"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/auth/signin"
                className="rounded-lg border border-input-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-hover-bg"
              >
                ログイン
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
              >
                新規登録
              </Link>
            </div>
          )}
        </div>

        <button
          className="ml-auto text-text-primary md:hidden"
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
        <div className="border-t border-border-light bg-surface px-4 py-3 md:hidden">
          <Link href="/ranking" className="block py-2 text-text-primary" onClick={() => setMenuOpen(false)}>
            ランキング
          </Link>
          <Link href="/search" className="block py-2 text-text-primary" onClick={() => setMenuOpen(false)}>
            検索
          </Link>
          <Link href="/submit" className="block py-2 text-text-primary" onClick={() => setMenuOpen(false)}>
            投稿する
          </Link>
          {user && (
            <Link href="/mypage" className="block py-2 text-text-primary" onClick={() => setMenuOpen(false)}>
              マイページ
            </Link>
          )}
          <div className="flex items-center gap-2 border-t border-border-light py-2">
            <ThemeToggle />
            <span className="text-xs text-text-muted">テーマ切替</span>
          </div>
          {user ? (
            <>
              <Link href="/mypage" className="flex items-center gap-2 border-t border-border-light py-2 text-sm text-text-secondary" onClick={() => setMenuOpen(false)}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-medium text-xs font-bold text-brand-text">
                    {user.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                {user.display_name}
              </Link>
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="block w-full py-2 text-left text-red-500"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="block py-2 font-medium text-text-primary" onClick={() => setMenuOpen(false)}>
                ログイン
              </Link>
              <Link href="/auth/signup" className="block py-2 font-medium text-brand-text" onClick={() => setMenuOpen(false)}>
                新規登録
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
