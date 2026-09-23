import { Suspense } from "react";
import { DeskApp } from "@/components/desk-app";

export default function DeskPage() {
  return (
    <main id="contenu" className="desk-page">
      <Suspense fallback={<p className="wait" role="status">Ouverture du bureau…</p>}>
        <DeskApp />
      </Suspense>
    </main>
  );
}
