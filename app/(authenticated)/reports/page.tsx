import { Suspense } from "react";

import ReportsTable from "@/components/reports/reports-table";

export default function ReportsPage() {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-600">View cohort mastery and fairness checks for each assessment.</p>
      </header>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading reports…</p>}>
        <ReportsTable />
      </Suspense>
    </section>
  );
}
