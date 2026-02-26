"use client";

import Link from "next/link";
import { useT } from "@/hooks/useTranslation";

export function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-border-main bg-surface-secondary py-6">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-text-secondary">
          <Link href="/guide" className="hover:text-brand-text">{t("footerHowToUse")}</Link>
          <Link href="/guide#homescreen" className="hover:text-brand-text">{t("addToHomeScreen")}</Link>
          <Link href="/feedback" className="hover:text-brand-text">{t("footerFeedback")}</Link>
        </div>
        <p className="mt-3 text-center text-sm text-text-muted">
          &copy; 2026 BuzzClip. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
