import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Clerk 키가 없으면 미들웨어 자체를 bypass (배포 전 키 미설정 방어)
const clerkEnabled =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

// 인증 없이 접근 가능한 경로
const isPublic = createRouteMatcher([
  "/",
  "/play(.*)",
  "/api/play(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!clerkEnabled) return NextResponse.next();
  if (!isPublic(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Next.js 내부 파일과 정적 파일 제외
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
