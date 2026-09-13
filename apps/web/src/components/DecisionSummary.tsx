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
      b.priority_score - a.priority_score
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

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
              Decision Summary
            </span>

            {isDemo && (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                Demo Snapshot
              </span>
            )}
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Focus sales attention where it matters most.
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            The engine combines ICP fit, buying signals,
            CRM context, and data confidence to recommend
            the next best action for every account.
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
            detail={`${topAccount.priority_score} priority`}
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

      <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-3 text-xs text-slate-500">
        Current top recommendation:{" "}
        <span className="font-semibold text-slate-800">
          {topAccount.company.name}
        </span>{" "}
        →{" "}
        <span className="font-semibold text-slate-800">
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
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 truncate text-lg font-semibold text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {detail}
      </p>
    </div>
  );
}
