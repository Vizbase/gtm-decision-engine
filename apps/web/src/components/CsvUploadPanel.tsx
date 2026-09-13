"use client";

import {
  ChangeEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import ColumnMappingPanel from "@/components/ColumnMappingPanel";

import {
  ColumnMapping,
  Company,
  CRMContext,
  getAnalysisRun,
  ICPInput,
  runAnalysis,
  uploadCompaniesCsv,
} from "@/lib/api";


type Props = {
  onClose: () => void;

  onAnalysisComplete: (
    analysis: Awaited<
      ReturnType<typeof getAnalysisRun>
    >
  ) => void;
};


function uniqueValues(
  companies: Company[],
  key: "country" | "industry"
) {
  return Array.from(
    new Set(
      companies
        .map(
          (company) =>
            company[key]?.trim()
        )
        .filter(
          (value): value is string =>
            Boolean(value)
        )
    )
  ).sort((a, b) =>
    a.localeCompare(b)
  );
}


function formatStatus(
  value: string
) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}


export default function CsvUploadPanel({
  onClose,
  onAnalysisComplete,
}: Props) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [
    uploadedFile,
    setUploadedFile,
  ] = useState<File | null>(null);

  const [
    companies,
    setCompanies,
  ] = useState<Company[]>([]);

  const [
    crmContexts,
    setCrmContexts,
  ] = useState<
    Record<string, CRMContext>
  >({});

  const [
    detectedCrmCount,
    setDetectedCrmCount,
  ] = useState(0);

  const [
    fileName,
    setFileName,
  ] = useState("");

  const [
    headers,
    setHeaders,
  ] = useState<string[]>([]);

  const [
    detectedMapping,
    setDetectedMapping,
  ] = useState<ColumnMapping>({});

  const [
    mapping,
    setMapping,
  ] = useState<ColumnMapping>({});

  const [
    mappingDirty,
    setMappingDirty,
  ] = useState(false);

  const [
    applyingMapping,
    setApplyingMapping,
  ] = useState(false);

  const [
    useIcp,
    setUseIcp,
  ] = useState(false);

  const [
    selectedCountries,
    setSelectedCountries,
  ] = useState<string[]>([]);

  const [
    selectedIndustries,
    setSelectedIndustries,
  ] = useState<string[]>([]);

  const [
    minEmployees,
    setMinEmployees,
  ] = useState("");

  const [
    maxEmployees,
    setMaxEmployees,
  ] = useState("");

  const [
    loadingFile,
    setLoadingFile,
  ] = useState(false);

  const [
    running,
    setRunning,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);


  const countries = useMemo(
    () =>
      uniqueValues(
        companies,
        "country"
      ),
    [companies]
  );


  const industries = useMemo(
    () =>
      uniqueValues(
        companies,
        "industry"
      ),
    [companies]
  );


  function resetIcp() {
    setUseIcp(false);
    setSelectedCountries([]);
    setSelectedIndustries([]);
    setMinEmployees("");
    setMaxEmployees("");
  }


  function applyImportResult(
    result: Awaited<
      ReturnType<
        typeof uploadCompaniesCsv
      >
    >
  ) {
    setCompanies(
      result.companies
    );

    setCrmContexts(
      result.crm_contexts || {}
    );

    setDetectedCrmCount(
      result.detected_crm_count || 0
    );

    setHeaders(
      result.headers || []
    );
  }


  async function handleFile(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setLoadingFile(true);
    setError(null);

    try {
      const result =
        await uploadCompaniesCsv(
          file
        );

      setUploadedFile(file);
      setFileName(file.name);

      setDetectedMapping(
        result.detected_mapping || {}
      );

      setMapping(
        result.applied_mapping ||
          result.detected_mapping ||
          {}
      );

      setMappingDirty(false);

      applyImportResult(
        result
      );

      resetIcp();

    } catch {
      setError(
        "Could not import this CSV file."
      );

    } finally {
      setLoadingFile(false);
    }
  }


  function handleMappingChange(
    field: string,
    sourceColumn: string
  ) {
    setMapping(
      (current) => {
        const next = {
          ...current,
        };

        if (sourceColumn) {
          next[field] =
            sourceColumn;
        } else {
          delete next[field];
        }

        return next;
      }
    );

    setMappingDirty(true);
  }


  async function handleApplyMapping() {
    if (
      !uploadedFile
    ) {
      return;
    }

    if (
      !mapping.name
    ) {
      setError(
        "Company Name must be mapped."
      );

      return;
    }

    setApplyingMapping(true);
    setError(null);

    try {
      const result =
        await uploadCompaniesCsv(
          uploadedFile,
          mapping
        );

      applyImportResult(
        result
      );

      setMapping(
        result.applied_mapping ||
          mapping
      );

      setMappingDirty(false);

      resetIcp();

    } catch {
      setError(
        "Could not apply this column mapping."
      );

    } finally {
      setApplyingMapping(false);
    }
  }


  function toggleValue(
    value: string,
    current: string[],
    setter: (
      values: string[]
    ) => void
  ) {
    if (
      current.includes(
        value
      )
    ) {
      setter(
        current.filter(
          (item) =>
            item !== value
        )
      );

    } else {
      setter([
        ...current,
        value,
      ]);
    }
  }


  async function handleRunAnalysis() {
    if (
      !companies.length
    ) {
      setError(
        "Please import at least one account."
      );

      return;
    }

    if (
      mappingDirty
    ) {
      setError(
        "Please apply your column mapping before running the analysis."
      );

      return;
    }


    const icp: ICPInput =
      useIcp
        ? {
            target_countries:
              selectedCountries,

            target_industries:
              selectedIndustries,

            min_employees:
              minEmployees === ""
                ? null
                : Number(
                    minEmployees
                  ),

            max_employees:
              maxEmployees === ""
                ? null
                : Number(
                    maxEmployees
                  ),
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
      const result =
        await runAnalysis(
          companies,
          icp,
          "CSV Workspace",
          crmContexts
        );

      const detail =
        await getAnalysisRun(
          result.analysis_run_id
        );

      onAnalysisComplete(
        detail
      );

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

      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">

          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Import and analyze accounts
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Map your CSV structure, preserve CRM context, and rank every account.
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

            <div className="flex items-center justify-between">

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  1. Upload CSV
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  HubSpot, Salesforce, CRM exports, prospecting tools, or custom spreadsheets.
                </p>
              </div>

            </div>


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
                onChange={
                  handleFile
                }
                className="hidden"
              />

              <p className="font-medium text-slate-800">
                {loadingFile
                  ? "Reading CSV..."
                  : fileName ||
                    "Choose CSV file"}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                We will automatically detect likely company and CRM columns.
              </p>

            </div>

          </section>


          {headers.length >
            0 && (
            <ColumnMappingPanel
              headers={headers}
              mapping={mapping}
              detectedMapping={
                detectedMapping
              }
              onChange={
                handleMappingChange
              }
              onApply={
                handleApplyMapping
              }
              applying={
                applyingMapping
              }
            />
          )}


          {mappingDirty && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Mapping changes are waiting to be applied.
            </div>
          )}


          {companies.length >
            0 && (
            <section>

              <div className="flex flex-wrap items-center justify-between gap-3">

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    2. Review imported accounts
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Every imported account will remain in the analysis.
                  </p>
                </div>


                <div className="flex flex-wrap gap-2">

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    {
                      companies.length
                    }{" "}
                    accounts
                  </span>


                  {detectedCrmCount >
                    0 && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                      {
                        detectedCrmCount
                      }{" "}
                      CRM records
                    </span>
                  )}

                </div>

              </div>


              <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-slate-200">

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

                      <th className="px-4 py-3">
                        CRM Status
                      </th>

                      <th className="px-4 py-3">
                        Owner
                      </th>
                    </tr>

                  </thead>


                  <tbody className="divide-y divide-slate-100">

                    {companies
                      .slice(
                        0,
                        30
                      )
                      .map(
                        (
                          company
                        ) => {
                          const key =
                            (
                              company.domain ||
                              company.website ||
                              company.name
                            ).toLowerCase();

                          const crm =
                            crmContexts[
                              key
                            ];

                          return (
                            <tr
                              key={`${company.name}-${company.website}`}
                            >

                              <td className="px-4 py-3">

                                <p className="font-medium text-slate-900">
                                  {
                                    company.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {company.domain ||
                                    "No domain"}
                                </p>

                              </td>


                              <td className="px-4 py-3 text-slate-600">
                                {company.country ||
                                  "—"}
                              </td>


                              <td className="px-4 py-3 text-slate-600">
                                {company.industry ||
                                  "—"}
                              </td>


                              <td className="px-4 py-3">

                                {crm ? (
                                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                    {formatStatus(
                                      crm.status
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">
                                    —
                                  </span>
                                )}

                              </td>


                              <td className="px-4 py-3 text-slate-600">
                                {crm?.owner ||
                                  "—"}
                              </td>

                            </tr>
                          );
                        }
                      )}

                  </tbody>

                </table>

              </div>


              {companies.length >
                30 && (
                <p className="mt-2 text-xs text-slate-400">
                  Previewing the first 30 accounts. All {companies.length} accounts will be analyzed.
                </p>
              )}

            </section>
          )}


          {companies.length >
            0 &&
            detectedCrmCount >
              0 && (
            <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">

              <p className="text-sm font-semibold text-blue-950">
                CRM context will influence the decision
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800/80">
                Existing customers, opportunities, leads, recent activity, owners, and deal stages are preserved when available.
              </p>

            </section>
          )}


          {companies.length >
            0 && (
            <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">

              <div className="flex items-start gap-3">

                <input
                  id="use-icp"
                  type="checkbox"
                  checked={
                    useIcp
                  }
                  onChange={(
                    event
                  ) =>
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
                    3. Use an ICP profile for prioritization
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Optional. ICP influences scoring but never removes accounts.
                  </p>

                </label>

              </div>


              {!useIcp && (
                <div className="mt-4 rounded-xl bg-white/80 p-4 text-sm leading-6 text-slate-600">
                  Without ICP, ranking uses current signals, CRM context, and data confidence.
                </div>
              )}


              {useIcp && (
                <div className="mt-6 space-y-6">

                  <SelectionGroup
                    title="Target countries"
                    values={
                      countries
                    }
                    selected={
                      selectedCountries
                    }
                    onToggle={(
                      value
                    ) =>
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
                      setSelectedCountries(
                        []
                      )
                    }
                  />


                  <SelectionGroup
                    title="Target industries"
                    values={
                      industries
                    }
                    selected={
                      selectedIndustries
                    }
                    onToggle={(
                      value
                    ) =>
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
                      setSelectedIndustries(
                        []
                      )
                    }
                  />


                  <div>

                    <p className="text-sm font-semibold text-slate-900">
                      Preferred company size
                    </p>


                    <div className="mt-3 grid gap-3 sm:grid-cols-2">

                      <NumberField
                        label="Minimum employees"
                        value={
                          minEmployees
                        }
                        onChange={
                          setMinEmployees
                        }
                      />


                      <NumberField
                        label="Maximum employees"
                        value={
                          maxEmployees
                        }
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
              ? `${companies.length} accounts ready for analysis`
              : headers.length
                ? "Review the mapping to import accounts"
                : "Upload a CSV to continue"}

          </p>


          <div className="flex gap-3">

            <button
              onClick={
                onClose
              }
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
                mappingDirty ||
                running ||
                applyingMapping
              }
              className="rounded-lg bg-slate-950 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >

              {running
                ? "Analyzing..."
                : `Analyze ${
                    companies.length || ""
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

  onToggle: (
    value: string
  ) => void;

  onSelectAll:
    () => void;

  onClear:
    () => void;
}) {
  return (
    <div>

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>

          <p className="text-sm font-semibold text-slate-900">
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Values detected from the imported accounts.
          </p>

        </div>


        <div className="flex gap-3 text-xs font-medium">

          <button
            type="button"
            onClick={
              onSelectAll
            }
            className="text-indigo-700"
          >
            Select all
          </button>

          <button
            type="button"
            onClick={
              onClear
            }
            className="text-slate-500"
          >
            Clear
          </button>

        </div>

      </div>


      {values.length ? (

        <div className="mt-3 flex flex-wrap gap-2">

          {values.map(
            (value) => {
              const active =
                selected.includes(
                  value
                );

              return (
                <button
                  key={
                    value
                  }
                  type="button"
                  onClick={() =>
                    onToggle(
                      value
                    )
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
            }
          )}

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

  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label>

      <span className="text-xs font-medium text-slate-600">
        {label}
      </span>

      <input
        type="number"
        min="0"
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400"
      />

    </label>
  );
}
