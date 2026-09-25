# 단평GO — Phase 2 작업 지시서: 수익모델 구축

> 기간: 2026년 11~12월 개발 → 2027년 2월 신학기 유료 전환 오픈
> 원본: 「단평GO 플랫폼 업데이트 지시서」(2026-09-25) Phase 2
> 진행 방식: 단계별 PR → Vercel Preview 확인 → 승인 후 머지. **다음 단계로 자동 진행 금지.**

---

## 0. 가드레일 (Phase 2 전체)

- **학생 화면에는 결제·요금·광고 요소를 절대 넣지 않는다.** `/play/**`, 학생 결과 화면, 학생이 보는 PDF 모두 해당.
- **학생·학부모 대상 과금 없음.** 결제 주체는 교사 개인 또는 학교뿐이다.
- **"기본 기능은 정식 전환 후에도 계속 무료"** (랜딩에 공개한 약속). 지금 무료로 되는 기능(객관식·단답형 생성, 배포, 자동 채점, 기본 리포트, 기본 PDF/Excel)은 유료로 옮기지 않는다. 무료 티어에서 줄어드는 것은 **AI 생성 횟수 한도**뿐이다.
- **유료 전환 전(2027.02 이전)에는 과금·차단이 켜지지 않는다.** 모든 제한은 `BILLING_ENFORCED` 플래그 뒤에 둔다 (기본 `false`).
- 카드번호는 우리 서버에 들어오지 않는다. 결제창·카드 입력은 PG가 처리하고, 우리는 PG가 발급한 키만 저장한다.
- 요금·기능 표는 **코드 한 곳**(`src/lib/plans.ts`)에서만 정의하고, 요금 페이지·게이트·관리자 화면은 모두 거기서 읽는다.

---

## STEP 0 — 착수 전 결정·준비 (개발 아님, 운영)

아래가 정해지지 않으면 STEP 3부터 막힌다. 11월 첫 주 안에 끝낸다.

| # | 항목 | 권장안 | 비고 |
|---|---|---|---|
| D1 | 무료 AI 생성 한도 | **월 10회** | 지시서 범위 5~10회 중 상한. 1회 = "문항 생성" 버튼 1번(최대 20문항). 실패한 생성은 세지 않음 (현재 로직 그대로) |
| D2 | Pro 가격 | 월 4,900원 / 연 39,000원 (VAT 포함 표기) | 연간 = 월 약 3,250원, 34% 할인 |
| D3 | Pro "무제한"의 실제 상한 | 일 30회 공정 사용 한도 유지 | 현재 `AI_DAILY_LIMIT_PER_USER`. 요금 페이지에 "공정 사용 범위 내 무제한"으로 표기 |
| D4 | 베타 사용자 처우 | 2027.02 이전 가입 교사 전원 **Pro 3개월 무료** (2027.05.31까지) | 베타 참여 보상 + 유료 기능 체험. `source=BETA` |
| D5 | PG | **토스페이먼츠 직접 연동** (자동결제/빌링) | 포트원은 PG를 여럿 쓸 때 이점이 있는데, 우리는 PG 하나라 단계만 늘어난다. 빌링(자동결제)은 토스페이먼츠에 **별도 계약 신청** 필요 |
| D6 | 사업자 | 사업자등록 + **통신판매업 신고** | 결제 오픈의 전제. 사업자 정보는 사이트 하단에 표시해야 함 |
| D7 | 학교 결제 경로 | 1차: 견적서 → 계좌이체 → 세금계산서(홈택스 수동) | 학교장터(S2B) 등록 여부는 첫 학교 문의가 오면 판단 |
| D8 | 약관 | 이용약관·환불정책 초안 | STEP 4 전에 필요. 자동갱신 고지, 청약철회 규정은 전문가 검토 |

**완료 기준:** D1~D8 결정 사항을 이 문서 표에 확정값으로 기록.

---

## STEP 1 — 요금제·권한 모델 (PR 1)

결제 없이 "이 교사는 어떤 요금제이고 무엇을 할 수 있나"를 판정하는 기반. 이후 모든 단계가 여기에 의존한다.

### 1-1. 스키마

