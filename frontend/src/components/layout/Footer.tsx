import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border-main bg-surface-secondary py-6">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-text-secondary">
          <Link href="/guide" className="hover:text-brand-text">使い方</Link>
          <Link href="/guide#homescreen" className="hover:text-brand-text">ホーム画面に追加</Link>
          <Link href="/feedback" className="hover:text-brand-text">フィードバック</Link>
        </div>
        <p className="mt-3 text-center text-sm text-text-muted">
          &copy; 2026 BuzzClip. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
