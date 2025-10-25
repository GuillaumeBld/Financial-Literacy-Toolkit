const checklist = [
  "Pre/post assessment delivery with privacy-first student IDs",
  "AI-assisted scoring for short responses using rubric confidence",
  "Instructor dashboard summarizing cohort learning gains",
  "Audit-ready exports aligned with FERPA guidance"
];

const phases = [
  {
    title: "Plan",
    description:
      "Finalize the item bank, align forms A/B, and configure course peppers for hashed student keys."
  },
  {
    title: "Administer",
    description:
      "Launch the pre assessment, monitor participation, and ensure accommodations via accessibility testing."
  },
  {
    title: "Analyze",
    description:
      "Run AI scoring, generate cohort deltas, and review fairness diagnostics before releasing insights."
  },
  {
    title: "Report",
    description:
      "Share dashboards with faculty, export anonymized data, and log follow-up actions for continuous improvement."
  }
];

const roadmap = [
  {
    milestone: "Week 1",
    focus:
      "Stand up core web app shell, connect to Postgres seed, and implement secure login placeholder."
  },
  {
    milestone: "Week 2",
    focus:
      "Ship pre/post assessment forms with autosave, scoring queue, and instructor progress view."
  },
  {
    milestone: "Week 3",
    focus:
      "Release analytics dashboards with change metrics, fairness checks, and export workflows."
  }
];

const resources = [
  {
    title: "Architecture",
    description: "End-to-end flow for web, API, worker, and storage integration.",
    href: "/docs/ARCHITECTURE.md"
  },
  {
    title: "Brand Tokens",
    description: "Colors, typography, and spacing to stay aligned with Loyola/Quinlan style.",
    href: "/docs/BRAND_TOKENS.md"
  },
  {
    title: "Data Model",
    description: "Minimal tables covering users, attempts, responses, and audit logs.",
    href: "/docs/DATA_MODEL.md"
  },
  {
    title: "Security & Privacy",
    description: "Guidelines for FERPA compliance, RLS, and anonymization workflows.",
    href: "/docs/SECURITY_PRIVACY.md"
  }
];

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16">
      <section id="overview" className="grid gap-10 rounded-xl bg-white p-10 shadow-card md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary">
            Sprint 0 · MVP scope
          </span>
          <h1 className="text-4xl font-bold text-neutral">
            Launch the AI-assisted Financial Literacy Assessment pilot.
          </h1>
          <p className="text-lg text-neutral/80">
            Deliver a web application that securely administers pre and post assessments, coordinates AI scoring,
            and equips Quinlan faculty with actionable learning insights.
          </p>
          <div className="grid gap-3">
            {checklist.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-secondary" />
                <p className="text-sm text-neutral/75">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-xl border border-primary/10 bg-primary/5 p-8">
          <div>
            <h2 className="text-xl font-semibold text-primary">Core outcomes</h2>
            <p className="mt-3 text-sm text-neutral/75">
              Each student receives pre/post scores, change deltas, and domain confidence insights. Instructors gain
              cohort trends, fairness diagnostics, and exportable evidence for accreditation.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/80">Readiness checklist</h3>
            <ul className="mt-4 grid gap-3 text-sm text-neutral/80">
              <li>✔️ Item bank vetted against Form Design guidelines</li>
              <li>✔️ Environment variables defined per docs</li>
              <li>✔️ Accessibility checks scheduled with QA</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="features" className="grid gap-8 md:grid-cols-3">
        {phases.map((phase) => (
          <article
            key={phase.title}
            className="flex flex-col gap-3 rounded-xl border border-neutral/10 bg-white p-6 shadow-card"
          >
            <h3 className="text-lg font-semibold text-primary">{phase.title}</h3>
            <p className="text-sm text-neutral/75">{phase.description}</p>
          </article>
        ))}
      </section>

      <section id="workflow" className="rounded-xl bg-white p-10 shadow-card">
        <h2 className="section-title">Delivery workflow</h2>
        <p className="section-body">
          The MVP follows Loyola&apos;s guardrails: authenticate via LMS or hashed IDs, issue timed assessments, score
          via AI with human review when confidence dips, and present dashboards with privacy-safe exports. The
          architecture aligns with the docs for API, worker, and database layers.
        </p>
        <dl className="mt-8 grid gap-6 md:grid-cols-2">
          {roadmap.map((entry) => (
            <div key={entry.milestone} className="rounded-lg border border-primary/10 bg-primary/5 p-6">
              <dt className="text-sm font-semibold uppercase tracking-wide text-primary/80">{entry.milestone}</dt>
              <dd className="mt-2 text-sm text-neutral/75">{entry.focus}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="next-steps" className="rounded-xl border border-neutral/10 bg-white p-10 shadow-card">
        <h2 className="section-title">Next steps for Sprint 1</h2>
        <ul className="mt-6 grid gap-4 text-sm text-neutral/80">
          <li>
            <strong>Integrate Postgres schema:</strong> apply migrations from infra package and wire row-level security
            policies for responses and scores.
          </li>
          <li>
            <strong>Implement assessment engine:</strong> render mixed question types, autosave responses, and queue AI
            scoring jobs.
          </li>
          <li>
            <strong>Build analytics dashboards:</strong> visualize cohort change, domain confidence gaps, and fairness
            diagnostics with export options.
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-neutral/90 p-10 text-white shadow-card">
        <h2 className="text-2xl font-semibold text-secondary">Key documentation</h2>
        <p className="mt-3 text-sm text-white/80">
          Reference the living documentation to keep the MVP aligned with governance, security, and UX expectations.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {resources.map((resource) => (
            <a
              key={resource.title}
              className="group flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-5 transition hover:border-secondary hover:bg-white/10"
              href={resource.href}
            >
              <span className="text-sm font-semibold uppercase tracking-wide text-secondary/80">{resource.title}</span>
              <span className="text-sm text-white/80">{resource.description}</span>
              <span className="text-xs font-medium text-secondary transition group-hover:translate-x-0.5">
                View doc →
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
