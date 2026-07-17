import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await currentAdmin();
  } catch {
    // 미인증 또는 권한 없음 — 교사 대시보드로 리다이렉트
    redirect("/teacher");
  }

  return <>{children}</>;
}
