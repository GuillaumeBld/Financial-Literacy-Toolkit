import { Suspense } from "react";
import { DeskApp } from "@/components/desk-app";

export default function DeskPage() {
  return (
    <Suspense fallback={<p className="wait">Ouverture du bureau…</p>}>
      <DeskApp />
    </Suspense>
  );
}
