import type { Metadata } from "next";
import { Gaegu, Noto_Sans_KR } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { PwaRegister } from "@/components/PwaRegister";
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
  title: "단평GO — 초등 단원평가, AI로 5분 컷!",
  description:
    "초등 교사가 2022 개정 교육과정에 맞춰 단원평가를 AI로 빠르게 만들고 배포·채점·분석하는 경량 SaaS",
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
