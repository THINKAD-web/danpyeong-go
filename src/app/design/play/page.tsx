import { Suspense } from "react";
import { DesignPlayClient } from "./DesignPlayClient";

export default function DesignPlayPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] items-center justify-center text-ink/40">
          불러오는 중…
        </main>
      }
    >
      <DesignPlayClient />
    </Suspense>
  );
}
