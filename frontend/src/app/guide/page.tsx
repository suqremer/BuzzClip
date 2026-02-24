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
            <p>X(Twitter)、YouTube、TikTokでバズっている動画のURLをコピーして投稿します。ヘッダーの「投稿」ボタンからサッと投稿するか、<Link href="/submit" className="text-indigo-600 hover:underline">投稿ページ</Link>からじっくり投稿できます。カテゴリを選んで送信すれば完了！</p>
            <p className="mt-2">ひとことコメントも添えられます。「#おもしろ」のように#を付けるとタグになり、動画カードに表示されます。投稿した動画はマイページから編集・削除もできます。</p>
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
            <p>お気に入りの動画をリスト（プレイリスト）にまとめられます。「お気に入り」リストが自動で作成されるほか、自分で好きなリストを作ることもできます。</p>
          </div>
        </section>

        {/* Step 5 */}
        <section>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">5</span>
            <h2 className="text-lg font-bold">フォロー & バッジ</h2>
          </div>
          <div className="ml-11 mt-2 text-sm leading-relaxed text-gray-600">
            <p>気になる投稿者をフォローできます。たくさん投稿したりいいねを集めると、バッジが獲得できます！</p>
          </div>
        </section>

        {/* Step 6 */}
        <section>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">6</span>
            <h2 className="text-lg font-bold">検索する</h2>
          </div>
          <div className="ml-11 mt-2 text-sm leading-relaxed text-gray-600">
            <p>ヘッダーの検索ボタンから、動画タイトル・投稿者名・タグで動画を探せます。「#猫」のようにタグ名で検索すると、そのタグが付いた動画が見つかります。</p>
          </div>
        </section>

        {/* Step 7 */}
        <section>
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">7</span>
            <h2 className="text-lg font-bold">シェアする</h2>
          </div>
          <div className="ml-11 mt-2 text-sm leading-relaxed text-gray-600">
            <p>お気に入りの動画はX(Twitter)やLINEでシェアできます。リンクコピーボタンで簡単にURLを共有！</p>
          </div>
        </section>

        {/* Step 8: ホーム画面に追加 */}
        <section id="homescreen">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">8</span>
            <h2 className="text-lg font-bold">ホーム画面に追加（スマホ）</h2>
          </div>
          <div className="ml-11 mt-2 text-sm leading-relaxed text-gray-600">
            <p>スマホのホーム画面にBuzzClipを追加すると、アプリのようにワンタップで開けます。</p>

            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="mb-2 font-bold text-gray-700">iPhoneの場合（Safari）</p>
              <ol className="list-inside list-decimal space-y-1 text-gray-600">
                <li>Safariで <span className="font-medium">buzzclip.jp</span> を開く</li>
                <li>下部の共有ボタン（□に↑のアイコン）をタップ</li>
                <li>「ホーム画面に追加」を選択</li>
                <li>「追加」をタップして完了！</li>
              </ol>
            </div>

            <div className="mt-3 rounded-lg bg-gray-50 p-4">
              <p className="mb-2 font-bold text-gray-700">Androidの場合（Chrome）</p>
              <ol className="list-inside list-decimal space-y-1 text-gray-600">
                <li>Chromeで <span className="font-medium">buzzclip.jp</span> を開く</li>
                <li>右上の「︙」メニューをタップ</li>
                <li>「ホーム画面に追加」を選択</li>
                <li>「追加」をタップして完了！</li>
              </ol>
            </div>
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
