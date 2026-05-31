/**
 * 문항 생성 품질 검증 스크립트
 * 실행: npx tsx scripts/verify-questions.ts
 *
 * 4가지 조건(곱셈/중, 나눗셈/상, 분수/중, 들이무게/중)으로 각 5문항 생성 후
 * 전수 검산하여 결함 여부를 표로 출력.
 */

import { generateQuestions, validateQuestion } from "../src/lib/ai";
import type { GenerateInput, GeneratedQuestion } from "../src/lib/ai";

// ── 검산 로직 ─────────────────────────────────────────────

/** stem에서 단순 사칙연산 식을 추출해 직접 계산 */
function extractAndVerify(stem: string, correctValue: string): "OK" | "FAIL" | "SKIP" {
  // □ 또는 ? 가 있는 식 패턴: "□ × 6 = 48" / "12 × □ = 48" / "28 ÷ 4 = □"
  const fill = stem.match(/(\d+)\s*[×x\*]\s*(\d+)\s*=\s*[□?_]/) ||
               stem.match(/[□?_]\s*[×x\*]\s*(\d+)\s*=\s*(\d+)/) ||
               stem.match(/(\d+)\s*[×x\*]\s*[□?_]\s*=\s*(\d+)/);
  const divFill = stem.match(/(\d+)\s*÷\s*(\d+)\s*=\s*[□?_]/) ||
                  stem.match(/[□?_]\s*÷\s*(\d+)\s*=\s*(\d+)/);
  const addFill = stem.match(/(\d+)\s*\+\s*(\d+)\s*=\s*[□?_]/) ||
                  stem.match(/[□?_]\s*\+\s*(\d+)\s*=\s*(\d+)/);
  const subFill = stem.match(/(\d+)\s*-\s*(\d+)\s*=\s*[□?_]/);

  const cv = correctValue.replace(/[^0-9]/g, "");
  const num = parseInt(cv, 10);
  if (isNaN(num)) return "SKIP";

  if (divFill) {
    const a = parseInt(divFill[1], 10);
    const b = parseInt(divFill[2], 10);
    if (b === 0) return "FAIL";
    // □ ÷ b = c → a = c*b
    if (divFill[0].startsWith("□") || divFill[0].startsWith("?") || divFill[0].startsWith("_")) {
      return num * b === a ? "OK" : "FAIL";
    }
    // a ÷ b = □
    if (a % b !== 0) return "FAIL"; // 나누어떨어지지 않는데 몫만 묻는 경우
    return Math.floor(a / b) === num ? "OK" : "FAIL";
  }
  if (fill) {
    const a = parseInt(fill[1], 10);
    const b = parseInt(fill[2], 10);
    return a * b === num ? "OK" : "FAIL";
  }
  if (addFill) {
    const a = parseInt(addFill[1], 10);
    const b = parseInt(addFill[2], 10);
    return a + b === num ? "OK" : "FAIL";
  }
  if (subFill) {
    const a = parseInt(subFill[1], 10);
    const b = parseInt(subFill[2], 10);
    return a - b === num ? "OK" : "FAIL";
  }
  return "SKIP";
}

function checkDivisibility(stem: string): "OK" | "FAIL" | "SKIP" {
  // stem에 나눗셈이 있고, 정답이 몫인 경우 나누어떨어지는지 확인
  const m = stem.match(/(\d+)\s*÷\s*(\d+)/);
  if (!m) return "SKIP";
  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  if (b === 0) return "FAIL";
  // 나머지를 묻는 문항이면 OK
  if (stem.includes("나머지")) return "OK";
  // 몫만 묻는 문항인데 나누어떨어지지 않으면 FAIL
  if (a % b !== 0) return "FAIL";
  return "OK";
}

// ── 결과 출력 ─────────────────────────────────────────────

interface TestCase {
  label: string;
  input: GenerateInput;
}

const FAKE_UNIT_ID = "verify-script";

const cases: TestCase[] = [
  {
    label: "곱셈/중",
    input: { unitId: FAKE_UNIT_ID, unitName: "곱셈 (두 자리 수 × 한 자리 수)", term: 1, count: 5, difficulty: "MEDIUM", type: "MULTIPLE_CHOICE" },
  },
  {
    label: "나눗셈/상",
    input: { unitId: FAKE_UNIT_ID, unitName: "나눗셈", term: 1, count: 5, difficulty: "HARD", type: "MULTIPLE_CHOICE" },
  },
  {
    label: "분수/중",
    input: { unitId: FAKE_UNIT_ID, unitName: "분수", term: 2, count: 5, difficulty: "MEDIUM", type: "MULTIPLE_CHOICE" },
  },
  {
    label: "들이무게/중",
    input: { unitId: FAKE_UNIT_ID, unitName: "들이와 무게", term: 2, count: 5, difficulty: "MEDIUM", type: "MULTIPLE_CHOICE" },
  },
];

async function runCase(tc: TestCase): Promise<void> {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`▶ ${tc.label} — ${tc.input.count}문항 생성 중...`);
  console.log("=".repeat(70));

  const start = Date.now();
  let questions: GeneratedQuestion[] = [];
  let genError: string | null = null;
  try {
    questions = await generateQuestions(tc.input);
  } catch (e) {
    genError = e instanceof Error ? e.message : String(e);
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  if (genError) {
    console.log(`  ❌ 생성 실패: ${genError}`);
    return;
  }

  console.log(`  생성 완료: ${questions.length}/${tc.input.count}문항  (${elapsed}s)\n`);

  let defects = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const validErr = validateQuestion(q);
    const correct = q.choices.find((c) => c.isCorrect)?.text ?? "";
    const divCheck = checkDivisibility(q.stem);
    const calcCheck = extractAndVerify(q.stem, correct);
    const status = validErr ? "FAIL(schema)" : divCheck === "FAIL" ? "FAIL(나눗셈)" : calcCheck === "FAIL" ? "FAIL(계산)" : "OK";

    if (status !== "OK") defects++;

    const icon = status === "OK" ? "✅" : "❌";
    console.log(`  Q${i + 1} ${icon} [${status}]`);
    console.log(`     stem: ${q.stem.slice(0, 80)}${q.stem.length > 80 ? "…" : ""}`);
    console.log(`     정답: ${correct}`);
    console.log(`     보기: ${q.choices.map((c) => c.text).join(" / ")}`);
    if (status !== "OK") {
      if (validErr) console.log(`     오류: ${validErr}`);
      if (divCheck === "FAIL") console.log(`     오류: 나눗셈이 나누어 떨어지지 않음`);
      if (calcCheck === "FAIL") console.log(`     오류: 계산 검산 불일치`);
    }
    console.log(`     해설: ${q.explanation.slice(0, 100)}${q.explanation.length > 100 ? "…" : ""}`);
  }

  console.log(`\n  결과: ${questions.length - defects}/${questions.length} 통과 / ${defects}개 결함`);
}

async function main() {
  console.log("\n단평GO — 문항 생성 품질 검증");
  console.log(`실행 시각: ${new Date().toLocaleString("ko-KR")}\n`);

  for (const tc of cases) {
    await runCase(tc);
  }

  console.log(`\n${"=".repeat(70)}\n검증 완료\n`);
}

main().catch((e) => {
  console.error("검증 실패:", e);
  process.exit(1);
});
