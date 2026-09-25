// 서비스 대표 URL — 전용 도메인 연결 후 Vercel 환경변수 NEXT_PUBLIC_SITE_URL 만 바꾸면 된다.
// (메타데이터 canonical·OG URL, 워터마크 등 "밖으로 나가는 링크"에 사용)
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://danpyeong-go.vercel.app"
).replace(/\/$/, "");
