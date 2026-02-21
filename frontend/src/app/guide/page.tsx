import Link from "next/link";

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold">BuzzClipの使い方</h1>
      <p className="mt-2 text-gray-500">
        BuzzClipはみんなでバズ動画を集めて、ランキングを作るサービスです。
      </p>

      <div className="mt-10 space-y-10">
        {/* Step 1 */}
        <section>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">1</span>
            <h2 className="text-lg font-bold">動画を見つけて投稿する</h2>
          </div>
          <div className="ml-11 mt-2 text-sm leading-relaxed text-gray-600">
            <p>X(Twitter)、YouTube、TikTokでバズっている動画のURLをコピーして、BuzzClipの「投稿する」ページに貼り付けます。カテゴリを選んで送信すれば完了！</p>
            <p className="mt-2">ひとことコメントも添えられます。「#おもしろ」のように#を付けるとタグになり、動画カードに表示されます。</p>
          </div>
        </section>

        {/* Step 2 */}
        <section>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">2</span>
            <h2 className="text-lg font-bold">いいねで応援する</h2>
          </div>
          <div className="ml-11 mt-2 text-sm leading-relaxed text-gray-600">
            <p>面白い！と思った動画にはいいね（投票）しましょう。いいねが多い動画ほどランキングが上がります。</p>
          </div>
        </section>

        {/* Step 3 */}
        <section>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">3</span>
            <h2 className="text-lg font-bold">ランキングを楽しむ</h2>
          </div>
          <div className="ml-11 mt-2 text-sm leading-relaxed text-gray-600">
            <p>24時間・1週間・1ヶ月・全期間のランキングや、カテゴリ別・プラットフォーム別で動画を探せます。プラットフォームの選択は自動で保存されるので、次回も同じ設定で表示されます。トレンドタブでは今まさに盛り上がっている動画をチェック！</p>
          </div>
        </section>

        {/* Step 4 */}
        <section>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">4</span>
            <h2 className="text-lg font-bold">リストを作る</h2>
          </div>
          <div className="ml-11 mt-2 text-sm leading-relaxed text-gray-600">
            <p>お気に入りの動画をリスト（プレイリスト）にまとめられます。「あとで見る」リストが自動で作成されるほか、自分で好きなリストを作ることもできます。</p>
          </div>
        </section>

        {/* Step 5 */}
        <section>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">5</span>
            <h2 className="text-lg font-bold">フォロー & バッジ</h2>
          </div>
          <div className="ml-11 mt-2 text-sm leading-relaxed text-gray-600">
            <p>気になる投稿者をフォローして、最新の投稿をチェック。たくさん投稿したりいいねを集めると、バッジが獲得できます！</p>
          </div>
        </section>

        {/* Step 6 */}
        <section>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">6</span>
            <h2 className="text-lg font-bold">シェアする</h2>
          </div>
          <div className="ml-11 mt-2 text-sm leading-relaxed text-gray-600">
            <p>お気に入りの動画はX(Twitter)やLINEでシェアできます。リンクコピーボタンで簡単にURLを共有！</p>
          </div>
        </section>
      </div>

      <div className="mt-12 rounded-xl bg-indigo-50 p-6 text-center">
        <p className="text-sm font-medium text-indigo-700">
          ご意見・ご要望はいつでも歓迎です！
        </p>
        <Link
          href="/feedback"
          className="mt-3 inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          フィードバックを送る
        </Link>
      </div>
    </div>
  );
}
