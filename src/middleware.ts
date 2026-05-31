import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";

const isPublic = createRouteMatcher([
  "/",
  "/play(.*)",
  "/api/play(.*)",
]);

const clerk = clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    await auth.protect();
  }
});

export async function middleware(req: NextRequest, event: NextFetchEvent) {
  try {
    const res = await clerk(req, event);
    return res ?? NextResponse.next();
  } catch {
    // Clerk 키 미설정 등 초기화 실패 시 통과
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