```prisma
enum Plan { FREE PRO SCHOOL }

enum SubscriptionStatus {
  ACTIVE     // 이용 중
  PAST_DUE   // 자동결제 실패, 유예 기간
  CANCELED   // 해지 예약 (currentPeriodEnd 까지 이용 가능)
  EXPIRED    // 종료
}

enum SubscriptionSource {
  PAID    // 카드 결제
  BETA    // 베타 보상 (D4)
  COMP    // 운영자 수동 부여 (앰버서더·인플루언서 — Phase 5)
}

model Subscription {
  id               String             @id @default(cuid())
  userId           String             @unique
  user             User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan             Plan               @default(PRO)
  status           SubscriptionStatus
  source           SubscriptionSource
  billingCycle     String?            // "MONTHLY" | "YEARLY" (PAID 만)
  currentPeriodEnd DateTime
  cancelAtPeriodEnd Boolean           @default(false)
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  @@index([status, currentPeriodEnd])
}
```

학교 라이선스 모델(`Organization`)은 STEP 5에서 추가한다. 1단계에서는 판정 함수에 자리만 둔다.

### 1-2. `src/lib/plans.ts` — 요금·기능 표 (단일 원천)

```ts
export const FEATURES = {
  AI_GENERATE: "ai_generate",
  ESSAY_QUESTIONS: "essay_questions",       // 서술형 (추후)
  REMEDIAL_QUESTIONS: "remedial_questions", // 오답 기반 보충 문항 (Phase 5-4)
  GROWTH_REPORT: "growth_report",           // 누적 성장 리포트
  GRADE_SHARE_FULL: "grade_share_full",     // 동학년 공유 무제한 (Phase 5-1)
  CUSTOM_EXPORT: "custom_export",           // PDF/Excel 커스텀
} as const;

export const PLANS = {
  FREE:   { label: "무료",        monthlyAiLimit: 10,   features: [AI_GENERATE] },
  PRO:    { label: "프로",        monthlyAiLimit: null, features: [/* 전체 */] },
  SCHOOL: { label: "학교 라이선스", monthlyAiLimit: null, features: [/* 전체 */] },
};
export const PRICES = { PRO_MONTHLY: 4900, PRO_YEARLY: 39000 };
```

기능 키는 아직 없는 기능도 미리 정의한다. 해당 기능을 만들 때 게이트만 연결하면 된다.

### 1-3. `src/lib/entitlements.ts`

```ts
getEntitlements(userId): Promise<{
  plan: Plan;                      // 실제 판정된 요금제
  source: "FREE" | SubscriptionSource | "SCHOOL";
  monthlyAiLimit: number | null;   // null = 무제한
  features: Set<Feature>;
  enforced: boolean;               // BILLING_ENFORCED
  periodEnd?: Date;
}>
can(ent, feature): boolean
```

판정 순서:
1. 유효한 `Subscription` (ACTIVE/CANCELED/PAST_DUE 이면서 `currentPeriodEnd > now`) → PRO
2. (STEP 5 이후) 라이선스 기간 안의 학교 소속 → SCHOOL
3. 그 외 → FREE

`BILLING_ENFORCED=false` 인 동안은 판정 결과(plan)는 그대로 돌려주되 `can()`은 항상 true, 한도는 적용하지 않는다. UI는 판정된 요금제를 보여줄 수 있지만 차단하지는 않는다.

### 1-4. 관리자 수동 부여

`/admin`에 교사 검색 → "Pro 부여(COMP, 기간 지정)" / "회수". 결제 연동 전에도 앰버서더·테스트 계정에 쓸 수 있다.

### 1-5. 검증
- `scripts/verify-entitlements.ts`: FREE / PRO(PAID·BETA·COMP) / 만료 / 해지 예약 / PAST_DUE / 플래그 on·off 조합 판정. DB 없이 모킹 (기존 `verify-*.ts` 패턴).
- `package.json`에 `verify:entitlements` 추가.

**완료 기준:** 관리자가 특정 교사에게 Pro를 부여하면 `getEntitlements`가 PRO를 돌려주고, 플래그가 꺼져 있는 한 어떤 사용자 동작도 달라지지 않는다.

---

## STEP 2 — 월간 AI 사용량 계량·한도 (PR 2)

### 2-1. 월간 카운트
- `ai-rate-limit.ts`에 `getUserMonthlyCount(userId)` 추가. 기존 `AiUsageLog` 행 수를 **KST 기준 이번 달 1일 00:00** 이후로 센다.
- **기존 버그 함께 수정:** 지금 `todayStart()`는 서버 로컬 시간 기준인데, Vercel은 UTC라서 일일 한도가 KST 오전 9시에 초기화된다. 일·월 경계를 모두 `Asia/Seoul` 기준으로 통일한다 (`anonymize-cron.ts`의 KST 처리 참고).

