/**
 * 학생 식별값 정규화(이름 / 출석번호만 모드) + 데모 정적 단원 목록 검증 (DB 불필요).
 * 실행: npx tsx scripts/verify-student-id.ts
 */
import { normalizeStudentId, STUDENT_NUMBER_REQUIRED } from "../src/lib/student-id";
import { GRADE3_UNITS, GRADE4_UNITS, mathUnitsFor } from "../src/lib/curriculum";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

function numberOf(raw: string): string | null {
  const r = normalizeStudentId("NUMBER", raw);
  return r.ok ? r.studentName : null;
}

// ── NAME 모드: 기존 동작 유지 ─────────────────────────────
const nameMode = normalizeStudentId("NAME", "  홍길동 ");
assert(nameMode.ok && nameMode.studentName === "홍길동", "NAME mode trims and keeps name");
const nameDigits = normalizeStudentId("NAME", "12");
assert(nameDigits.ok && nameDigits.studentName === "12", "NAME mode accepts digits as-is");

// ── NUMBER 모드 ───────────────────────────────────────────
assert(numberOf("12") === "12번", "NUMBER: 12 → 12번");
assert(numberOf(" 7 ") === "7번", "NUMBER: trims");
assert(numberOf("12번") === "12번", "NUMBER: accepts 12번");
assert(numberOf("03") === "3번", "NUMBER: strips leading zero");
assert(numberOf("99") === "99번", "NUMBER: 99 is max");
assert(numberOf("0") === null, "NUMBER: 0 rejected");
assert(numberOf("100") === null, "NUMBER: 100 rejected");
assert(numberOf("홍길동") === null, "NUMBER: name rejected");
assert(numberOf("1.5") === null, "NUMBER: decimal rejected");
const rejected = normalizeStudentId("NUMBER", "홍길동");
assert(!rejected.ok && rejected.code === STUDENT_NUMBER_REQUIRED, "NUMBER: rejection carries code");

// ── 데모 정적 단원 목록 ───────────────────────────────────
for (const grade of [3, 4]) {
  for (const term of [1, 2]) {
    const units = mathUnitsFor(grade, term);
    assert(units.length > 0, `mathUnitsFor(${grade}, ${term}) not empty`);
    assert(
      units.every((u, i) => u.order === i + 1 && u.term === term),
      `mathUnitsFor(${grade}, ${term}) orders are 1..n`
    );
    assert(
      units.every((u) => !("constraints" in u)),
      `mathUnitsFor(${grade}, ${term}) omits constraints`
    );
  }
}
assert(GRADE3_UNITS.length === 12 && GRADE4_UNITS.length === 12, "seed unit counts unchanged");
assert(mathUnitsFor(5, 1).length === 0, "unsupported grade → empty");

console.log("\nAll student-id / curriculum checks passed.");
