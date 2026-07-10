import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 인증 없이 접근 가능한 경로
const isPublic = createRouteMatcher([
  "/",
  "/play(.*)",
  "/api/play(.*)",
  // Clerk 서버 → svix 서명 검증이 인증을 대체한다 (route.ts 참고)
  "/api/webhooks/clerk",
  // Vercel Cron → Authorization: Bearer CRON_SECRET 이 인증을 대체한다 (route.ts 참고)
  "/api/cron/anonymize-attempts",
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
