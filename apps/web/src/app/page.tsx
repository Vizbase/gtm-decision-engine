"use client";

import { useEffect, useState } from "react";

import AnalysisHistoryPanel from "@/components/AnalysisHistoryPanel";
import CompanyDetailPanel from "@/components/CompanyDetailPanel";
import CsvUploadPanel from "@/components/CsvUploadPanel";
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
  runDemoAnalysis,
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

  const [runningDemo, setRunningDemo] =
    useState(false);

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


  async function handleDemo() {
    setRunningDemo(true);
    setError(null);
    setSelectedResult(null);
    resetQueueControls();

    try {
      const result = await runDemoAnalysis();

      const detail = await getAnalysisRun(
        result.analysis_run_id
      );

      setAnalysis(detail);

      await refreshHistory();
    } catch {
      setError(
        "The demo analysis could not be completed."
      );
    } finally {
      setRunningDemo(false);
    }
  }


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
    analysis?.workspace_name === "Demo Workspace";


  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">
              GTM Decision Engine
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Turn account data into clear sales priorities.
            </p>
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
              onClick={() =>
                setShowUpload(true)
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Upload CSV
            </button>

            <button
              onClick={handleDemo}
              disabled={runningDemo}
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {runningDemo
                ? "Running..."
                : "Try Demo"}
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

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Account Priority Overview
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {formatDate(
                  analysis.created_at
                )}{" "}
                · Click an account to inspect its recommendation.
              </p>
            </div>


            <DecisionSummary
              results={results}
              isDemo={isDemo}
            />


            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard
                label="Accounts analyzed"
                value={results.length}
              />

              <MetricCard
                label="High account score"
                value={highPriority}
              />

              <MetricCard
                label="Work now"
                value={workNow}
              />

              <MetricCard
                label="Potential duplicate groups"
                value={duplicateGroups}
                detail={`${duplicateAccounts} account records affected`}
              />
            </section>


            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
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
                          className="cursor-pointer transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-5 font-medium text-slate-500">
                            #{result.rank}
                          </td>

                          <td className="px-6 py-5">
                            <div className="font-semibold text-slate-900">
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
                              <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
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

                          <td className="px-6 py-5 text-slate-700">
                            {result.fit_level === "not_configured"
                              ? "—"
                              : result.icp_score}
                          </td>

                          <td className="px-6 py-5 text-slate-700">
                            {
                              result.signal_score
                            }
                          </td>

                          <td className="px-6 py-5">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                              {formatAction(
                                result.crm_status
                              )}
                            </span>
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


      {showUpload && (
        <CsvUploadPanel
          onClose={() =>
            setShowUpload(false)
          }
          onAnalysisComplete={async (
            newAnalysis
          ) => {
            setAnalysis(newAnalysis);
            setSelectedResult(null);
            resetQueueControls();
            setError(null);

            await refreshHistory();
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
}: {
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>

      {detail && (
        <p className="mt-2 text-xs text-slate-400">
          {detail}
        </p>
      )}
    </div>
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
