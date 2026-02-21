import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン - BuzzClip",
  robots: { index: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
