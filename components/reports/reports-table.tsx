import { serverFetch } from "@/lib/api/server";
import { ApiError } from "@/lib/api/shared";

interface ReportSummary {
  id: string;
  title: string;
  mastery: number;
  flagged: boolean;
}

export default async function ReportsTable() {
  let summaries: ReportSummary[] = [];
  let errorMessage: string | null = null;

  try {
    summaries = await serverFetch<ReportSummary[]>("/reports/summary");
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      errorMessage = error.message;
    } else {
      errorMessage = "We couldn't load your reports right now.";
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              Assessment
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              Mastery
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              Fairness checks
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {errorMessage && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-sm text-amber-600" role="alert">
                {errorMessage}
              </td>
            </tr>
          )}
          {!errorMessage && summaries.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">
                Reports will populate after the first assessment attempt is completed.
              </td>
            </tr>
          )}
          {summaries.map((summary) => (
            <tr key={summary.id}>
              <td className="px-4 py-3 text-sm font-medium text-slate-700">{summary.title}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{Math.round(summary.mastery * 100)}%</td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {summary.flagged ? "Action required" : "No issues"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
