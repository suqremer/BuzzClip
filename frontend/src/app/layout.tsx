import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { AdSense } from "@/components/AdSense";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "BuzzClip - バズ動画ランキング",
  description:
    "X(Twitter)で話題のバズ動画をみんなで集めてランキング化",
  openGraph: {
    title: "BuzzClip - バズ動画ランキング",
    description:
      "X(Twitter)で話題のバズ動画をみんなで集めてランキング化",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BuzzClip - バズ動画ランキング",
    description: "X(Twitter)で話題のバズ動画をみんなで集めてランキング化",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <GoogleAnalytics />
      <AdSense />
      <body className={`${notoSansJP.variable} font-sans antialiased`}>
        <AuthProvider>
          <Header />
          <main className="min-h-screen pb-16 md:pb-0">{children}</main>
          <Footer />
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
