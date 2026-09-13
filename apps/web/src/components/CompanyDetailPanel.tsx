"use client";

import { StoredAnalysisResult } from "@/lib/api";


function formatValue(value: string) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}


export default function CompanyDetailPanel({
  result,
  onClose,
}: {
  result: StoredAnalysisResult;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <p className="text-sm text-slate-500">
              Rank #{result.rank}
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              {result.company.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {result.company.domain || "No domain"}
            </p>

            {result.potential_duplicate && (
              <span className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Potential Duplicate
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>


        <div className="space-y-7 p-6">
          <section className="rounded-xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Recommended action
            </p>

            <p className="mt-2 text-xl font-semibold">
              {formatValue(
                result.recommended_action
              )}
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              {result.action_reason}
            </p>
          </section>


          <section>
            <div className="grid grid-cols-2 gap-3">
              <Score
                label="Account Score"
                value={result.priority_score}
              />

              <Score
                label="ICP Fit"
                value={
                  result.fit_level === "not_configured"
                    ? "Not configured"
                    : result.icp_score
                }
              />

              <Score
                label="Signals"
                value={result.signal_score}
              />

              <Score
                label="Data Confidence"
                value={result.data_confidence}
              />
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Account Score summarizes fit, signals, and available data.
              Queue rank and recommended action also consider CRM context.
            </p>
          </section>


          <Section title="Why this company?">
            <ReasonList items={result.reasons} />
          </Section>


          <Section title="Why now?">
            <ReasonList
              items={result.signal_reasons}
            />
          </Section>


          {result.potential_duplicate && (
            <Section title="Data quality">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Potential duplicate CRM accounts
                </p>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                  This domain is used by{" "}
                  {result.duplicate_group_size} account records.
                  Review them before merging or removing anything.
                </p>

                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-amber-700">
                  Accounts sharing this domain
                </p>

                <ul className="mt-2 space-y-1">
                  {result.duplicate_account_names.map(
                    (name, index) => (
                      <li
                        key={`${name}-${index}`}
                        className="text-sm text-amber-900"
                      >
                        • {name}
                      </li>
                    )
                  )}
                </ul>

                <p className="mt-3 text-xs text-amber-700">
                  Shared domain:{" "}
                  {result.company.domain || "Unknown"}
                </p>
              </div>
            </Section>
          )}

          <Section title="CRM context">
            <InfoRow
              label="Status"
              value={formatValue(result.crm_status)}
            />

            <InfoRow
              label="Source"
              value={result.crm_source}
            />
          </Section>


          <Section title="Company information">
            <InfoRow
              label="Country"
              value={result.company.country || "Unknown"}
            />

            <InfoRow
              label="Industry"
              value={result.company.industry || "Unknown"}
            />

            <InfoRow
              label="Employees"
              value={
                result.company.employee_count?.toLocaleString()
                || "Unknown"
              }
            />
          </Section>


          <Section title="Website research">
            <InfoRow
              label="Reachable"
              value={
                result.enrichment?.reachable
                  ? "Yes"
                  : "No"
              }
            />

            {result.enrichment?.detected_technologies?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {result.enrichment.detected_technologies.map(
                  (technology) => (
                    <span
                      key={technology}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {technology}
                    </span>
                  )
                )}
              </div>
            ) : null}

            {result.enrichment?.description && (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {result.enrichment.description}
              </p>
            )}
          </Section>


          {result.confidence_reasons.length > 0 && (
            <Section title="Data gaps">
              <ReasonList
                items={result.confidence_reasons}
              />
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}


function Score({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}


function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-950">
        {title}
      </h3>

      <div className="mt-3">
        {children}
      </div>
    </section>
  );
}


function ReasonList({
  items,
}: {
  items: string[];
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700"
        >
          {item}
        </div>
      ))}
    </div>
  );
}


function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-3 text-sm">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-medium text-slate-900">
        {value}
      </span>
    </div>
  );
}
