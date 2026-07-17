import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 인증 없이 접근 가능한 경로
const isPublic = createRouteMatcher([
  "/",
  "/privacy",
  "/play(.*)",
  "/api/play(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    // 미인증 시 Clerk 로그인 페이지로 리다이렉트
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
