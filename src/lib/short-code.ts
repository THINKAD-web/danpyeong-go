import { randomInt } from "crypto";
import type { PrismaClient } from "@prisma/client";

/** 6~7자리 숫자 단축 코드 형태 (구두 전달용) */
export function isShortCodeShape(code: string): boolean {
  return /^\d{6,7}$/.test(code.trim());
}

export function generateShortCode(length: 6 | 7 = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += String(randomInt(0, 10));
  }
  return out;
}

/**
 * 유니크 shortCode 발급.
 * 6자리 최대 5회 시도 후 7자리로 폴백(추가 5회). 그래도 실패하면 throw.
 */
export async function allocateUniqueShortCode(
  prisma: Pick<PrismaClient, "test">,
  opts?: { exists?: (code: string) => Promise<boolean> }
): Promise<string> {
  const exists =
    opts?.exists ??
    (async (code: string) => {
      const row = await prisma.test.findUnique({
        where: { shortCode: code },
        select: { id: true },
      });
      return Boolean(row);
    });

  for (let i = 0; i < 5; i++) {
    const code = generateShortCode(6);
    if (!(await exists(code))) return code;
  }
  for (let i = 0; i < 5; i++) {
    const code = generateShortCode(7);
    if (!(await exists(code))) return code;
  }
  throw new Error("shortCode allocation exhausted");
}

/** PUBLISHED 전환 시 shortCode가 없으면 발급해 반환 */
export async function ensureShortCodeForTest(
  prisma: PrismaClient,
  testId: string,
  current: string | null
): Promise<string> {
  if (current) return current;
  const shortCode = await allocateUniqueShortCode(prisma);
  const updated = await prisma.test.update({
    where: { id: testId },
    data: { shortCode },
    select: { shortCode: true },
  });
  return updated.shortCode!;
}