### 2-2. 한도 적용 (`/api/ai/generate`)
- 확인 순서: 동시 요청 → 일일 한도(모든 요금제, 남용 방지) → **월간 한도(FREE만, `enforced`일 때만)** → 전역 한도.
- 월간 한도 초과 응답: `402` + `{ code: "PLAN_LIMIT", used, limit, resetsAt }`.
- 지금처럼 성공한 생성만 기록한다 (실패는 한도를 차감하지 않음).

### 2-3. 교사 화면
- `/teacher/test/new` 상단에 사용량 표시: "이번 달 AI 생성 7 / 10회 · 11월 1일 초기화". Pro는 "프로 · 무제한".
- `402 PLAN_LIMIT`를 받으면 업그레이드 안내 모달: 남은 무료 기능(수동 문항 작성, 기존 문항 재사용, 배포·채점은 계속 가능)을 먼저 알려주고, 그다음에 Pro 안내를 붙인다.
- 플래그가 꺼져 있을 때도 사용량은 보여준다 ("베타 기간 동안은 한도 없이 사용 중"). 유료 전환 때 교사가 놀라지 않도록 미리 익숙하게 만든다.

### 2-4. 검증
- `scripts/verify-monthly-limit.ts`: KST 월 경계(1일 00:00 직전·직후, UTC 기준 전날 15:00), FREE 10회째 허용·11회째 402, PRO 통과, 플래그 off 통과.

**완료 기준:** 스테이징에서 `BILLING_ENFORCED=true`, `FREE 한도=2`로 두고 3번째 생성 시 안내 모달이 뜬다. 운영(플래그 off)에서는 동작 변화가 없다.

---

## STEP 3 — 요금 페이지·요금제 표시 (PR 3)

### 3-1. `/pricing` (공개)
- 무료 / 프로 / 학교 라이선스 3열 비교표. 값은 `plans.ts`에서 읽는다.
- "준비 중" 기능(서술형, 보충 문항, 누적 리포트, 동학년 공유)은 **"출시 예정"으로 분명히 표시**한다. 없는 기능을 있는 것처럼 팔지 않는다.
- 학교 라이선스: "학년·학교 단위 연간 계약 · 세금계산서 발행 · 견적 문의" → 문의 폼(STEP 5).
- FAQ: 무료로 계속 되는 것 / 해지·환불 / 학교 예산 결제 / 학생 데이터는 요금제와 무관하게 동일하게 보호됨.
- 랜딩 헤더·푸터에 "요금" 링크 추가. `middleware.ts` 공개 경로에 `/pricing` 추가.

### 3-2. 교사 설정 `/teacher/billing`
- 현재 요금제, 기간, 출처(베타 보상/결제/학교), 이번 달 사용량.
- 결제 전(STEP 4 이전)에는 "2027년 2월 유료 플랜 오픈 예정" 안내만.

### 3-3. 베타 보상 부여 (D4)
- 관리자 일괄 작업: 기준일 이전 가입 교사 전원에게 `Subscription(source=BETA, currentPeriodEnd=D4 종료일)` 생성. 여러 번 실행해도 결과가 같아야 한다(멱등).
- 대시보드 배너: "베타 참여 감사 — 2027년 5월 31일까지 프로 무료".

**완료 기준:** `/pricing`이 공개 접근되고 교사가 자기 요금제·사용량을 확인할 수 있다. 결제 버튼은 아직 없다.

---

## STEP 4 — 교사 개인 결제: 토스페이먼츠 자동결제 (PR 4, 가장 큼)

> 전제: D5 빌링 계약, D6 사업자·통신판매업, D8 약관·환불정책 완료. 토스페이먼츠 **테스트 키**로 개발하고, 라이브 키는 오픈 직전에 넣는다.

### 4-1. 스키마 추가

```prisma
model BillingKey {           // 자동결제 수단 — 카드번호 아님, PG 발급 키
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  customerKey String   @unique   // 우리가 만든 추측 불가 ID (cuid)
  billingKeyEnc String           // AES-GCM 암호화 저장 (BILLING_KEY_SECRET)
  cardLabel   String?            // "신한 ****1234" 표시용
  createdAt   DateTime @default(now())
}

model Payment {
  id          String   @id @default(cuid())
  userId      String?
  orgId       String?            // STEP 5
  orderId     String   @unique   // 멱등 키
  paymentKey  String?  @unique
  amount      Int
  status      String             // DONE | FAILED | CANCELED | PARTIAL_CANCELED
  method      String             // CARD_BILLING | TRANSFER(학교)
  period      String?            // "2027-03" 등 청구 대상 기간
  receiptUrl  String?
  failReason  String?
  raw         Json?
  approvedAt  DateTime?
  createdAt   DateTime @default(now())
  @@index([userId]) @@index([orgId])
}
```

