import { Suspense } from "react";
import { DeskApp } from "@/components/desk-app";

export default function DeskPage() {
  return (
    <Suspense fallback={<p className="wait">Opening the desk…</p>}>
      <DeskApp />
    </Suspense>
  );
}
