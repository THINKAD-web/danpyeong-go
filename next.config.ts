import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // 홈 디렉터리 등 상위 lockfile 때문에 workspace root가 어긋나면 Clerk 등이 깨질 수 있음
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
