import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 px-4 py-24 text-center text-white sm:py-32">
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          バズった動画、
          <br />
          ぜんぶここに。
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-indigo-100 sm:text-xl">
          みんなで見つけて、みんなで育てる
          <br className="sm:hidden" />
          動画ランキング
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/ranking"
            className="w-full rounded-full bg-white px-8 py-3.5 text-base font-bold text-indigo-600 shadow-lg transition hover:bg-indigo-50 sm:w-auto"
          >
            ランキングを見る
          </Link>
          <Link
            href="/submit"
            className="w-full rounded-full border-2 border-white px-8 py-3.5 text-base font-bold text-white transition hover:bg-white/10 sm:w-auto"
          >
            動画を投稿する
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            かんたん3ステップ
          </h2>
          <p className="mt-3 text-center text-gray-500">
            バズ動画をみんなでシェアして、ランキングをつくろう
          </p>
          <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl">
                🔍
              </div>
              <div className="mt-2 text-sm font-bold text-indigo-600">
                Step 1
              </div>
              <h3 className="mt-2 text-lg font-bold">見つける</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                バズっている動画の
                <br />
                URLをコピー
              </p>
            </div>
            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl">
                📋
              </div>
              <div className="mt-2 text-sm font-bold text-indigo-600">
                Step 2
              </div>
              <h3 className="mt-2 text-lg font-bold">投稿する</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                BuzzClipにURLを貼るだけ
                <br />
                カテゴリを選択
              </p>
            </div>
            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl">
                🚀
              </div>
              <div className="mt-2 text-sm font-bold text-indigo-600">
                Step 3
              </div>
              <h3 className="mt-2 text-lg font-bold">みんなで育てる</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                いいねで動画が
                <br />
                ランキングUP
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Showcase */}
      <section className="bg-gray-50 px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            カテゴリから探す
          </h2>
          <p className="mt-3 text-center text-gray-500">
            気になるジャンルのバズ動画をチェック
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ranking?category=${cat.slug}`}
                className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xl">
                  {cat.icon}
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  {cat.nameJa}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 py-20 text-center sm:py-24">
        <h2 className="text-2xl font-bold sm:text-3xl">
          今すぐバズ動画を探そう
        </h2>
        <p className="mx-auto mt-4 max-w-md text-gray-500">
          毎日更新されるランキングで、話題の動画を見逃さない。
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/ranking"
            className="inline-block rounded-full bg-indigo-600 px-10 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-indigo-700"
          >
            ランキングを見る
          </Link>
          <Link
            href="/guide"
            className="inline-block rounded-full border-2 border-gray-300 px-8 py-3.5 text-base font-bold text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600"
          >
            使い方を見る
          </Link>
        </div>
      </section>
    </div>
  );
}
