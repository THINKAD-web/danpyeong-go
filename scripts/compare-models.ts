/**
 * Claude vs Grok 문항 생성 품질 비교 스크립트 (TASK 0)
 * 실행: npx tsx scripts/compare-models.ts
 *
 * 동일 조건(곱셈/중, 나눗셈/상, 분수/중, 들이무게/중) × 5문항씩
 * Claude(claude-sonnet-4-6) 와 Grok(grok-3) 비교.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

// 키 확인 (값 출력 금지)
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const XAI_KEY = process.env.XAI_API_KEY;
if (!ANTHROPIC_KEY) { console.error("❌ ANTHROPIC_API_KEY 없음"); process.exit(1); }
if (!XAI_KEY)       { console.error("❌ XAI_API_KEY 없음"); process.exit(1); }
console.log(`✅ ANTHROPIC_API_KEY (len=${ANTHROPIC_KEY.length})  XAI_API_KEY (len=${XAI_KEY.length})\n`);

import { generateQuestions } from "../src/lib/ai";
import { generateQuestionsGrok, GROK_MODEL } from "../src/lib/ai-grok";
import { validateQuestion } from "../src/lib/ai-shared";
import type { GenerateInput, GeneratedQuestion } from "../src/lib/ai-shared";

// ── 검산 로직 ─────────────────────────────────────────────

function checkDivisibility(stem: string): "OK" | "FAIL" | "SKIP" {
  const m = stem.match(/(\d+)\s*÷\s*(\d+)/);
  if (!m) return "SKIP";
  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  if (b === 0) return "FAIL";
  if (stem.includes("나머지")) return "OK";
  if (a % b !== 0) return "FAIL";
  return "OK";
}

function extractAndVerify(stem: string, correctValue: string): "OK" | "FAIL" | "SKIP" {
  const fill = stem.match(/(\d+)\s*[×x\*]\s*(\d+)\s*=\s*[□?_]/) ||
               stem.match(/(\d+)\s*[×x\*]\s*[□?_]\s*=\s*(\d+)/);
  const divFill = stem.match(/(\d+)\s*÷\s*(\d+)\s*=\s*[□?_]/) ||
                  stem.match(/[□?_]\s*÷\s*(\d+)\s*=\s*(\d+)/);
  const addFill = stem.match(/(\d+)\s*\+\s*(\d+)\s*=\s*[□?_]/);
  const subFill = stem.match(/(\d+)\s*-\s*(\d+)\s*=\s*[□?_]/);

  const cv = correctValue.replace(/[^0-9]/g, "");
  const num = parseInt(cv, 10);
  if (isNaN(num)) return "SKIP";

  if (divFill) {
    const a = parseInt(divFill[1], 10);
    const b = parseInt(divFill[2], 10);
    if (b === 0) return "FAIL";
    if (a % b !== 0) return "FAIL";
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

function countDefects(questions: GeneratedQuestion[]): number {
  let defects = 0;
  for (const q of questions) {
    const validErr = validateQuestion(q);
    const correct = q.choices.find((c) => c.isCorrect)?.text ?? "";
    const divCheck = checkDivisibility(q.stem);
    const calcCheck = extractAndVerify(q.stem, correct);
    if (validErr || divCheck === "FAIL" || calcCheck === "FAIL") defects++;
  }
  return defects;
}

// ── 케이스 정의 ───────────────────────────────────────────

const FAKE_UNIT_ID = "compare-script";

interface TestCase { label: string; input: GenerateInput; }

const cases: TestCase[] = [
  { label: "곱셈/중",    input: { unitId: FAKE_UNIT_ID, unitName: "곱셈 (두 자리 수 × 한 자리 수)", grade: 3, term: 1, count: 5, difficulty: "MEDIUM", type: "MULTIPLE_CHOICE" } },
  { label: "나눗셈/상",  input: { unitId: FAKE_UNIT_ID, unitName: "나눗셈", grade: 3, term: 1, count: 5, difficulty: "HARD",   type: "MULTIPLE_CHOICE" } },
  { label: "분수/중",    input: { unitId: FAKE_UNIT_ID, unitName: "분수",   grade: 3, term: 2, count: 5, difficulty: "MEDIUM", type: "MULTIPLE_CHOICE" } },
  { label: "들이무게/중", input: { unitId: FAKE_UNIT_ID, unitName: "들이와 무게", grade: 3, term: 2, count: 5, difficulty: "MEDIUM", type: "MULTIPLE_CHOICE" } },
];

// ── 실행 ──────────────────────────────────────────────────

interface RunResult {
  generated: number;
  defects: number;
  elapsedSec: number;
  error?: string;
  questions: GeneratedQuestion[];
}

async function runOne(
  label: string,
  fn: () => Promise<GeneratedQuestion[]>
): Promise<RunResult> {
  const start = Date.now();
  try {
    const questions = await fn();
    const elapsedSec = (Date.now() - start) / 1000;
    const defects = countDefects(questions);
    return { generated: questions.length, defects, elapsedSec, questions };
  } catch (e) {
    return { generated: 0, defects: 0, elapsedSec: (Date.now() - start) / 1000, error: e instanceof Error ? e.message : String(e), questions: [] };
  }
}

async function main() {
  console.log("단평GO — Claude vs Grok 문항 생성 품질 비교 (TASK 0)");
  console.log(`Claude 모델: claude-sonnet-4-6  |  Grok 모델: ${GROK_MODEL}`);
  console.log(`실행 시각: ${new Date().toLocaleString("ko-KR")}\n`);

  const summaryRows: string[] = [];

  for (const tc of cases) {
    console.log(`${"─".repeat(70)}`);
    console.log(`▶ ${tc.label} (각 ${tc.input.count}문항)`);
    console.log(`${"─".repeat(70)}`);

    console.log("  [Claude] 생성 중...");
    const cr = await runOne(tc.label, () => generateQuestions(tc.input));

    console.log("  [Grok]   생성 중...");
    const gr = await runOne(tc.label, () => generateQuestionsGrok(tc.input));

    // Claude 상세
    if (cr.error) {
      console.log(`  Claude ❌ 실패: ${cr.error}`);
    } else {
      const pass = cr.generated - cr.defects;
      console.log(`  Claude ✅ ${pass}/${cr.generated} 통과 / ${cr.defects}개 결함 / ${cr.elapsedSec.toFixed(1)}s`);
      for (let i = 0; i < cr.questions.length; i++) {
        const q = cr.questions[i];
        const correct = q.choices.find((c) => c.isCorrect)?.text ?? "";
        const d = checkDivisibility(q.stem);
        const c = extractAndVerify(q.stem, correct);
        const ok = !validateQuestion(q) && d !== "FAIL" && c !== "FAIL";
        console.log(`    Q${i+1} ${ok ? "✅" : "❌"}  ${q.stem.slice(0, 60)}…  →  ${correct}`);
      }
    }

    console.log();

    // Grok 상세
    if (gr.error) {
      console.log(`  Grok  ❌ 실패: ${gr.error}`);
    } else {
      const pass = gr.generated - gr.defects;
      console.log(`  Grok  ✅ ${pass}/${gr.generated} 통과 / ${gr.defects}개 결함 / ${gr.elapsedSec.toFixed(1)}s`);
      for (let i = 0; i < gr.questions.length; i++) {
        const q = gr.questions[i];
        const correct = q.choices.find((c) => c.isCorrect)?.text ?? "";
        const d = checkDivisibility(q.stem);
        const c = extractAndVerify(q.stem, correct);
        const ok = !validateQuestion(q) && d !== "FAIL" && c !== "FAIL";
        console.log(`    Q${i+1} ${ok ? "✅" : "❌"}  ${q.stem.slice(0, 60)}…  →  ${correct}`);
      }
    }

    summaryRows.push(
      `| ${tc.label.padEnd(10)} | ${cr.error ? "실패" : `${cr.generated - cr.defects}/${cr.generated} (${cr.defects}결함)`} | ${cr.error ? "-" : cr.elapsedSec.toFixed(1)+"s"} | ${gr.error ? "실패" : `${gr.generated - gr.defects}/${gr.generated} (${gr.defects}결함)`} | ${gr.error ? "-" : gr.elapsedSec.toFixed(1)+"s"} |`
    );

    console.log();
  }

  console.log(`${"=".repeat(70)}`);
  console.log("## 요약 비교표\n");
  console.log("| 조건       | Claude 통과율 (결함) | Claude 시간 | Grok 통과율 (결함) | Grok 시간 |");
  console.log("|------------|---------------------|-------------|-------------------|-----------|");
  for (const row of summaryRows) console.log(row);
  console.log();
}

main().catch((e) => { console.error("비교 실패:", e); process.exit(1); });
