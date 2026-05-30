import { PrismaClient } from "@prisma/client";

// Next.js dev 환경에서 핫리로드 시 커넥션 폭증 방지용 싱글톤
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
