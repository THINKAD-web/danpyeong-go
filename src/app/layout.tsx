import type { Metadata } from "next";
import { Gaegu, Noto_Sans_KR } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { PwaRegister } from "@/components/PwaRegister";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const gaegu = Gaegu({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const notoSansKR = Noto_Sans_KR({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "단평GO — 검수된 문제은행으로 3분 만에 만드는 단원평가",
  description:
    "검수된 문항으로 빠르게 만들고, 바로 배포·채점까지. 초등 3학년 수학 단원평가 무료 베타.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "단평GO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${gaegu.variable} ${notoSansKR.variable}`}>
      <head>
        <meta name="theme-color" content="#3d5af1" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <ClerkProvider>{children}</ClerkProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
