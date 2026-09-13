"use client";

import { AnalysisRunSummary } from "@/lib/api";


function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}


export default function AnalysisHistoryPanel({
  runs,
  activeRunId,
  loadingRunId,
  onSelect,
  onClose,
}: {
  runs: AnalysisRunSummary[];
  activeRunId: string | null;
  loadingRunId: string | null;
  onSelect: (runId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Analysis History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Reopen a previously saved analysis.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>


        <div className="space-y-3 p-5">
          {runs.length === 0 && (
            <div className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
              No saved analyses yet.
            </div>
          )}


          {runs.map((run) => {
            const active = run.id === activeRunId;
            const loading = run.id === loadingRunId;

            return (
              <button
                key={run.id}
                onClick={() => onSelect(run.id)}
                disabled={loading}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-slate-950 bg-slate-50"
                    : "border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {run.workspace_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(run.created_at)}
                    </p>
                  </div>

                  {active && (
                    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-medium text-white">
                      Current
                    </span>
                  )}
                </div>

                <div className="mt-4 text-sm text-slate-600">
                  {run.total_companies} account
                  {run.total_companies === 1 ? "" : "s"} analyzed
                </div>

                {loading && (
                  <p className="mt-3 text-xs font-medium text-slate-500">
                    Loading...
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
