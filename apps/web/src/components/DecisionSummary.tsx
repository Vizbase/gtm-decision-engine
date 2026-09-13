"use client";

import { StoredAnalysisResult } from "@/lib/api";


function formatAction(value: string) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}


export default function DecisionSummary({
  results,
  isDemo,
}: {
  results: StoredAnalysisResult[];
  isDemo: boolean;
}) {
  if (!results.length) {
    return null;
  }

  const topAccount = [...results].sort(
    (a, b) =>
      a.rank - b.rank
  )[0];

  const workNow = results.filter(
    (item) =>
      item.recommended_action === "work_now"
  ).length;

  const researchFirst = results.filter(
    (item) =>
      item.recommended_action ===
      "research_first"
  ).length;

  const icpConfigured = results.some(
    (item) => item.fit_level !== "not_configured"
  );

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 shadow-xl shadow-slate-200/50">
      <div className="flex flex-col gap-6 p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
              Decision Summary
            </span>

            {isDemo && (
              <span className="rounded-full bg-violet-400/15 px-3 py-1 text-xs font-semibold text-violet-200 ring-1 ring-violet-300/20">
                Demo Snapshot
              </span>
            )}
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            Where should sales focus next?
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            {icpConfigured
              ? "The engine combines ICP fit, buying signals, CRM context, and data confidence to recommend the next best action for every account."
              : "No ICP profile is configured for this run. Accounts are prioritized using current signals, CRM context, and data confidence."}
          </p>

          {isDemo && (
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Demo mode uses curated enrichment snapshots
              for a stable portfolio demonstration. CSV
              uploads use live website enrichment.
            </p>
          )}
        </div>

        <div className="grid min-w-full gap-3 sm:grid-cols-3 lg:min-w-[430px]">
          <MiniStat
            label="Top account"
            value={topAccount.company.name}
            detail={`${topAccount.priority_score} account score`}
          />

          <MiniStat
            label="Work now"
            value={String(workNow)}
            detail="Immediate action"
          />

          <MiniStat
            label="Research first"
            value={String(researchFirst)}
            detail="Needs validation"
          />
        </div>
      </div>

      <div className="border-t border-white/10 bg-white/5 px-7 py-3 text-xs text-slate-300">
        Current top recommendation:{" "}
        <span className="font-semibold text-white">
          {topAccount.company.name}
        </span>{" "}
        →{" "}
        <span className="font-semibold text-white">
          {formatAction(
            topAccount.recommended_action
          )}
        </span>
      </div>
    </section>
  );
}


function MiniStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-2 truncate text-lg font-semibold text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {detail}
      </p>
    </div>
  );
}
