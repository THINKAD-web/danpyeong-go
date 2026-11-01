# 단평GO 정식 오픈 전수조사 리포트 (LAUNCH AUDIT)

> 조사일: 2026-11-01 · 대상: `main` @ 배포 https://danpyeong-go.vercel.app  
> 기준 문서: `기획.md` · `CLAUDE_CODE_작업지시서.md` · `AI_문항생성_프롬프트.md` · `README.md` TASK · `docs/AI_MODEL_DECISION.md` · `docs/ROADMAP_2026-27.md` · `docs/PHASE2-5_지시서.md` · `docs/FEEDBACK.md` · `docs/KNOWN_ISSUES.md`  
> 범위: 레포 전수조사. **코드 변경 없음**(본 문서 추가만).

---

## 0. 한 줄 결론

**교사 B2B 코어(로그인 → AI 생성 → 배포 → 응시 → 채점 → 분석/리포트)는 이미 실구현·프로덕션 동작 중**이다. README가 말하는 “mock 스캐폴드”는 **문서 잔재**다.  
정식 오픈 전에 막아야 할 것은 mock 교체가 아니라 **(1) 학생 응시 API 무결성·세션 보호, (2) 성취기준 시드·프롬프트 주입, (3) 교사 검수(`isReviewed`) UX/배포 게이트, (4) 문서·랜딩 정직성, (5) 운영 모니터링·데모 시드**다.

작업량 표기: **S** ≈ 반나절 이하 · **M** ≈ 1~2인일 · **L** ≈ 수인일급 설계·구현 · **XL** = 제품/법적/콘텐츠 대규모.

---

## 1. 현황 스냅샷 (문서 vs 코드)

| 영역 | README/구문서 주장 | 실제 (`main`) | 근거 |
|------|-------------------|---------------|------|
| AI 생성 | mock | **Claude `claude-sonnet-4-6` 실호출** + Pass1/Pass2 | `src/lib/ai.ts`, `docs/AI_MODEL_DECISION.md` |
| 인증 | mock | **Clerk 실연동**, `IS_MOCK_AUTH=false` | `src/lib/auth.ts`, `src/middleware.ts` |
| 데이터 | mock-data | **Prisma/Neon**, 페이지는 prisma 조회 | `src/lib/prisma.ts`, teacher/play/admin pages |
| `mock-data.ts` | 교체 대상 | **고아 파일**(import 0) | `src/lib/mock-data.ts` |
| 시드 | 단원만 | 3·4학년 수학 단원+constraints. **성취기준 비어 있음** | `prisma/seed.ts`, `src/lib/curriculum.ts` |
| Phase 2 응시·채점 | 미착수 | **구현됨**(autosave·오답노트는 얇음) | `src/app/play/*`, `src/lib/grading.ts` |
| Phase 3 분석·리포트 | 미착수 | **PDF/Excel·Recharts 구현**. 문제은행 재사용 UI 없음 | `results/*`, `DownloadButtons.tsx` |
| PWA | next-pwa | **커스텀 SW + manifest** (`next-pwa` 미설치) | `public/sw.js`, `PwaRegister.tsx` |
| 결제 | MVP 제외 | **미구현**(Phase 2-A/B 예정) | `docs/PHASE2-5_지시서.md` |
| 프로덕션 | — | READY · main `#50` Phase1. 랜딩 집계: 교사 2 / 응시 7 / 평가 9 | Vercel deployments, 라이브 `/` |

로컬 검증(조사일): `npx tsc --noEmit` 통과 · `npm run lint` 통과 · `npm run build` 성공.  
참고: DB URL 없는 환경에서 `/` SSG 중 Prisma `DATABASE_URL` 경고가 찍히나 라우트 생성은 완료됨. Vercel은 `vercel.json`에서 `prisma migrate deploy` 후 빌드.

---

## 2. (1) Mock 잔존 · 실구현까지 남은 작업

### LA-1.1 README / `.env.example` “mock 스캐폴드” 문구  
| | |
|--|--|
| **우선순위** | 오픈 필수 |
| **근거** | `README.md` L3–18, L45–60 · `.env.example` L6–7 |
| **작업량** | S |
| **권장** | 현재 상태를 “Clerk + Neon + Claude 실연동 베타”로 갱신. TASK를 “남은 오픈 체크리스트”로 교체. mock 표 삭제 또는 `docs/LAUNCH_AUDIT.md`로 링크. |

