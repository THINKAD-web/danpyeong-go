"use client";

import { useState } from "react";
import { validateQuestion, type GeneratedQuestion } from "@/lib/question-helpers";

type Props = {
  initial: GeneratedQuestion;
  isNew?: boolean;
  onSave: (q: GeneratedQuestion) => void;
  onCancel: () => void;
};

const EMPTY_CHOICES = [
  { order: 1, text: "", isCorrect: true },
  { order: 2, text: "", isCorrect: false },
  { order: 3, text: "", isCorrect: false },
  { order: 4, text: "", isCorrect: false },
];

export function QuestionEditor({ initial, isNew = false, onSave, onCancel }: Props) {
  const [qType, setQType] = useState(initial.type);
  const [difficulty, setDifficulty] = useState(initial.difficulty);
  const [stem, setStem] = useState(initial.stem);
  const [choices, setChoices] = useState(
    initial.choices.length === 4 ? initial.choices : EMPTY_CHOICES
  );
  const [keywords, setKeywords] = useState<string[]>(
    initial.answerKeywords.length > 0 ? initial.answerKeywords : [""]
  );
  const [explanation, setExplanation] = useState(initial.explanation);
  const [validError, setValidError] = useState<string | null>(null);

  function setChoiceText(idx: number, text: string) {
    setChoices((cs) => cs.map((c, i) => (i === idx ? { ...c, text } : c)));
  }

  function setCorrectChoice(idx: number) {
    setChoices((cs) => cs.map((c, i) => ({ ...c, isCorrect: i === idx })));
  }

  function handleSave() {
    const q: GeneratedQuestion = {
      type: qType,
      difficulty,
      stem: stem.trim(),
      choices: qType === "MULTIPLE_CHOICE" ? choices : [],
      answerKeywords:
        qType === "SHORT_ANSWER" ? keywords.map((k) => k.trim()).filter(Boolean) : [],
      explanation: explanation.trim(),
      source: initial.source,
    };
    const err = validateQuestion(q);
    if (err) { setValidError(err); return; }
    setValidError(null);
    onSave(q);
  }

  return (
    <div className="space-y-4">
      {isNew && (
        <div className="flex gap-2">
          {(["MULTIPLE_CHOICE", "SHORT_ANSWER"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setQType(t); setValidError(null); }}
              className={`rounded-xl border-2 px-4 py-1.5 text-sm font-bold transition ${
                qType === t ? "border-brand bg-brand text-white" : "border-ink/20 hover:border-brand"
              }`}
            >
              {t === "MULTIPLE_CHOICE" ? "객관식" : "단답형"}
            </button>
          ))}
        </div>
      )}

      <label className="block">
        <span className="text-xs font-bold text-ink/60">난이도</span>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
          className="mt-1 w-full rounded-xl border-2 border-ink/30 bg-white px-3 py-2 text-sm font-semibold focus:border-brand focus:outline-none"
        >
          <option value="EASY">하</option>
          <option value="MEDIUM">중</option>
          <option value="HARD">상</option>
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-bold text-ink/60">문제 본문</span>
        <textarea
          value={stem}
          onChange={(e) => setStem(e.target.value)}
          rows={3}
          placeholder="문제를 입력하세요"
          className="mt-1 w-full resize-none rounded-xl border-2 border-ink/30 px-3 py-2 text-sm font-semibold focus:border-brand focus:outline-none"
        />
      </label>

      {qType === "MULTIPLE_CHOICE" && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-ink/60">보기 (동그라미 클릭 = 정답)</span>
          {choices.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCorrectChoice(i)}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                  c.isCorrect ? "border-mint bg-mint text-white" : "border-ink/30 hover:border-mint"
                }`}
                aria-label={`${i + 1}번 정답으로 선택`}
              >
                {c.isCorrect ? "✓" : ""}
              </button>
              <span className="w-5 shrink-0 text-sm font-bold text-ink/50">
                {["①", "②", "③", "④"][i]}
              </span>
              <input
                type="text"
                value={c.text}
                onChange={(e) => setChoiceText(i, e.target.value)}
                placeholder={`보기 ${i + 1}`}
                className={`flex-1 rounded-xl border-2 px-3 py-1.5 text-sm font-semibold focus:outline-none ${
                  c.isCorrect ? "border-mint bg-mint/10 focus:border-mint" : "border-ink/30 focus:border-brand"
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {qType === "SHORT_ANSWER" && (
        <div>
          <span className="text-xs font-bold text-ink/60">정답 키워드</span>
          <div className="mt-1 space-y-2">
            {keywords.map((kw, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={kw}
                  onChange={(e) => {
                    const next = [...keywords];
                    next[i] = e.target.value;
                    setKeywords(next);
                  }}
                  placeholder="정답 또는 동의어"
                  className="flex-1 rounded-xl border-2 border-ink/30 px-3 py-1.5 text-sm font-semibold focus:border-brand focus:outline-none"
                />
                {keywords.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setKeywords((ks) => ks.filter((_, j) => j !== i))}
                    className="rounded-xl border-2 border-ink/20 px-2 text-sm text-ink/40 transition hover:border-coral hover:text-coral"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setKeywords((ks) => [...ks, ""])}
              className="text-xs font-bold text-brand hover:underline"
            >
              + 키워드 추가
            </button>
          </div>
        </div>
      )}

      <label className="block">
        <span className="text-xs font-bold text-ink/60">해설 (선택)</span>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          placeholder="풀이 과정이나 해설을 입력하세요"
          className="mt-1 w-full resize-none rounded-xl border-2 border-ink/30 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
      </label>

      {validError && <p className="text-sm font-bold text-coral">{validError}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border-2 border-ink/30 py-2 text-sm font-bold transition hover:border-ink"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 card bg-brand py-2 text-sm font-bold text-white transition hover:-translate-y-0.5"
        >
          {isNew ? "문항 추가" : "수정 완료"}
        </button>
      </div>
    </div>
  );
}
