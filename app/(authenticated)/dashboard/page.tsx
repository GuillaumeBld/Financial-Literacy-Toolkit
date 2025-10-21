import { getServerSession } from "next-auth";

import { authOptions } from "@/auth.config";
import { serverFetch } from "@/lib/api/server";
import { ApiError } from "@/lib/api/shared";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  let upcoming: { id: string; title: string }[] = [];
  let errorMessage: string | null = null;

  try {
    upcoming = await serverFetch<{ id: string; title: string }[]>("/assignments/upcoming");
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      errorMessage = error.message;
    } else {
      errorMessage = "We couldn't load your assignments right now.";
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-slate-500">Signed in as</p>
        <h1 className="text-3xl font-semibold text-slate-900">{session?.user?.name ?? session?.user?.email}</h1>
      </header>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Upcoming assignments</h2>
        <ul className="mt-4 space-y-3">
          {errorMessage && (
            <li className="text-sm text-amber-600" role="alert">
              {errorMessage}
            </li>
          )}
          {!errorMessage && upcoming.length === 0 && (
            <li className="text-sm text-slate-500">No upcoming work assigned.</li>
          )}
          {upcoming.map((assignment) => (
            <li key={assignment.id} className="text-sm text-slate-700">
              {assignment.title}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
