"use client";

import {
  ChangeEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Company,
  getAnalysisRun,
  ICPInput,
  runAnalysis,
  uploadCompaniesCsv,
} from "@/lib/api";


type Props = {
  onClose: () => void;
  onAnalysisComplete: (
    analysis: Awaited<ReturnType<typeof getAnalysisRun>>
  ) => void;
};


function uniqueValues(
  companies: Company[],
  key: "country" | "industry"
) {
  return Array.from(
    new Set(
      companies
        .map((company) => company[key]?.trim())
        .filter(
          (value): value is string =>
            Boolean(value)
        )
    )
  ).sort((a, b) => a.localeCompare(b));
}


export default function CsvUploadPanel({
  onClose,
  onAnalysisComplete,
}: Props) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [fileName, setFileName] =
    useState("");

  const [useIcp, setUseIcp] =
    useState(false);

  const [selectedCountries, setSelectedCountries] =
    useState<string[]>([]);

  const [selectedIndustries, setSelectedIndustries] =
    useState<string[]>([]);

  const [minEmployees, setMinEmployees] =
    useState("");

  const [maxEmployees, setMaxEmployees] =
    useState("");

  const [loadingFile, setLoadingFile] =
    useState(false);

  const [running, setRunning] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  const countries = useMemo(
    () => uniqueValues(companies, "country"),
    [companies]
  );

  const industries = useMemo(
    () => uniqueValues(companies, "industry"),
    [companies]
  );


  async function handleFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setLoadingFile(true);
    setError(null);

    try {
      const result =
        await uploadCompaniesCsv(file);

      setCompanies(result.companies);
      setFileName(file.name);

      setUseIcp(false);
      setSelectedCountries([]);
      setSelectedIndustries([]);
      setMinEmployees("");
      setMaxEmployees("");
    } catch {
      setError(
        "Could not import this CSV file."
      );
    } finally {
      setLoadingFile(false);
    }
  }


  function toggleValue(
    value: string,
    current: string[],
    setter: (values: string[]) => void
  ) {
    if (current.includes(value)) {
      setter(
        current.filter(
          (item) => item !== value
        )
      );
    } else {
      setter([...current, value]);
    }
  }


  async function handleRunAnalysis() {
    if (!companies.length) {
      setError(
        "Please upload a CSV first."
      );
      return;
    }

    const icp: ICPInput = useIcp
      ? {
          target_countries:
            selectedCountries,
          target_industries:
            selectedIndustries,
          min_employees:
            minEmployees === ""
              ? null
              : Number(minEmployees),
          max_employees:
            maxEmployees === ""
              ? null
              : Number(maxEmployees),
        }
      : {
          target_countries: [],
          target_industries: [],
          min_employees: null,
          max_employees: null,
        };

    setRunning(true);
    setError(null);

    try {
      const result = await runAnalysis(
        companies,
        icp,
        "CSV Workspace"
      );

      const detail =
        await getAnalysisRun(
          result.analysis_run_id
        );

      onAnalysisComplete(detail);
      onClose();
    } catch {
      setError(
        "The analysis could not be completed."
      );
    } finally {
      setRunning(false);
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Analyze your account list
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Every company in the CSV is imported and analyzed.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>


        <div className="space-y-7 p-6">
          <section>
            <h3 className="text-sm font-semibold text-slate-900">
              1. Upload accounts
            </h3>

            <div
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="mt-3 cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-7 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className="hidden"
              />

              <p className="font-medium text-slate-800">
                {loadingFile
                  ? "Reading CSV..."
                  : fileName ||
                    "Choose CSV file"}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                The complete file is kept. ICP never removes accounts.
              </p>
            </div>
          </section>


          {companies.length > 0 && (
            <section>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Imported accounts
                </h3>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                  {companies.length} imported
                </span>
              </div>

              <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">
                        Company
                      </th>
                      <th className="px-4 py-3">
                        Country
                      </th>
                      <th className="px-4 py-3">
                        Industry
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {companies
                      .slice(0, 30)
                      .map((company) => (
                        <tr
                          key={`${company.name}-${company.website}`}
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {company.name}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {company.country ||
                              "—"}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {company.industry ||
                              "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {companies.length > 30 && (
                <p className="mt-2 text-xs text-slate-400">
                  Previewing the first 30 accounts. All {companies.length} will be analyzed.
                </p>
              )}
            </section>
          )}


          {companies.length > 0 && (
            <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
              <div className="flex items-start gap-3">
                <input
                  id="use-icp"
                  type="checkbox"
                  checked={useIcp}
                  onChange={(event) =>
                    setUseIcp(
                      event.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4"
                />

                <label
                  htmlFor="use-icp"
                  className="cursor-pointer"
                >
                  <p className="font-semibold text-slate-900">
                    Use an ICP profile for prioritization
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Optional. All accounts stay in the analysis. ICP only adds fit context to the ranking.
                  </p>
                </label>
              </div>


              {!useIcp && (
                <div className="mt-4 rounded-xl bg-white/80 p-4 text-sm leading-6 text-slate-600">
                  Without an ICP, the engine prioritizes using current signals,
                  CRM context, and data confidence.
                </div>
              )}


              {useIcp && (
                <div className="mt-6 space-y-6">
                  <SelectionGroup
                    title="Target countries"
                    values={countries}
                    selected={
                      selectedCountries
                    }
                    onToggle={(value) =>
                      toggleValue(
                        value,
                        selectedCountries,
                        setSelectedCountries
                      )
                    }
                    onSelectAll={() =>
                      setSelectedCountries(
                        countries
                      )
                    }
                    onClear={() =>
                      setSelectedCountries([])
                    }
                  />

                  <SelectionGroup
                    title="Target industries"
                    values={industries}
                    selected={
                      selectedIndustries
                    }
                    onToggle={(value) =>
                      toggleValue(
                        value,
                        selectedIndustries,
                        setSelectedIndustries
                      )
                    }
                    onSelectAll={() =>
                      setSelectedIndustries(
                        industries
                      )
                    }
                    onClear={() =>
                      setSelectedIndustries([])
                    }
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Preferred company size
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <NumberField
                        label="Minimum employees"
                        value={minEmployees}
                        onChange={
                          setMinEmployees
                        }
                      />

                      <NumberField
                        label="Maximum employees"
                        value={maxEmployees}
                        onChange={
                          setMaxEmployees
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}


          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>


        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-5">
          <p className="hidden text-xs text-slate-400 sm:block">
            {companies.length
              ? `${companies.length} accounts will be analyzed`
              : "Upload a CSV to continue"}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>

            <button
              onClick={
                handleRunAnalysis
              }
              disabled={
                !companies.length ||
                running
              }
              className="rounded-lg bg-slate-950 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running
                ? "Analyzing..."
                : `Analyze ${
                    companies.length ||
                    ""
                  } Accounts`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function SelectionGroup({
  title,
  values,
  selected,
  onToggle,
  onSelectAll,
  onClear,
}: {
  title: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Detected automatically from the uploaded CSV.
          </p>
        </div>

        <div className="flex gap-3 text-xs font-medium">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-indigo-700"
          >
            Select all
          </button>

          <button
            type="button"
            onClick={onClear}
            className="text-slate-500"
          >
            Clear
          </button>
        </div>
      </div>

      {values.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => {
            const active =
              selected.includes(value);

            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  onToggle(value)
                }
                className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          No values detected in this CSV.
        </p>
      )}
    </div>
  );
}


function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-xs font-medium text-slate-600">
        {label}
      </span>

      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400"
      />
    </label>
  );
}
