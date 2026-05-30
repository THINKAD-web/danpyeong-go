// ============================================================
// Mock 인증 — 로컬 스캐폴드용
// Clerk 키 없이도 동작하도록 가짜 교사 세션을 반환한다.
//
// ▶ Claude Code 작업: 이 파일을 Clerk(@clerk/nextjs)으로 교체.
//   - currentTeacher() → Clerk auth() + DB User 매핑
//   - middleware.ts 로 /teacher 경로 보호
// ============================================================

export type TeacherSession = {
  id: string;
  name: string;
  email: string;
  role: "TEACHER" | "ADMIN";
};

/** 현재 로그인한 교사 (mock). 항상 동일한 데모 교사를 반환. */
export function currentTeacher(): TeacherSession {
  return {
    id: "teacher_demo",
    name: "김선생",
    email: "demo.teacher@danpyeong.go",
    role: "TEACHER",
  };
}

export const IS_MOCK_AUTH = true;