### LA-1.2 `src/lib/mock-data.ts` 고아 코드  
| | |
|--|--|
| **우선순위** | 오픈 직후 |
| **근거** | `src/lib/mock-data.ts` — src/scripts import 0 |
| **작업량** | S |
| **권장** | 삭제 또는 `docs/archive/`로 이동. 신규 기여자가 mock으로 오인하지 않게. |

### LA-1.3 시드: `achievementStandard` 미입력  
| | |
|--|--|
| **우선순위** | 오픈 필수 |
| **근거** | `prisma/seed.ts`(name/constraints만) · `Unit.achievementStandard` 스키마 · `AI_문항생성_프롬프트.md` §1·§3 · `docs/AI_MODEL_DECISION.md` §7 |
| **작업량** | M |
| **권장** | 2022 개정 3학년(및 오픈 범위면 4학년) 성취기준 코드·문구를 `curriculum.ts`/`seed.ts`에 채우고 upsert. 어드민 수동 입력만으로는 스케일 불가. |

### LA-1.4 AI 프롬프트에 성취기준 미주입  
| | |
|--|--|
| **우선순위** | 오픈 필수 |
| **근거** | `src/app/api/ai/generate/route.ts` select `{ name, constraints }`만 · `src/lib/ai-shared.ts` `buildUserPrompt` 고정 문구 `"해당 단원의 핵심 계산 및 개념 이해"` |
| **작업량** | S–M |
| **권장** | unit 조회에 `achievementStandard` 포함 → `buildUserPrompt` 슬롯 주입. 랜딩 카피(“성취기준에 맞춰”)와 코드 정합. |

### LA-1.5 데모 샘플(`DemoSampleQuestion`) 시드 비포함  
| | |
|--|--|
| **우선순위** | 오픈 필수(운영) |
| **근거** | `prisma/seed.ts` 미포함 · `scripts/generate-demo-samples.ts` · `/api/demo/generate` |
| **작업량** | S |
| **권장** | 프로덕션에서 `npm run demo:generate-samples` 실행·검증(`verify:demo-samples`). 샘플 없으면 `/demo` “준비 중” 실패. |

### LA-1.6 Grok 어댑터 미연결  
| | |
|--|--|
| **우선순위** | 나중에 |
| **근거** | `src/lib/ai-grok.ts` · API는 Claude만 · TASK 0 완료 |
| **작업량** | S(유지) / M(폴백 분기) |
| **권장** | 기본 모델 Claude 유지. 폴백 필요 시에만 provider 분기. |

### LA-1.7 Clerk 웹훅 = 삭제만 / User lazy upsert  
| | |
|--|--|
| **우선순위** | 오픈 직후 |
| **근거** | `src/lib/clerk-webhook.ts` · `user.deleted` only · generate/tests에서 upsert |
| **작업량** | S–M |
| **권장** | 프로덕션 웹훅 URL·시크릿 점검(`verify:clerk-webhook`). created/updated는 선택. |

### LA-1.8 `currentTeacher()` role 하드코딩  
| | |
|--|--|
| **우선순위** | 오픈 직후 |
| **근거** | `src/lib/auth.ts` L34 `role: "TEACHER"` 고정 · ADMIN은 `currentAdmin()`만 DB 확인 |
| **작업량** | S |
| **권장** | DB role 조회해 세션에 반영. ADMIN 승격 운영 절차 문서화. |

### LA-1.9 Classroom 모델만 존재  
| | |
|--|--|
| **우선순위** | 나중에 (MVP 대체 완료) |
| **근거** | `prisma/schema.prisma` `Classroom` · UI/API 없음 · 실제 배포는 `Test.shortCode`/`shareToken` |
| **작업량** | L |
| **권장** | CLAUDE 1-4 “클래스 코드”는 shortCode로 충족. 학급 관리는 Phase 후속. 스키마 주석을 제품 현실에 맞게 수정. |

---

## 3. (2) 기획·TASK 대비 미구현 기능

### 매트릭스 (CLAUDE Phase 1–3 = MVP 기준)