### 4-2. 흐름
1. **구독 시작** `/teacher/billing` → 월/연 선택 → 토스 결제창(카드 등록, `requestBillingAuth`) → `successUrl`로 `authKey` 수신
2. `POST /api/billing/confirm`: `authKey` → 빌링키 발급 → 암호화 저장 → **첫 결제 즉시 승인** → `Payment(DONE)` + `Subscription(PAID, ACTIVE, currentPeriodEnd=+1개월/+1년)`. 전 과정을 하나의 트랜잭션으로 묶고, 승인 성공 전에는 구독을 만들지 않는다.
3. **정기 결제 크론** `/api/cron/billing-renewals` (매일 KST 09:00, `CRON_SECRET` 인증): `currentPeriodEnd`가 오늘인 ACTIVE 구독을 청구한다. `orderId = sub_{subscriptionId}_{period}`라서 같은 크론이 두 번 돌아도 이중 청구가 안 된다.
4. **실패 처리**: PAST_DUE 전환 → 3일 간격으로 3회 재시도 → 그래도 실패하면 EXPIRED(FREE로 복귀). 교사에게 대시보드 배너와 이메일로 알린다.
5. **해지**: `cancelAtPeriodEnd=true` → 기간 끝까지 Pro 유지, 그 뒤 EXPIRED. 해지 버튼은 설정 화면 첫 화면에서 두 번 클릭 이내로 닿아야 한다.
6. **환불**: D8 정책대로. 관리자 화면 "결제 취소" → 토스 취소 API → `Payment` 상태 갱신 → 구독 종료.
7. **웹훅** `/api/webhooks/toss`: 결제 상태 변경을 받아 `Payment`와 대조한다. 검증 방법은 토스 문서 기준으로 하고, `middleware.ts` 공개 경로에 추가한다.

### 4-3. 법·표시 요건 (D8 검토 결과 반영)
- 결제 전 화면에 금액·주기·자동갱신·해지 방법·환불 규정을 명시하고, 동의 체크 후에만 결제할 수 있게 한다.
- 연간 구독 갱신 전 사전 안내 메일 (예: 7일 전).
- 사이트 하단에 사업자 정보(상호, 대표자, 사업자등록번호, 통신판매업 신고번호, 주소, 연락처)와 이용약관·환불정책 링크.
- 개인정보처리방침 개정: 수탁자에 토스페이먼츠 추가, 결제 정보 보유기간(전자상거래법상 거래기록 보존) 명시, 7일 전 고지.

### 4-4. 보안
- 빌링키는 암호화 저장하고 로그에 절대 남기지 않는다. 결제 금액은 **서버의 `PRICES`로만** 정하고 클라이언트가 보낸 금액은 무시한다.
- 교사 계정 삭제(`teacher-deletion.ts`) 시 빌링키를 삭제하고 PG 쪽 빌링키도 해지한다. 다만 `Payment` 거래기록은 법정 보존 기간 동안 `userId`를 비운 채 남긴다 → 삭제 요약(summary)과 방침에 반영.

### 4-5. 검증
- `scripts/verify-billing.ts` (토스 API 모킹): 첫 결제 성공·실패, 크론 중복 실행 멱등, 실패 3회 → EXPIRED, 해지 예약, 금액 위조 무시.
- 토스 테스트 환경에서 실제 카드 등록 → 결제 → 강제 갱신 → 취소까지 한 번 끝까지 돌리고 결과를 PR에 기록한다.

**완료 기준:** 테스트 키 환경에서 교사가 Pro를 구독·갱신·해지·환불하는 과정이 끝까지 동작하고, 크론을 여러 번 돌려도 이중 청구가 없다.

---

## STEP 5 — 학교 라이선스 (PR 5)

학교는 카드 자동결제가 아니라 **견적 → 품의 → 계좌이체 → 세금계산서**로 산다. 1차는 운영자 수작업 + 시스템 반영으로 간다.

### 5-1. 스키마
```prisma
model Organization {
  id           String   @id @default(cuid())
  name         String              // "서울○○초등학교"
  seats        Int                 // 계약 교사 수
  licenseStart DateTime
  licenseEnd   DateTime            // 보통 학년도 단위 (3/1 ~ 익년 2/말)
  joinCode     String   @unique    // 교사 합류용 코드
  contactName  String?
  contactEmail String?
  bizNote      String?  @db.Text   // 세금계산서 발행 정보 메모
  createdAt    DateTime @default(now())
  members      OrgMember[]
}
model OrgMember {
  id     String @id @default(cuid())
  orgId  String
  org    Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  userId String @unique            // 교사는 한 학교에만 소속
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   String @default("MEMBER") // "ADMIN" = 담당 교사
  joinedAt DateTime @default(now())
}
```

