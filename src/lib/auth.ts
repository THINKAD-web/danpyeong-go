// ============================================================
// Clerk 실인증 — @clerk/nextjs v7
// currentTeacher()는 서버 전용(Server Component / API Route)
// 학생 /play 경로는 인증 없이 그대로 유지
// ============================================================

import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export type TeacherSession = {
  id: string;       // Clerk userId (= User.clerkId in DB)
  name: string;
  email: string;
  role: "TEACHER" | "ADMIN";
};

/**
 * 현재 로그인한 교사 세션을 반환.
 * 미인증 시 에러를 던진다 — middleware가 먼저 막으므로 교사 경로에서만 호출.
 */
export async function currentTeacher(): Promise<TeacherSession> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: 로그인이 필요합니다.");
  }

  const user = await currentUser();
  const nameParts = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const name = user?.fullName || nameParts || user?.username || "선생님";
  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  return { id: userId, name, email, role: "TEACHER" };
}

/**
 * ADMIN 전용 — DB에서 role을 확인한다.
 * Role.ADMIN이 아니면 403 에러를 던진다.
 */
export async function currentAdmin(): Promise<TeacherSession> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true, name: true, email: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    throw new Error("Forbidden: 관리자 권한이 필요합니다.");
  }

  const user = await currentUser();
  const nameParts = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const name = dbUser.name || user?.fullName || nameParts || user?.username || "관리자";
  const email = dbUser.email || (user?.emailAddresses[0]?.emailAddress ?? "");

  return { id: userId, name, email, role: "ADMIN" };
}

export const IS_MOCK_AUTH = false;
