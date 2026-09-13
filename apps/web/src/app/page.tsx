"use client";

import { useEffect, useState } from "react";

import AnalysisHistoryPanel from "@/components/AnalysisHistoryPanel";
import CompanyDetailPanel from "@/components/CompanyDetailPanel";
import CsvUploadPanel from "@/components/CsvUploadPanel";
import DemoDatasetPicker, {
  DemoSample,
} from "@/components/DemoDatasetPicker";
import DecisionSummary from "@/components/DecisionSummary";
import PriorityFilters, {
  PriorityFilter,
} from "@/components/PriorityFilters";
import QueueControls, {
  SortOption,
} from "@/components/QueueControls";

import {
  AnalysisRunDetail,
  AnalysisRunSummary,
  StoredAnalysisResult,
  getAnalysisRun,
  getAnalysisRuns,
 } from "@/lib/api";


function formatAction(value: string) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}


function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}


export default function Home() {
  const [analysis, setAnalysis] =
    useState<AnalysisRunDetail | null>(null);

  const [history, setHistory] =
    useState<AnalysisRunSummary[]>([]);

  const [selectedResult, setSelectedResult] =
    useState<StoredAnalysisResult | null>(null);

  const [activeFilter, setActiveFilter] =
    useState<PriorityFilter>("all");

  const [search, setSearch] = useState("");

  const [sort, setSort] =
    useState<SortOption>("rank");

  const [loading, setLoading] = useState(true);

  const [showDemoPicker, setShowDemoPicker] =
    useState(false);

  const [selectedSample, setSelectedSample] =
    useState<DemoSample | null>(null);

  const [loadingRunId, setLoadingRunId] =
    useState<string | null>(null);

  const [showUpload, setShowUpload] =
    useState(false);

  const [showHistory, setShowHistory] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  function resetQueueControls() {
    setActiveFilter("all");
    setSearch("");
    setSort("rank");
  }


  async function refreshHistory() {
    const historyData = await getAnalysisRuns();

    setHistory(historyData.runs);

    return historyData.runs;
  }


  async function loadLatestAnalysis() {
    const runs = await refreshHistory();

    if (!runs.length) {
      setAnalysis(null);
      return;
    }

    const detail = await getAnalysisRun(
      runs[0].id
    );

    setAnalysis(detail);
  }


  useEffect(() => {
    async function loadDashboard() {
      try {
        await loadLatestAnalysis();
      } catch {
        setError(
          "Could not connect to the GTM Decision Engine API."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);


  async function handleHistorySelect(
    runId: string
  ) {
    setLoadingRunId(runId);
    setError(null);

    try {
      const detail = await getAnalysisRun(
        runId
      );

      setAnalysis(detail);
      setSelectedResult(null);
      resetQueueControls();
      setShowHistory(false);
    } catch {
      setError(
        "The saved analysis could not be loaded."
      );
    } finally {
      setLoadingRunId(null);
    }
  }


  const results = analysis?.results ?? [];


  const filterCounts: Record<
    PriorityFilter,
    number
  > = {
    all: results.length,

    high_priority: results.filter(
      (item) =>
        item.priority_level === "high"
    ).length,

    work_now: results.filter(
      (item) =>
        item.recommended_action === "work_now"
    ).length,

    open_opportunity: results.filter(
      (item) =>
        item.crm_status === "open_opportunity"
    ).length,

    existing_customer: results.filter(
      (item) =>
        item.crm_status === "existing_customer"
    ).length,
  };


  const filteredResults = results.filter(
    (item) => {
      if (activeFilter === "all") {
        return true;
      }

      if (activeFilter === "high_priority") {
        return item.priority_level === "high";
      }

      if (activeFilter === "work_now") {
        return (
          item.recommended_action === "work_now"
        );
      }

      if (
        activeFilter === "open_opportunity"
      ) {
        return (
          item.crm_status ===
          "open_opportunity"
        );
      }

      if (
        activeFilter === "existing_customer"
      ) {
        return (
          item.crm_status ===
          "existing_customer"
        );
      }

      return true;
    }
  );


  const searchQuery = search
    .trim()
    .toLowerCase();


  const searchedResults =
    filteredResults.filter((item) => {
      if (!searchQuery) {
        return true;
      }

      const companyName =
        item.company.name.toLowerCase();

      const domain =
        item.company.domain?.toLowerCase() ?? "";

      return (
        companyName.includes(searchQuery) ||
        domain.includes(searchQuery)
      );
    });


  const visibleResults = [
    ...searchedResults,
  ].sort((a, b) => {
    if (sort === "priority") {
      return (
        b.priority_score -
          a.priority_score ||
        a.rank - b.rank
      );
    }

    if (sort === "icp") {
      return (
        b.icp_score -
          a.icp_score ||
        a.rank - b.rank
      );
    }

    if (sort === "signals") {
      return (
        b.signal_score -
          a.signal_score ||
        a.rank - b.rank
      );
    }

    return a.rank - b.rank;
  });


  const highPriority =
    filterCounts.high_priority;

  const workNow =
    filterCounts.work_now;

  const duplicateAccounts =
    results.filter(
      (item) =>
        item.potential_duplicate
    ).length;

  const duplicateGroups =
    new Set(
      results
        .filter(
          (item) =>
            item.potential_duplicate &&
            item.company.domain
        )
        .map(
          (item) =>
            item.company.domain!.toLowerCase()
        )
    ).size;

  const isDemo =
    analysis?.workspace_name === "Demo Workspace" ||
    analysis?.workspace_name.startsWith(
      "Sample ·"
    ) === true;

  const actionDistribution = [
    {
      key: "work_now",
      label: "Work Now",
      count: results.filter(
        (item) => item.recommended_action === "work_now"
      ).length,
      bar: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "continue_opportunity",
      label: "Continue Opportunity",
      count: results.filter(
        (item) =>
          item.recommended_action === "continue_opportunity"
      ).length,
      bar: "bg-blue-500",
      badge: "bg-blue-50 text-blue-700",
    },
    {
      key: "expansion",
      label: "Expansion",
      count: results.filter(
        (item) => item.recommended_action === "expansion"
      ).length,
      bar: "bg-violet-500",
      badge: "bg-violet-50 text-violet-700",
    },
    {
      key: "follow_up_existing",
      label: "Follow Up Existing",
      count: results.filter(
        (item) =>
          item.recommended_action === "follow_up_existing"
      ).length,
      bar: "bg-cyan-500",
      badge: "bg-cyan-50 text-cyan-700",
    },
    {
      key: "research_first",
      label: "Research First",
      count: results.filter(
        (item) => item.recommended_action === "research_first"
      ).length,
      bar: "bg-amber-500",
      badge: "bg-amber-50 text-amber-700",
    },
    {
      key: "nurture",
      label: "Nurture",
      count: results.filter(
        (item) => item.recommended_action === "nurture"
      ).length,
      bar: "bg-fuchsia-500",
      badge: "bg-fuchsia-50 text-fuchsia-700",
    },
    {
      key: "pause_outreach",
      label: "Pause Outreach",
      count: results.filter(
        (item) => item.recommended_action === "pause_outreach"
      ).length,
      bar: "bg-orange-500",
      badge: "bg-orange-50 text-orange-700",
    },
    {
      key: "deprioritize",
      label: "Deprioritize",
      count: results.filter(
        (item) => item.recommended_action === "deprioritize"
      ).length,
      bar: "bg-slate-400",
      badge: "bg-slate-100 text-slate-600",
    },
  ].filter((item) => item.count > 0);

  const maxActionCount = Math.max(
    ...actionDistribution.map((item) => item.count),
    1
  );


  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-200">
                G
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-950">
                  GTM Decision Engine
                </h1>

                <p className="mt-0.5 text-sm text-slate-500">
                  Know which accounts to work now, why, and what to do next.
                </p>
              </div>
            </div>
          </div>


          <div className="flex gap-3">
            <button
              onClick={() =>
                setShowHistory(true)
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              History
            </button>

            <button
              onClick={() => {
                setSelectedSample(null);
                setShowUpload(true);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Upload CSV
            </button>

            <button
              onClick={() =>
                setShowDemoPicker(true)
              }
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Try Demo
            </button>
          </div>
        </div>
      </header>


      <div className="mx-auto max-w-7xl px-6 py-8">
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-500">
            Loading dashboard...
          </div>
        )}


        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}


        {!loading && !analysis && (
          <div className="rounded-xl border border-slate-200 bg-white p-8">
            <h2 className="font-semibold text-slate-900">
              No analysis yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Run a demo or upload a company list to get started.
            </p>
          </div>
        )}


        {analysis && (
          <>
            <div className="mb-7">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-slate-500">
                  {analysis.workspace_name}
                </p>

                {isDemo && (
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                    Demo
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Sales Priority Overview
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Ranked company and CRM account records with next-best actions,
                buying signals, CRM context, and data-quality checks.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>
                  {formatDate(
                    analysis.created_at
                  )}
                </span>

                <span>•</span>

                <span>
                  Account = company or organization in the CRM
                </span>

                <span>•</span>

                <span>
                  Click any account for the full decision
                </span>
              </div>
            </div>


            <DecisionSummary
              results={results}
              isDemo={isDemo}
            />


            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard
                label="Accounts analyzed"
                value={results.length}
                detail="Company / CRM records"
                tone="indigo"
              />

              <MetricCard
                label="High account score"
                value={highPriority}
                detail="Strong evidence score"
                tone="violet"
              />

              <MetricCard
                label="Work now"
                value={workNow}
                detail="Immediate sales action"
                tone="emerald"
              />

              <MetricCard
                label="Potential duplicate groups"
                value={duplicateGroups}
                detail={`${duplicateAccounts} account records affected`}
                tone="amber"
              />
            </section>


            <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-500">
                    Sales Actions
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    Action Distribution
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    How the decision engine recommends sales should handle the analyzed accounts.
                  </p>
                </div>

                <p className="text-xs text-slate-400">
                  {results.length} accounts analyzed
                </p>
              </div>

              <div className="mt-7 space-y-5">
                {actionDistribution.map((item) => {
                  const percentage = results.length
                    ? Math.round(
                        (item.count / results.length) * 100
                      )
                    : 0;

                  const width = results.length
                    ? (item.count / results.length) * 100
                    : 0;

                  return (
                    <div key={item.key}>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.badge}`}
                          >
                            {item.label}
                          </span>

                          <span className="text-xs text-slate-400">
                            {percentage}%
                          </span>
                        </div>

                        <span className="text-sm font-semibold text-slate-700">
                          {item.count}
                        </span>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${item.bar}`}
                          style={{
                            width: `${width}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex flex-col gap-5">
                  <div>
                    <h3 className="font-semibold text-slate-950">
                      Priority Queue
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Accounts ranked by recommended sales action first, then account score.
                    </p>
                  </div>

                  <PriorityFilters
                    value={activeFilter}
                    onChange={setActiveFilter}
                    counts={filterCounts}
                  />

                  <QueueControls
                    search={search}
                    onSearchChange={setSearch}
                    sort={sort}
                    onSortChange={setSort}
                  />
                </div>
              </div>


              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {visibleResults.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {results.length}
                </span>{" "}
                accounts
              </div>


              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">
                        Rank
                      </th>

                      <th className="px-6 py-4">
                        Company
                      </th>

                      <th className="px-6 py-4">
                        Account Score
                      </th>

                      <th className="px-6 py-4">
                        ICP
                      </th>

                      <th className="px-6 py-4">
                        Signals
                      </th>

                      <th className="px-6 py-4">
                        CRM
                      </th>

                      <th className="px-6 py-4">
                        Action
                      </th>
                    </tr>
                  </thead>


                  <tbody className="divide-y divide-slate-100">
                    {visibleResults.map(
                      (result) => (
                        <tr
                          key={`${result.rank}-${result.company.name}`}
                          onClick={() =>
                            setSelectedResult(
                              result
                            )
                          }
                          className="group cursor-pointer transition hover:bg-indigo-50/40"
                        >
                          <td
                            className={`border-l-4 px-6 py-5 font-medium text-slate-500 ${actionBorderClass(
                              result.recommended_action
                            )}`}
                          >
                            #{result.rank}
                          </td>

                          <td className="px-6 py-5">
                            <div className="font-semibold text-slate-950 transition group-hover:text-indigo-700">
                              {
                                result.company
                                  .name
                              }
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {result.company
                                .domain ??
                                "No domain"}
                            </div>

                            {result.potential_duplicate && (
                              <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                                Potential Duplicate ·{" "}
                                {result.duplicate_group_size} records
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <ScoreBadge
                              score={
                                result.priority_score
                              }
                            />
                          </td>

                          <td className="px-6 py-5">
                            <IcpBadge
                              score={result.icp_score}
                              fitLevel={result.fit_level}
                            />
                          </td>

                          <td className="px-6 py-5 text-slate-700">
                            {
                              result.signal_score
                            }
                          </td>

                          <td className="px-6 py-5">
                            <CrmBadge
                              status={
                                result.crm_status
                              }
                            />
                          </td>

                          <td className="px-6 py-5">
                            <ActionBadge
                              action={
                                result.recommended_action
                              }
                            />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>


                {visibleResults.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <p className="font-medium text-slate-700">
                      No accounts match your current search or filter.
                    </p>

                    <button
                      onClick={() => {
                        setActiveFilter("all");
                        setSearch("");
                      }}
                      className="mt-3 text-sm font-medium text-slate-500 underline"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>


      {showDemoPicker && (
        <DemoDatasetPicker
          onClose={() =>
            setShowDemoPicker(false)
          }
          onSelect={(sample) => {
            setSelectedSample(sample);
            setShowDemoPicker(false);
            setShowUpload(true);
          }}
        />
      )}

      {showUpload && (
        <CsvUploadPanel
          initialSample={selectedSample}
          onClose={() => {
            setShowUpload(false);
            setSelectedSample(null);
          }}
          onAnalysisComplete={async (
            newAnalysis
          ) => {
            setAnalysis(newAnalysis);
            setSelectedResult(null);
            resetQueueControls();
            setError(null);


          }}
        />
      )}


      {showHistory && (
        <AnalysisHistoryPanel
          runs={history}
          activeRunId={
            analysis?.id ?? null
          }
          loadingRunId={loadingRunId}
          onSelect={handleHistorySelect}
          onClose={() =>
            setShowHistory(false)
          }
        />
      )}


      {selectedResult && (
        <CompanyDetailPanel
          result={selectedResult}
          onClose={() =>
            setSelectedResult(null)
          }
        />
      )}
    </main>
  );
}


function MetricCard({
  label,
  value,
  detail,
  tone = "indigo",
}: {
  label: string;
  value: number;
  detail?: string;
  tone?: "indigo" | "violet" | "emerald" | "amber";
}) {
  const styles = {
    indigo: {
      card: "border-indigo-100 bg-gradient-to-br from-white to-indigo-50/80",
      label: "text-indigo-500",
      value: "text-indigo-950",
      accent: "bg-indigo-500",
    },
    violet: {
      card: "border-violet-100 bg-gradient-to-br from-white to-violet-50/80",
      label: "text-violet-500",
      value: "text-violet-950",
      accent: "bg-violet-500",
    },
    emerald: {
      card: "border-emerald-100 bg-gradient-to-br from-white to-emerald-50/80",
      label: "text-emerald-600",
      value: "text-emerald-950",
      accent: "bg-emerald-500",
    },
    amber: {
      card: "border-amber-100 bg-gradient-to-br from-white to-amber-50/80",
      label: "text-amber-600",
      value: "text-amber-950",
      accent: "bg-amber-500",
    },
  };

  const selected = styles[tone];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${selected.card}`}
    >
      <div
        className={`absolute left-0 top-0 h-1 w-full ${selected.accent}`}
      />

      <p
        className={`text-xs font-semibold uppercase tracking-[0.14em] ${selected.label}`}
      >
        {label}
      </p>

      <p
        className={`mt-4 text-3xl font-semibold tracking-tight ${selected.value}`}
      >
        {value}
      </p>

      {detail && (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {detail}
        </p>
      )}
    </div>
  );
}


function IcpBadge({
  score,
  fitLevel,
}: {
  score: number;
  fitLevel: string;
}) {
  if (fitLevel === "not_configured") {
    return (
      <span className="text-slate-400">
        —
      </span>
    );
  }

  let label = "Low Fit";
  let classes =
    "bg-red-50 text-red-700 ring-red-200";

  if (fitLevel === "high") {
    label = "High Fit";
    classes =
      "bg-emerald-50 text-emerald-700 ring-emerald-200";
  } else if (fitLevel === "medium") {
    label = "Medium Fit";
    classes =
      "bg-amber-50 text-amber-700 ring-amber-200";
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${classes}`}
    >
      <span>{score}</span>
      <span>·</span>
      <span>{label}</span>
    </span>
  );
}


function ScoreBadge({
  score,
}: {
  score: number;
}) {
  let classes =
    "bg-slate-100 text-slate-700";

  if (score >= 80) {
    classes =
      "bg-emerald-50 text-emerald-700";
  } else if (score >= 55) {
    classes =
      "bg-amber-50 text-amber-700";
  }

  return (
    <span
      className={`inline-flex min-w-12 justify-center rounded-full px-3 py-1 font-semibold ${classes}`}
    >
      {score}
    </span>
  );
}


function actionBorderClass(
  action: string
) {
  if (action === "work_now") {
    return "border-emerald-500";
  }

  if (action === "continue_opportunity") {
    return "border-blue-500";
  }

  if (action === "expansion") {
    return "border-violet-500";
  }

  if (action === "follow_up_existing") {
    return "border-cyan-500";
  }

  if (action === "research_first") {
    return "border-amber-500";
  }

  if (action === "nurture") {
    return "border-fuchsia-400";
  }

  if (action === "pause_outreach") {
    return "border-orange-400";
  }

  return "border-slate-300";
}


function CrmBadge({
  status,
}: {
  status: string;
}) {
  let classes =
    "bg-slate-100 text-slate-700 ring-slate-200";

  if (status === "existing_customer") {
    classes =
      "bg-violet-50 text-violet-700 ring-violet-200";
  } else if (
    status === "open_opportunity"
  ) {
    classes =
      "bg-blue-50 text-blue-700 ring-blue-200";
  } else if (
    status === "existing_lead"
  ) {
    classes =
      "bg-cyan-50 text-cyan-700 ring-cyan-200";
  } else if (
    status === "recently_contacted"
  ) {
    classes =
      "bg-orange-50 text-orange-700 ring-orange-200";
  } else if (
    status === "new_prospect"
  ) {
    classes =
      "bg-slate-50 text-slate-600 ring-slate-200";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${classes}`}
    >
      {formatAction(status)}
    </span>
  );
}


function ActionBadge({
  action,
}: {
  action: string;
}) {
  let classes =
    "bg-slate-100 text-slate-700";

  if (action === "work_now") {
    classes =
      "bg-emerald-50 text-emerald-700";
  } else if (
    action === "research_first"
  ) {
    classes =
      "bg-amber-50 text-amber-700";
  } else if (
    action === "continue_opportunity"
  ) {
    classes =
      "bg-blue-50 text-blue-700";
  } else if (
    action === "expansion"
  ) {
    classes =
      "bg-violet-50 text-violet-700";
  } else if (
    action === "deprioritize"
  ) {
    classes =
      "bg-slate-100 text-slate-500";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes}`}
    >
      {formatAction(action)}
    </span>
  );
}
