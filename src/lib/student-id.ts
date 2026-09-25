// 학생 응시 식별값 정규화 — Test.studentIdMode 에 따라 이름 또는 출석번호를 받는다.
// NUMBER 모드: "12", "12번", " 012 " → "12번" (1~99). 이름은 받지 않는다.

export type StudentIdModeValue = "NAME" | "NUMBER";

export const STUDENT_NUMBER_REQUIRED = "STUDENT_NUMBER_REQUIRED";

export type NormalizeResult =
  | { ok: true; studentName: string }
  | { ok: false; code: typeof STUDENT_NUMBER_REQUIRED; error: string };

export function normalizeStudentId(mode: StudentIdModeValue, raw: string): NormalizeResult {
  const value = raw.trim();
  if (mode === "NAME") return { ok: true, studentName: value };

  const m = /^0*(\d{1,2})\s*번?$/.exec(value);
  const n = m ? Number(m[1]) : NaN;
  if (!Number.isInteger(n) || n < 1 || n > 99) {
    return {
      ok: false,
      code: STUDENT_NUMBER_REQUIRED,
      error: "이 평가는 이름 대신 출석번호(숫자)만 입력해요. 예: 12",
    };
  }
  return { ok: true, studentName: `${n}번` };
}
