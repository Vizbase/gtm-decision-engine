"use client";

import { useEffect, useState } from "react";

import AnalysisHistoryPanel from "@/components/AnalysisHistoryPanel";
import CompanyDetailPanel from "@/components/CompanyDetailPanel";
import CsvUploadPanel from "@/components/CsvUploadPanel";
import PriorityFilters, {
  PriorityFilter,
} from "@/components/PriorityFilters";

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
    setActiveFilter("all");

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
      setActiveFilter("all");
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


  const highPriority =
    filterCounts.high_priority;

  const workNow =
    filterCounts.work_now;


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
              <p className="text-sm font-medium text-slate-500">
                {analysis.workspace_name}
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                Account Priority Overview
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {formatDate(
                  analysis.created_at
                )}{" "}
                · Click an account to inspect its recommendation.
              </p>
            </div>


            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Accounts analyzed"
                value={results.length}
              />

              <MetricCard
                label="High priority"
                value={highPriority}
              />

              <MetricCard
                label="Work now"
                value={workNow}
              />
            </section>


            <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex flex-col gap-5">
                  <div>
                    <h3 className="font-semibold text-slate-950">
                      Priority Queue
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Accounts ranked by fit, signals, and GTM context.
                    </p>
                  </div>

                  <PriorityFilters
                    value={activeFilter}
                    onChange={setActiveFilter}
                    counts={filterCounts}
                  />
                </div>
              </div>


              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-3 text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredResults.length}
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
                        Priority
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
                    {filteredResults.map(
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
                          </td>

                          <td className="px-6 py-5">
                            <ScoreBadge
                              score={
                                result.priority_score
                              }
                            />
                          </td>

                          <td className="px-6 py-5 text-slate-700">
                            {
                              result.icp_score
                            }
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

                          <td className="px-6 py-5 font-medium text-slate-900">
                            {formatAction(
                              result.recommended_action
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>


                {filteredResults.length ===
                  0 && (
                  <div className="px-6 py-12 text-center">
                    <p className="font-medium text-slate-700">
                      No accounts match this filter.
                    </p>

                    <button
                      onClick={() =>
                        setActiveFilter("all")
                      }
                      className="mt-3 text-sm font-medium text-slate-500 underline"
                    >
                      Show all accounts
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
            setActiveFilter("all");
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
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold text-slate-950">
        {value}
      </p>
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
