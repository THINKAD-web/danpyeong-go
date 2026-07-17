# 단평GO (단원평가 GO)

> 초등 단원평가, AI로 5분 컷! — 초등 교사용 경량 AI 평가 SaaS
> **현재 상태: 동작하는 스캐폴드 (mock 데이터 + mock AI + mock 인증)**

2022 개정 교육과정에 맞춰 초등 교사가 단원평가를 AI로 빠르게 생성 → 배포 → 자동 채점 → 분석하는 도구. 시드 데이터: **3·4학년 수학**.

---

## 지금 들어있는 것 (스캐폴드)

- ✅ Next.js 15 (App Router) + TypeScript + Tailwind
- ✅ Prisma 스키마 (교사/단원/문항/테스트/응시 전체 모델)
- ✅ 랜딩 페이지
- ✅ 교사 대시보드 (테스트 목록 + 통계, **mock 데이터**)
- ✅ **AI 문항 생성 화면 + mock API 라우트 연결** (`/api/ai/generate`)
- ✅ 학생 응시 진입 (코드 + 이름, 로그인 없음)
- ✅ mock 인증 (`src/lib/auth.ts`)

> mock = 실제 DB/AI/인증 키 없이 화면 흐름이 도는 가짜 구현.

---

## 로컬 실행

```bash
npm install
npm run dev
# http://localhost:3000
```

DB 없이도 모든 화면이 뜹니다 (mock 데이터 사용). Prisma 클라이언트만 생성하면 됩니다:

```bash
npm run db:generate
```

### 교육과정 시드 (학년·과목·단원)

`prisma/seed.ts`가 Subject/Unit을 **upsert**로 넣습니다.  
`Subject`는 `@@unique([name, grade])`, `Unit`은 `@@unique([subjectId, term, order])`라서 **학년별로 행이 분리**됩니다. 4학년을 추가해도 기존 3학년 데이터를 덮어쓰지 않습니다.

```bash
# 로컬/스테이징 DB에 시드 반영
npx prisma db seed
# 또는
npm run db:seed
```

**새 학년·과목 추가 절차**
1. `prisma/seed.ts`에 단원 배열(`GRADE*_UNITS`)과 `seedSubjectUnits("수학", N, ...)` 호출을 추가
2. `npx prisma db seed` 실행 (프로덕션은 별도 승인 후 동일 명령)
3. 앱의 `/api/subjects`·학년 선택 UI가 있으면 드롭다운에 자동 반영

> 프로덕션 seed는 파괴적 마이그레이션이 아니며 upsert만 수행합니다. 그래도 운영 DB 실행 전 백업·승인 권장.

---

## Claude Code 인수인계 — 해야 할 일

함께 둔 문서를 컨텍스트로 넣고 진행하세요:
`기획.md` · `CLAUDE_CODE_작업지시서.md` · `AI_문항생성_프롬프트.md`

### 핵심 교체 지점 (mock → 실제)

| 파일 | 지금 (mock) | 바꿀 것 |
|------|-------------|---------|
| `src/lib/ai.ts` → `generateQuestions()` | 가짜 곱셈 문항 생성 | TASK 0에서 정한 모델(Grok/Claude) 실제 호출 |
| `src/lib/auth.ts` → `currentTeacher()` | 고정 데모 교사 | Clerk `auth()` + DB User 매핑, `middleware.ts` 보호 |
| `src/lib/mock-data.ts` | 하드코딩 단원/테스트 | `prisma` 조회로 교체 |
| `prisma/seed.ts` | 단원만 시드 | 실제 교과서 기준 단원·성취기준 확정 |

### 권장 순서
1. **TASK 0** — Grok vs Claude 문항 생성 비교 → 모델 확정 (`docs/AI_MODEL_DECISION.md`)
2. Neon 연결 + `npm run db:migrate` + `npm run db:seed`
3. `generateQuestions()` 실제 모델 연결
4. Clerk 인증 교체
5. 화면들 mock → DB 조회 전환
6. Phase 2(학생 플레이어·채점), Phase 3(분석·리포트·PWA)

### 가드레일
- main 직접 push 금지 → PR → Vercel Preview 확인 후 머지
- `Question`은 영구 저장(문제은행), `Test`는 참조만
- 학생은 로그인 없음 (코드+이름 익명 `Attempt`)
- AI 생성 문항은 `isReviewed:false`, 교사 검수 책임 UX 유지

---

## 스택
Next.js 15 · TypeScript · Tailwind (+shadcn/ui 추가 예정) · Prisma · Neon Postgres · Clerk · Grok/Claude · React Query+Zod · Framer Motion · Recharts · Vercel