### 5-2. 흐름
1. `/pricing` → "학교 견적 문의" 폼(학교명, 담당자, 교사 수, 연락처) → DB 저장 + Slack 알림
2. 운영자가 견적서 발송 (단가: 교사 수 구간별 할인 — D2와 함께 확정)
3. 입금 확인 → `/admin`에서 Organization 생성(좌석·기간), `Payment(method=TRANSFER)` 기록, 세금계산서는 홈택스에서 발행
4. 담당 교사에게 `joinCode` 전달 → 교사들이 `/teacher/billing`에서 코드를 입력해 합류 (좌석이 차면 거절)
5. `getEntitlements`에 SCHOOL 판정 연결. 개인 Pro와 학교 소속이 겹치면 학교 우선으로 하고, 개인 구독의 다음 갱신을 막도록 안내한다
6. 라이선스 만료 30일 전 담당 교사에게 갱신 안내. 학교 예산 집행 시기(1~2월, 8월)에 맞춘다

**완료 기준:** 운영자가 학교를 등록하면 코드를 입력한 교사가 SCHOOL 권한을 받고, 좌석 초과 합류와 만료가 제대로 처리된다.

---

## STEP 6 — 교사 대시보드 제휴 배너 (PR 6, 조건부)

> **착수 조건:** 활성 교사(지시서 KPI 정의) 100명 이상 + 첫 스폰서 계약 확정. 조건이 되기 전에는 만들지 않는다.

- 노출 위치는 `/teacher` 대시보드 하단 1곳뿐. `/play/**`와 학생에게 보이는 모든 화면·PDF·Excel에는 코드 수준에서 넣을 수 없게 한다 (배너 컴포넌트는 `src/app/teacher/**`에서만 import).
- 표기: "추천 리소스 · 제휴". 교구·교재 출판사, 교원연수 기관, 에듀테크만 받는다.
- 운영: `/admin`에서 배너 등록(이미지, 문구, 링크, 기간). 월정액 스폰서십이라 클릭 과금·추적 픽셀·제3자 스크립트는 넣지 않는다. 클릭 수만 자체 집계한다.
- Pro 교사에게 숨길지는 D-결정 사항 (권장: 숨김 — 유료 혜택으로 설명 가능).

---

## STEP 7 — 유료 전환 오픈 (2027년 2월)

| 시점 | 작업 |
|---|---|
| 1월 둘째 주 | 라이브 키 발급·등록, 운영 DB에 베타 보상 부여 (STEP 3-3) |
| 오픈 7일 전 | 교사 전원에게 공지: 무료 한도, Pro 가격, 베타 보상 기간, 기본 기능 계속 무료. 개인정보처리방침·약관 개정 고지 |
| 오픈일 | `BILLING_ENFORCED=true` → 월간 한도·기능 게이트 활성. 소액 실결제 1건으로 운영 점검 후 즉시 환불 |
| 오픈 +1주 | 402 발생 수, 업그레이드 모달 → 결제 전환율, 결제 실패율 점검 |
| 2027.05.31 | 베타 보상 만료 → 결제 수단을 등록하지 않은 교사는 FREE로 전환 (만료 14일·3일 전 안내) |

**롤백:** 문제가 생기면 `BILLING_ENFORCED=false` 한 번으로 모든 제한을 풀 수 있다. 결제·구독 데이터는 그대로 유지된다.

---

## 측정 (KPI 연결)

- 유료 전환율 = 오픈 후 Pro 결제 교사 / 활성 교사 (목표 5~10%)
- 한도 도달률 = 월간 한도에 도달한 FREE 교사 비율. 너무 높으면(>40%) 한도가 지나치게 빡빡하다는 뜻이므로 D1을 재검토한다
- 이탈 = 해지 예약 수, 결제 실패 → EXPIRED 수
- Slack 알림: 첫 결제, 해지 예약, 결제 실패, 학교 견적 문의

## 하지 않을 것
- 학생 화면 광고·결제 요소, 학생·학부모 과금
- 지금 무료인 기능을 유료로 이동
- 출시 전 기능을 "지금 사용 가능"으로 판매
- 카드정보 직접 수집, 클라이언트가 보낸 금액으로 결제
