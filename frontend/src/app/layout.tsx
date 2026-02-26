import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthProvider } from "@/contexts/AuthContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { AgeGate } from "@/components/AgeGate";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "BuzzClip - エロ動画ランキング | Xのセクシー動画まとめ",
    template: "%s | BuzzClip",
  },
  description:
    "X(Twitter)でバズったエロ動画・セクシー動画をみんなで集めてランキング化。素人・コスプレ・グラビア・アイドルなどカテゴリ別に毎日更新。",
  keywords: [
    "エロ動画", "セクシー動画", "ランキング", "バズ動画",
    "Twitter エロ動画", "X エロ動画", "アダルト動画", "人気動画",
    "素人", "コスプレ", "グラビア", "ダンス",
  ],
  openGraph: {
    title: "BuzzClip - エロ動画ランキング | Sexy Video Rankings",
    description:
      "Xでバズったエロ動画をランキングで毎日更新 / Trending adult videos from X, ranked daily.",
    type: "website",
    siteName: "BuzzClip",
  },
  twitter: {
    card: "summary",
    title: "BuzzClip - エロ動画ランキング | Sexy Video Rankings",
    description:
      "Xでバズったエロ動画をランキングで毎日更新 / Trending adult videos from X, ranked daily.",
  },
  verification: {
    google: "4MSVobYR4tbSxIih_ZtBYvyROOcKbJDdXh2CWZFGh3s",
  },
  other: {
    "rating": "adult",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BuzzClip",
    alternateName: "バズクリップ",
    url: "https://buzzclip.jp",
    description:
      "X(Twitter)でバズったエロ動画・セクシー動画をランキングで毎日更新",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://buzzclip.jp/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <GoogleAnalytics />
      <body className={`${notoSansJP.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <PreferencesProvider>
              <AgeGate />
              <Header />
              <main className="min-h-screen pb-16 md:pb-0">{children}</main>
              <Footer />
              <BottomNav />
            </PreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
