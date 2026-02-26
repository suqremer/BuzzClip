"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/social/NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { useTranslation } from "@/hooks/useTranslation";

function GuideTip() {
  const [show, setShow] = useState(false);
  const { locale } = useTranslation();

  useEffect(() => {
    const seen = localStorage.getItem("buzzclip_guide_seen");
    if (!seen) setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem("buzzclip_guide_seen", "1");
    setShow(false);
  };

  return (
    <Link
      href="/guide"
      onClick={dismiss}
      className="relative flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand-text transition hover:bg-brand/20"
    >
      <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
      </span>
      {locale === "ja" ? "使い方" : "Guide"}
    </Link>
  );
}

export function Header() {
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, locale, changeLocale } = useTranslation();

  return (
    <header className="sticky top-0 z-50 border-b border-border-main bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
        <Link href="/" className="shrink-0 text-xl font-bold text-brand-text">
          BuzzClip
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <GuideTip />
          {user && <NotificationBell />}
          <button
            className="rounded-lg p-1.5 text-text-primary transition hover:bg-hover-bg"
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
      </div>

      {menuOpen && (
        <div className="border-t border-border-light bg-surface px-4 py-3">
          <div className="mx-auto max-w-5xl">
            <Link href="/ranking" className="block py-2 text-text-primary hover:text-brand-text" onClick={() => setMenuOpen(false)}>
              {t("ranking")}
            </Link>
            <Link href="/search" className="block py-2 text-text-primary hover:text-brand-text" onClick={() => setMenuOpen(false)}>
              {t("search")}
            </Link>
            <Link href="/submit" className="block py-2 text-text-primary hover:text-brand-text" onClick={() => setMenuOpen(false)}>
              {t("submit")}
            </Link>
            {user && (
              <Link href="/mypage" className="block py-2 text-text-primary hover:text-brand-text" onClick={() => setMenuOpen(false)}>
                {t("mypage")}
              </Link>
            )}

            <div className="flex flex-wrap gap-3 border-t border-border-light py-2 text-sm text-text-secondary">
              <Link href="/guide" className="hover:text-brand-text" onClick={() => setMenuOpen(false)}>
                {t("footerHowToUse")}
              </Link>
              <Link href="/guide#homescreen" className="hover:text-brand-text" onClick={() => setMenuOpen(false)}>
                {t("addToHomeScreen")}
              </Link>
              <Link href="/feedback" className="hover:text-brand-text" onClick={() => setMenuOpen(false)}>
                {t("footerFeedback")}
              </Link>
            </div>

            <div className="flex items-center gap-3 border-t border-border-light py-2">
              <ThemeToggle />
              <span className="text-xs text-text-muted">{locale === "ja" ? "テーマ切替" : "Theme"}</span>
              <span className="text-border-light">|</span>
              <button
                onClick={() => changeLocale(locale === "ja" ? "en" : "ja")}
                className="rounded-md px-2 py-1 text-xs font-medium text-text-muted transition hover:bg-hover-bg hover:text-text-primary"
              >
                {locale === "ja" ? "EN" : "JA"}
              </button>
              <span className="text-xs text-text-muted">{locale === "ja" ? "言語切替" : "Language"}</span>
            </div>

            {loading ? (
              <div className="h-8" />
            ) : user ? (
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
                  {locale === "ja" ? "ログアウト" : "Logout"}
                </button>
              </>
            ) : (
              <div className="flex gap-3 border-t border-border-light py-3">
                <Link
                  href="/auth/signin"
                  className="rounded-lg border border-input-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-hover-bg"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("signin")}
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
                  onClick={() => setMenuOpen(false)}
                >
                  {locale === "ja" ? "新規登録" : "Sign Up"}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
