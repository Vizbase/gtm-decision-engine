"use client";

type Props = {
  onTryDemo: () => void;
  onUploadCsv: () => void;
  connecting?: boolean;
};

const flow = [
  {
    step: "01",
    title: "Import",
    description:
      "Upload a CSV or start with a GTM, HubSpot, or Salesforce sample.",
  },
  {
    step: "02",
    title: "Enrich",
    description:
      "Combine company data, CRM context, buying signals, and data confidence.",
  },
  {
    step: "03",
    title: "Score",
    description:
      "Evaluate account evidence with optional ICP fit and signal strength.",
  },
  {
    step: "04",
    title: "Decide",
    description:
      "Rank accounts and recommend the next best sales action.",
  },
];

const capabilities = [
  {
    title: "CRM-aware decisions",
    description:
      "Existing customers, opportunities, leads, and recent outreach change what sales should do next.",
    icon: "↳",
  },
  {
    title: "Buying signals",
    description:
      "Use current account signals and website enrichment as evidence for prioritization.",
    icon: "⌁",
  },
  {
    title: "Optional ICP scoring",
    description:
      "Add target markets, industries, and company size without filtering accounts out.",
    icon: "◎",
  },
  {
    title: "Data-quality checks",
    description:
      "Surface potential duplicate CRM accounts while preserving each record independently.",
    icon: "◇",
  },
];

export default function LandingState({
  onTryDemo,
  onUploadCsv,
  connecting = false,
}: Props) {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-violet-100/70 blur-3xl" />
        <div className="absolute -bottom-40 left-16 h-80 w-80 rounded-full bg-indigo-100/70 blur-3xl" />

        <div className="relative grid gap-10 px-7 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-14">
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                GTM Engineering Portfolio
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                {connecting
                  ? "Connecting to decision engine..."
                  : "Interactive demo ready"}
              </span>
            </div>

            <h2 className="mt-7 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Turn CRM account data into a prioritized sales action queue.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              GTM Decision Engine combines account data,
              CRM context, buying signals, optional ICP fit,
              and data quality to answer one question:
              <span className="font-semibold text-slate-900">
                {" "}which accounts should sales work now, and why?
              </span>
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onTryDemo}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700"
              >
                Try Interactive Demo
              </button>

              <button
                type="button"
                onClick={onUploadCsv}
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700"
              >
                Upload Your CSV
              </button>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
              <span>✓ Automatic column mapping</span>
              <span>✓ Temporary visitor uploads</span>
              <span>✓ CRM-aware recommendations</span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300">
                    Decision Preview
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Priority Queue
                  </p>
                </div>

                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                  Ranked
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <PreviewRow
                  rank="1"
                  company="Northstar Systems"
                  score="94"
                  action="Work Now"
                  tone="emerald"
                />
                <PreviewRow
                  rank="2"
                  company="Acme Enterprise"
                  score="88"
                  action="Continue Opportunity"
                  tone="blue"
                />
                <PreviewRow
                  rank="3"
                  company="Vertex AI Labs"
                  score="76"
                  action="Follow Up"
                  tone="cyan"
                />
                <PreviewRow
                  rank="4"
                  company="Helix Software"
                  score="61"
                  action="Research First"
                  tone="amber"
                />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-800 pt-5">
                <PreviewMetric
                  label="Signals"
                  value="Live"
                />
                <PreviewMetric
                  label="CRM"
                  value="Aware"
                />
                <PreviewMetric
                  label="ICP"
                  value="Optional"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SampleCard
          eyebrow="Full feature showcase"
          title="GTM Sample"
          count="30 accounts"
          description="Mixed account scenarios designed to demonstrate ranking, signals, CRM context, and sales actions."
        />

        <SampleCard
          eyebrow="CRM import"
          title="HubSpot Sample"
          count="61 companies"
          description="Synthetic HubSpot-style data with lifecycle stages and automatic CRM column mapping."
        />

        <SampleCard
          eyebrow="CRM + data quality"
          title="Salesforce Sample"
          count="121 accounts"
          description="Synthetic Salesforce-style accounts including CRM states and duplicate-account cases."
        />
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm lg:p-9">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-500">
            How it works
          </p>

          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            From raw account data to an actionable queue
          </h3>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-4">
          {flow.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
            >
              <span className="text-xs font-semibold text-indigo-500">
                {item.step}
              </span>

              <h4 className="mt-3 font-semibold text-slate-950">
                {item.title}
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg font-semibold text-indigo-600">
                {item.icon}
              </div>

              <h3 className="mt-5 font-semibold text-slate-950">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-950">
              Reproducible demo, real decision logic
            </p>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-indigo-800/75">
              Built-in samples use deterministic synthetic
              signal inputs for reproducibility. Account scores,
              queue ranking, CRM precedence, duplicate detection,
              and recommended actions are calculated by the
              decision engine. Visitor-uploaded CSVs use live
              website enrichment.
            </p>
          </div>

          <span className="whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
            No real customer CRM data
          </span>
        </div>
      </section>

      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-950 px-7 py-9 text-white shadow-xl shadow-indigo-100 sm:px-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300">
              Explore the system
            </p>

            <h3 className="mt-2 text-2xl font-semibold">
              See the decision engine work with different CRM structures.
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Start with a sample dataset or upload your own CSV
              to review mapping, enrichment, scoring, and
              recommended actions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onTryDemo}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-indigo-50"
            >
              Choose Demo
            </button>

            <button
              type="button"
              onClick={onUploadCsv}
              className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Upload CSV
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}


function PreviewRow({
  rank,
  company,
  score,
  action,
  tone,
}: {
  rank: string;
  company: string;
  score: string;
  action: string;
  tone: "emerald" | "blue" | "cyan" | "amber";
}) {
  const tones = {
    emerald:
      "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
    blue:
      "bg-blue-400/10 text-blue-300 ring-blue-400/20",
    cyan:
      "bg-cyan-400/10 text-cyan-300 ring-cyan-400/20",
    amber:
      "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  };

  return (
    <div className="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-3">
      <span className="text-xs font-semibold text-slate-500">
        #{rank}
      </span>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-100">
          {company}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          Account score {score}
        </p>
      </div>

      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${tones[tone]}`}
      >
        {action}
      </span>
    </div>
  );
}


function PreviewMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-300">
        {value}
      </p>
    </div>
  );
}


function SampleCard({
  eyebrow,
  title,
  count,
  description,
}: {
  eyebrow: string;
  title: string;
  count: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-500">
        {eyebrow}
      </p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950">
          {title}
        </h3>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {count}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}
