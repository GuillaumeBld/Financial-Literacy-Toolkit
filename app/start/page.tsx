import Link from "next/link";

export default function StartPage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 rounded-2xl bg-white p-10 shadow-sm">
      <h1 className="text-3xl font-semibold text-slate-900">Welcome to the Financial Literacy Toolkit</h1>
      <p className="text-base text-slate-600">
        Use your institution credentials to launch an adaptive financial literacy assessment
        and receive tailored learning resources.
      </p>
      <p className="text-sm text-slate-500">
        When your instructor invites you, we will connect through your campus learning
        management system and keep your identity token secure.
      </p>
      <Link
        href="/api/auth/signin?callbackUrl=%2Fdashboard"
        className="inline-flex w-fit items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-white shadow hover:bg-emerald-700"
      >
        Continue with LMS SSO
      </Link>
    </section>
  );
}
