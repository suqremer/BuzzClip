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
  title: "BuzzClip - セクシー動画ランキング",
  description:
    "Xでバズったセクシー動画をみんなで集めてランキング化。毎日更新の動画ランキング。",
  openGraph: {
    title: "BuzzClip - セクシー動画ランキング",
    description:
      "Xでバズったセクシー動画をみんなで集めてランキング化。毎日更新の動画ランキング。",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BuzzClip - セクシー動画ランキング",
    description: "Xでバズったセクシー動画をみんなで集めてランキング化。毎日更新。",
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
  return (
    <html lang="ja" suppressHydrationWarning>
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
