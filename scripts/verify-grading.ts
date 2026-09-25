/**
 * 단답형 채점 정규화 검증 — 대분수 표기 (DB 불필요).
 * 실행: npx tsx scripts/verify-grading.ts
 */
import { gradeShortAnswer, normalizeAnswer } from "../src/lib/grading";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

assert(normalizeAnswer("1 2/3") === "1과2/3", "mixed number with space keeps whole part separate");
assert(gradeShortAnswer("1 2/3", ["1과 2/3"]), "'1 2/3' matches '1과 2/3'");
assert(gradeShortAnswer("1과 2/3", ["1 2/3"]), "'1과 2/3' matches '1 2/3' (was wrongly marked incorrect)");
assert(gradeShortAnswer("2와1/4", ["2 1/4"]), "'2와1/4' matches '2 1/4'");
assert(!gradeShortAnswer("12/3", ["1 2/3"]), "'12/3' no longer matches mixed '1 2/3' (was wrongly marked correct)");
assert(gradeShortAnswer("12/3", ["12/3"]), "improper fraction still matches itself");
assert(gradeShortAnswer(" 3/4 ", ["3/4"]) && gradeShortAnswer("3 / 4", ["3/4"]), "plain fraction spacing ignored");
assert(gradeShortAnswer("1,200", ["1200"]) && gradeShortAnswer("128 자루", ["128자루"]), "comma / spacing unchanged");
assert(gradeShortAnswer("ABC", ["abc"]), "case-insensitive unchanged");
assert(!gradeShortAnswer("anything", []), "no keywords → incorrect");

console.log("\nAll grading checks passed.");
