"use client";

import {
  ColumnMapping,
} from "@/lib/api";


const FIELDS = [
  {
    key: "name",
    label: "Company Name",
    required: true,
  },
  {
    key: "website",
    label: "Website / Domain",
  },
  {
    key: "country",
    label: "Country",
  },
  {
    key: "industry",
    label: "Industry",
  },
  {
    key: "employee_count",
    label: "Employees",
  },
  {
    key: "linkedin_url",
    label: "LinkedIn Company URL",
  },
  {
    key: "lifecycle_stage",
    label: "CRM / Lifecycle Status",
  },
  {
    key: "owner",
    label: "Account Owner",
  },
  {
    key: "opportunity_stage",
    label: "Opportunity / Deal Stage",
  },
  {
    key: "last_activity_date",
    label: "Last Activity Date",
  },
  {
    key: "days_since_last_contact",
    label: "Days Since Last Contact",
  },
  {
    key: "source",
    label: "CRM / Source",
  },
];


export default function ColumnMappingPanel({
  headers,
  mapping,
  detectedMapping,
  onChange,
  onApply,
  applying,
}: {
  headers: string[];
  mapping: ColumnMapping;
  detectedMapping: ColumnMapping;
  onChange: (
    field: string,
    sourceColumn: string
  ) => void;
  onApply: () => void;
  applying: boolean;
}) {
  return (
    <section className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5">

      <div className="flex flex-wrap items-start justify-between gap-3">

        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Review column mapping
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            We detected the CSV structure automatically. Correct any mapping before analysis.
          </p>
        </div>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-violet-700">
          {headers.length} CSV columns
        </span>

      </div>


      <div className="mt-5 grid gap-3 md:grid-cols-2">

        {FIELDS.map((field) => {
          const current =
            mapping[field.key] || "";

          const autoDetected =
            detectedMapping[field.key];

          return (
            <label
              key={field.key}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">

                <span className="text-sm font-medium text-slate-800">
                  {field.label}

                  {field.required && (
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  )}
                </span>

                {autoDetected &&
                  current ===
                    autoDetected && (
                  <span className="text-[11px] font-medium text-emerald-600">
                    Auto-detected
                  </span>
                )}

              </div>


              <select
                value={current}
                onChange={(event) =>
                  onChange(
                    field.key,
                    event.target.value
                  )
                }
                className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-400"
              >
                <option value="">
                  Ignore / Not available
                </option>

                {headers.map(
                  (header) => (
                    <option
                      key={header}
                      value={header}
                    >
                      {header}
                    </option>
                  )
                )}
              </select>

            </label>
          );
        })}

      </div>


      {!mapping.name && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Company Name must be mapped before accounts can be imported.
        </div>
      )}


      <div className="mt-5 flex justify-end">

        <button
          type="button"
          onClick={onApply}
          disabled={
            !mapping.name ||
            applying
          }
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {applying
            ? "Applying..."
            : "Apply Mapping"}
        </button>

      </div>

    </section>
  );
}