| 기능 | 상태 | 우선순위 | 근거 | 작업량 | 권장 |
|------|------|----------|------|--------|------|
| AI 생성·DB 저장 | 완료 | — | `api/ai/generate`, `lib/ai.ts` | — | — |
| 문항 편집 | 부분 | **오픈 필수** | `QuestionEditor.tsx` — **`isReviewed` 토글/API 없음**. AI는 항상 `false` | M | 검수 완료 토글 + 미검수 배포 차단 또는 강한 경고 |
| 테스트 배포·shortCode | 완료 | — | `api/tests/[testId]`, `short-code.ts` | — | FEEDBACK #3 반영됨 |
| 시간제한·셔플 UI | 부분 | 오픈 직후 | 스키마·플레이어 지원, 생성 UI 없음 | S–M | new-test 폼에 `timeLimitMin`/`shuffle` |
| 교사 대시보드 | 완료 | — | `teacher/page.tsx` | — | — |
| 학생 코드+이름 응시 | 완료 | — | `play/page.tsx`, `api/play/start` | — | NUMBER 모드 포함 |
| 플레이어(타이머·진행) | 부분 | **오픈 필수~직후** | 타이머 0 자동제출 없음 · **답안 중간 저장 API 없음** | M | Answer autosave + 타임업 자동제출 |
| 자동채점 MC/단답 | 완료 | — | `grading.ts`, submit route | — | — |
| 즉시 결과 | 완료 | — | play 결과 화면 | — | — |
| 오답노트 | 얇음 | 오픈 직후 | 오답만 표시, 정답·해설·저장 뷰 없음 | M | 제출 후 해설/정답 노출(교사 설정 옵션) |
| 반 평균·학생표·문항 차트 | 완료 | — | `ResultsClient.tsx`, Recharts | — | — |
| 취약 **단원** 하이라이트 | 부분 | 나중에 | 취약 **문항**만 | M | 다시험 단원 집계는 후속 |
| PDF/Excel | 완료 | — | report API, xlsx, react-pdf | — | — |
| 문제은행 재사용 UI | **없음** | 오픈 직후~나중에 | Phase 3-3 · 생성 시 이중 저장 가능 | L | 단원·난이도 필터로 기존 문항 담기 |
| PWA | 부분 | 오픈 직후 | manifest+SW, next-pwa 아님, 오프라인 제한 | M | 오픈엔 설치·/play 셸면 충분. next-pwa는 선택 |
| 어드민 문제은행 CRUD | 부분 | 오픈 직후 | units/ops만 · 문항 검수 큐 없음 | L | 검수 큐부터 |
| 학생 자습형 B2C (`기획.md`) | **없음** | 나중에 | MVP 제외·ROADMAP도 B2B 우선 | XL | 정식 오픈 범위에서 제외 명시 |
| 서술형 | 없음 | 나중에 | MVP 제외 · 스키마에도 없음 | L | — |
| 결제/요금제 | 없음 | 나중에(로드맵) | PHASE2-5 · 베타 무료 카피 | L–XL | 무료 베타 오픈 가능. 유료는 2-A/2-B |
| 도형 SVG (FEEDBACK #1) | 없음 | 오픈 직후(도형 단원) | `docs/FEEDBACK.md` | L | 단기: “그림 없이 풀 수 있는 문항만” 제약 강화 |
| VERY_HARD (FEEDBACK #2) | 없음 | 나중에 | FEEDBACK #2 | S–M | — |

### 기획.md vs 제품 포지션
`기획.md`는 NextAuth·학생 User·Enrollment·B2C 자습·서술형·6학년 시작을 가정한다. **현 제품은 CLAUDE 지시서 기준 교사 출제형 + 익명 응시**다. 오픈 시 “하이브리드 풀스펙”가 아니라 **교사용 MVP(3~4학년 수학)**로 범위를 고정해 커뮤니케이션할 것.

---

## 4. (3) 보안 · 아동 개인정보

### LA-3.1 [블로커] Submit 채점이 `attempt.testId`로 스코프되지 않음  
| | |
|--|--|
| **우선순위** | **오픈 필수** |
| **근거** | `src/app/api/play/[attemptId]/submit/route.ts` L42–61 — `testQuestionId`만으로 조회, `maxScore`가 제출분 합 |
| **작업량** | S–M |
| **권장** | `where: { id: { in }, testId: attempt.testId }`. 누락 문항은 0점. `maxScore`는 해당 Test의 전체 배점. |

### LA-3.2 [블로커] Attempt URL = 비인증 베어러  
| | |
|--|--|
| **우선순위** | **오픈 필수** |
| **근거** | `api/play/[attemptId]` GET/submit 공개 · middleware `/api/play(.*)` public · `studentName` 노출 |
| **작업량** | M |
| **권장** | start 시 httpOnly `attemptSecret`(또는 서명 쿠키) 발급, GET/submit에 검증. cuid만으로 타인 응시 조회·재제출 차단. |

### LA-3.3 신분 위장·중복 응시  
| | |
|--|--|
| **우선순위** | 오픈 필수(교육 무결성) |
| **근거** | `api/play/start` — `(testId, studentName)` unique 없음 · 코드만 알면 임의 이름 |
| **작업량** | M |
| **권장** | 좌석당 진행중 1건, 제출 후 재응시 정책, 교사 이상치 표시. “성적 공적 기록” 전엔 한계를 UX/약관에 명시. |

### LA-3.4 shortCode 레이트리밋 vs 교실 NAT  
| | |
|--|--|
| **우선순위** | 오픈 직후 |
| **근거** | `play-rate-limit.ts` IP당 5/분 · `PHASE2-5` R1 · shareToken 경로는 제한 제외 |
| **작업량** | M |
| **권장** | 실패(추측)와 성공(응시 시작) 한도 분리 — R1 확정안. |

### LA-3.5 익명화 = CLOSED만 · PUBLISHED 이름 장기 보관  
| | |
|--|--|
| **우선순위** | 오픈 필수(운영+법무 정합) |
| **근거** | `anonymization.ts` · `vercel.json` cron 2/28·8/31 · `privacy/page.tsx` |
| **작업량** | M |
| **권장** | 학기말 미마감 자동 CLOSE 또는 PUBLISHED도 익명화. 답안 원문 보존 정책을 방침과 일치. |

### LA-3.6 만 14세 미만 · 동의·삭제  
| | |
|--|--|
| **우선순위** | 오픈 필수(문서·운영) / 코드는 직후 |
| **근거** | `privacy/page.tsx` §6 · 보호자 이메일 삭제 · 코드상 동의 수집 없음 · NUMBER 모드 권장(`ROADMAP` 1-4) |
| **작업량** | S(문서/온보딩) ~ M(셀프서브 삭제) |
| **권장** | 오픈: 교사 안내 문구·NUMBER 기본 권장·삭제 SLA. COPPA식 검증 동의는 국내 사업 모델에 맞게 법무 검토. |

### LA-3.7 AI/교사 API 보호 (양호)  
Clerk `auth.protect`, 소유권 검사, AI 일일 한도·동시 잠금, 데모 샘플+IP 한도, cron `CRON_SECRET`, Clerk Svix — **양호**.  
개선: AI `todayStart()` UTC → KST (`ai-rate-limit.ts`, PHASE2 R9) — **오픈 직후**.

### LA-3.8 키 관리  
| | |
|--|--|
| **우선순위** | 오픈 필수(점검) |
| **근거** | `.env.example` · `.gitignore` · `NEXT_PUBLIC_*`는 Clerk publishable + SITE_URL만 |
| **작업량** | S |
| **권장** | Vercel Production: `DATABASE_URL`/`DIRECT_URL`/`CLERK_*`/`CLERK_WEBHOOK_SECRET`/`ANTHROPIC_API_KEY`/`CRON_SECRET`/`SLACK_WEBHOOK_URL`/`NEXT_PUBLIC_SITE_URL` 존재·회전 확인. 레포에 실키 없음(양호). |

### LA-3.9 기타  
submit `textAnswer` 길이 제한 없음(DoS) — 직후. 보안 헤더 미설정(`next.config.ts`) — 직후. CSRF 토큰 없음(Clerk SameSite로 대부분 완화) — 나중에.

---

## 5. (4) 성능 · SEO · 접근성 · 모바일

| ID | 항목 | 우선순위 | 근거 | 작업량 | 권장 |
|----|------|----------|------|--------|------|
| LA-4.1 | OG/Twitter 메타·이미지 없음 | 오픈 필수 | `layout.tsx` metadata에 openGraph 없음 | S | `openGraph`/`twitter` + 1200×630 |
| LA-4.2 | `robots.ts` / `sitemap.ts` 없음 | 오픈 필수 | `src/app/` | S | `/`, `/demo`, `/privacy`, (추후 `/pricing`) |
| LA-4.3 | 랜딩 카피 vs 구현 불일치 | 오픈 필수 | 라이브 `/` “성취기준에 맞춰” · “교사가 최종 검수” | S | 주입·검수 구현 후 유지, 또는 카피 완화 |
| LA-4.4 | 후기 비어 있음 | 오픈 직후 | `ROADMAP` · `TESTIMONIALS=[]` · 이용 숫자만 표시 | S(운영) | 동의 받은 후기 또는 섹션 숨김 유지 |
| LA-4.5 | 플레이어 a11y | 오픈 직후 | MCQ 버튼에 radiogroup/`aria-checked` 부족 · progressbar 역할 부족 | M | 터치 UX 유지하며 ARIA 보강 · 포커스 링 유지 |
| LA-4.6 | 모바일 응시 UX | 양호 | `100dvh`, safe-area, 큰 터치 | — | 실기기(아이패드·안드) 스모크 |
| LA-4.7 | 폰트 | 양호 | Gaegu + Noto Sans KR, `display:swap` | — | — |
| LA-4.8 | PWA 설치 | 부분 | manifest `start_url:/play` · SW network-first | 오픈 직후 | 교실 홈화면 추가 안내. 오프라인 응시는 약속하지 말 것 |
| LA-4.9 | results 번들 ~112kB | 나중에 | build 출력 | M | Recharts/xlsx 동적 import |

---

## 6. (5) 빌드 · 의존성 · 타입 · Vercel

| ID | 항목 | 우선순위 | 근거 | 작업량 | 권장 |
|----|------|----------|------|--------|------|
| LA-5.1 | tsc/lint/build | 양호 | 조사일 통과 | — | CI에서 `tsc`+`lint`+`build` 고정 |
| LA-5.2 | 스택 drift | 오픈 직후(문서) | CLAUDE: shadcn/RQ/Framer/next-pwa — **미설치** | S(문서) | 지시서 “실제 스택” 정정 또는 의도적 도입 일정 |
| LA-5.3 | `vercel.json` migrate+cron | 양호 | buildCommand · 학기 익명화 cron | — | Hobby cron 제약·타임존 확인 |
| LA-5.4 | Prisma 7 업그레이드 안내 | 나중에 | generate 시 경고 | M | 오픈 후 계획적 업그레이드 |
| LA-5.5 | 전용 도메인 | 오픈 직후~유료 전 | `ROADMAP` 1-3 · 현재 `danpyeong-go.vercel.app` | M(운영) | **Clerk 도메인 먼저** → Vercel → `NEXT_PUBLIC_SITE_URL` → 308 |
| LA-5.6 | Vercel Hobby vs 상업 | 유료 전 필수 | PHASE2 R5 | 운영 | 결제 전 Pro 전환 |
| LA-5.7 | Production env 점검 | 오픈 필수 | §4.3.8 | S | 체크리스트 실행·웹훅·cron 스모크 |
| LA-5.8 | 데모/시드 프로덕션 반영 | 오픈 필수 | LA-1.3, LA-1.5 | S–M | migrate/seed/samples 런북 |

**의존성 관찰:** `@anthropic-ai/sdk`, `@clerk/nextjs`, `recharts`, `@react-pdf/renderer`, `xlsx`, `zod`, `svix` 사용 중. React Query·Framer·shadcn·next-pwa 없음.

---

## 7. (6) 교육과정 · 문항 품질 검증 구조

| ID | 항목 | 우선순위 | 근거 | 작업량 | 권장 |
|----|------|----------|------|--------|------|
| LA-6.1 | TASK 0 모델 확정 | 완료 | `docs/AI_MODEL_DECISION.md` Claude 확정 | — | — |
| LA-6.2 | Pass2 + unit constraints | 양호(MCQ) | `ai.ts`, `curriculum.ts`, KNOWN_ISSUES ISSUE-001 해결 | — | — |
| LA-6.3 | 성취기준 시드·주입 | **오픈 필수** | LA-1.3, LA-1.4 | M | 품질·카피 신뢰의 핵심 |
| LA-6.4 | 단답형 Pass2 없음 | 오픈 직후 | `ai.ts` L101–112 MCQ만 verify | M | SHORT_ANSWER 독립 검산 또는 키워드 검증 |
| LA-6.5 | `isReviewed` 미강제 | **오픈 필수** | generate `false` · PATCH publish 미검사 · Editor 토글 없음 · 프롬프트 §6 “배포 불가 권장” | M | 토글+게이트 또는 배포 전 체크리스트 UX |
| LA-6.6 | `validateQuestion` = 구조만 | 오픈 직후 | 수치 stem↔정답 미검증(Pass2가 보완) | M | 서버측 간단 산술 가드 확대 |
| LA-6.7 | 도형 “그림과 같이” | 오픈 직후 | FEEDBACK #1 · 평면도형/원/각도 constraints | M | 제약에 도형 묘사 필수·그림 의존 금지 |
| LA-6.8 | 검증 스크립트 스위트 | 양호 | `scripts/verify-*.ts`, `compare-models.ts`, `audit-mixed-number-grading.ts` | — | 릴리스 전 `verify:grading` 등 실행 |
| LA-6.9 | 이중 저장(생성+테스트저장) | 오픈 직후 | generate가 Question 저장 후 save가 또 생성 가능 | M | 저장 시 기존 ID 재사용 |
| LA-6.10 | 4학년 포함·5~6 미시드 | 범위 결정 | seed 3+4 · ROADMAP Phase4 | 운영 | 오픈 카피 “3~4학년”과 일치(라이브 이미 3~4) |

---

## 8. (7) 운영 · 비용 · 결제

| ID | 항목 | 우선순위 | 근거 | 작업량 | 권장 |
|----|------|----------|------|--------|------|
| LA-7.1 | 에러 모니터링 | **오픈 필수** | Sentry 등 없음 · `console.error`만 | M | Sentry/유사 + 알림. API 5xx·AI 실패 |
| LA-7.2 | AI 비용 가드 | 양호~직후 | 일일 30/500 · Slack 80% · `OpsAlertDay` · UTC 일자 버그(R9) | S | KST 경계 수정 · Slack 웹훅 확인 |
| LA-7.3 | 구조화 로깅 | 오픈 직후 | 라우트별 console | M | requestId · 교사/시험 id(아동 이름 로그 금지) |
| LA-7.4 | 결제/요금제 | 나중에(베타 무료 시) | PHASE2-5 · ROADMAP ⏳ · 스키마에 plan 없음 | L–XL | **무료 정식/베타 오픈은 결제 없이 가능**. 유료 전: 2-A UI+게이트 → 사업자·PG → 2-B 포트원 V2 → Vercel Pro |
| LA-7.5 | 랜딩 “정식 전환 후에도 기본 무료” | 유료 설계 시 필수 | ROADMAP R2와 충돌 가능 | S(카피) | 유료 전환 전 문구·정책 재합의 |
| LA-7.6 | 지원/피드백 | 오픈 직후 | `teacher/help` · FEEDBACK.md | S | 문의 채널·버그 제보 고정 |
| LA-7.7 | KNOWN_ISSUES 빈약 | 오픈 직후 | 해결 1건만 | S | 본 감사 오픈 이슈 이관 |
| LA-7.8 | 교사 삭제·웹훅 | 양호 | `teacher-deletion.ts`, clerk webhook | — | 프로덕션 삭제 스모크 |

---

## 9. 오픈 필수 항목 체크리스트 (실행용)

1. **Submit을 `attempt.testId`로 스코프** + maxScore=시험 전체 배점 (`api/play/.../submit`)
2. **응시 세션 바인딩**(attemptSecret/httpOnly) — URL만으로 타인 응시 조작 불가
3. **중복/위장 응시 가드**(정책+최소 구현) 및 성적 해석 한계 안내
4. **성취기준 시드 + AI 프롬프트 주입**
5. **`isReviewed` 토글 + 배포 게이트(또는 동등 UX)** + 랜딩 카피 정합
6. **익명화/마감 정책** — PUBLISHED 장기 이름 보관 해소 또는 방침 수정
7. **아동 개인정보 오픈 런북** — NUMBER 권장, 교사 사전 안내, 삭제 SLA
8. **Production env · Clerk 웹훅 · cron · Slack · 데모 샘플** 점검
9. **SEO 팩** — OG/twitter, robots, sitemap
10. **에러 모니터링** 도입
11. **README / `.env.example` mock 문구 제거** — 실제 상태 반영
12. **실사용 스모크** — 교사 생성→배포→태블릿 응시→채점→PDF/Excel

---

## 10. 오픈까지 단계별 로드맵 (제안)

범위 가정: **교사용 B2B MVP 정식 오픈(무료/베타 요금 유지)**. 결제·B2C·5~6학년은 후속.

### Stage A — 신뢰·안전 게이트 (오픈 차단 해제)
1. LA-3.1 채점 스코프 수정 + 회귀(`verify:grading`)
2. LA-3.2 응시 세션 시크릿
3. LA-3.3 응시 정책(1인 1진행 등) + UX 문구
4. LA-6.3/1.3/1.4 성취기준 시드·주입
5. LA-6.5 검수 토글·배포 게이트
6. LA-3.5 익명화/마감 + 방침 정합
7. LA-7.1 모니터링 · LA-5.7/1.5 env·데모 시드
8. LA-4.1/4.2/4.3 SEO·카피 · LA-1.1 문서 정직화  
→ **Preview에서 교실 시나리오 E2E 후 main.**

### Stage B — 오픈 직후 (1~2 스프린트)
- 답안 autosave · 타이머 자동제출 · 오답 해설
- shortCode RL 분리(R1) · AI KST 일자(R9)
- 도형 문항 제약/FEEDBACK #1 완화책
- 단답 Pass2 · 문제은행 재사용 1차
- a11y · 전용 도메인(Clerk 선행) · 후기
- `KNOWN_ISSUES`/`CLAUDE` 스택 문서 정리 · mock-data 삭제

### Stage C — 유료·확장 (ROADMAP Phase 2–5)
- 2-A 요금 UI+게이팅(`BILLING_ENFORCED`) → R2 카피 합의
- 사업자·포트원 V2·메일(R7)·Vercel Pro → 2-B
- Phase 4: 5~6학년(출판사 목차 선행)
- Phase 5: 공유·학부모 리포트(R12 개인정보)·보충 문항·커뮤니티
- `기획.md` 자습형 B2C는 코어 안정 후

```
[지금 main 베타]
    → Stage A (필수 보안·품질·문서) → 정식 오픈(무료)
    → Stage B (응시 UX·운영 다듬기)
    → Stage C (요금·학년 확대·바이럴)
```

---

## 11. 조사 방법 · 한계

- 정적 전수: `src/`, `prisma/`, `scripts/`, `docs/`, 루트 기획 문서, `package.json`, `vercel.json`, `.env.example`
- 동적: `npm ci` · `tsc` · `lint` · `build` · 라이브 랜딩 fetch · Vercel deployment 목록
- **하지 않음:** 프로덕션 DB 직접 조회, 실제 아동 데이터 열람, 침투 테스트 실행, 코드 수정
- 병렬 브랜치(`claude/nifty-pasteur-*` 등)에 요금제 작업 흔적이 있으나 **본 감사 기준은 `main`/프로덕션**

---

## 12. 요약 표 (우선순위별)

### 오픈 필수
채점 testId 스코프 · 응시 세션 바인딩 · 응시 남용 가드 · 성취기준 시드+주입 · isReviewed 게이트 · 익명화/방침 · 아동 데이터 런북 · env/웹훅/cron/데모샘플 · OG/robots/sitemap · 모니터링 · README 정직화 · E2E 스모크

### 오픈 직후
autosave·타임업 · 오답 해설 · RL/KST · 도형 제약 · 단답 Pass2 · 문제은행 UI · a11y · 도메인 · 후기 · 문서/고아코드 정리

### 나중에
결제·요금제 · 5~6학년 · B2C 자습 · 서술형 · Classroom CRUD · VERY_HARD · 커뮤니티 · next-pwa/shadcn/RQ 재도입 · Prisma 7

---

*이 문서는 오픈 의사결정용 감사 산출물이다. 구현 PR은 항목 ID(LA-x.y)를 커밋/이슈에 인용하면 추적하기 쉽다.*
