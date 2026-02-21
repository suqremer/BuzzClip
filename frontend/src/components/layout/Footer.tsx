import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-6">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
          <Link href="/guide" className="hover:text-indigo-600">使い方</Link>
          <Link href="/feedback" className="hover:text-indigo-600">フィードバック</Link>
        </div>
        <p className="mt-3 text-center text-sm text-gray-400">
          &copy; 2026 BuzzClip. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
