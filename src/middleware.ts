import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

const isPublic = createRouteMatcher([
  "/",
  "/play(.*)",
  "/api/play(.*)",
]);

// clerkMiddleware가 키 없을 때 던지는 에러를 외부에서 catch
const clerk = clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    await auth.protect();
  }
});

export async function middleware(req: NextRequest) {
  try {
    // clerk() 반환값이 NextResponse | void 일 수 있음
    const res = await (clerk as (req: NextRequest) => Promise<NextResponse | void>)(req);
    return res ?? NextResponse.next();
  } catch {
    // Clerk 키 미설정 또는 기타 에러 → 그냥 통과 (사이트 다운 방지)
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
