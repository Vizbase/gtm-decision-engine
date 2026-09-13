"use client";

import { ChangeEvent, useRef, useState } from "react";

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


function splitValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}


export default function CsvUploadPanel({
  onClose,
  onAnalysisComplete,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [fileName, setFileName] = useState("");

  const [countries, setCountries] = useState("Germany");
  const [industries, setIndustries] = useState("Software, SaaS");
  const [minEmployees, setMinEmployees] = useState("50");
  const [maxEmployees, setMaxEmployees] = useState("1000");

  const [loadingFile, setLoadingFile] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);


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
      const result = await uploadCompaniesCsv(file);

      setCompanies(result.companies);
      setFileName(file.name);
    } catch {
      setError("Could not import this CSV file.");
    } finally {
      setLoadingFile(false);
    }
  }


  async function handleRunAnalysis() {
    if (!companies.length) {
      setError("Please upload a CSV first.");
      return;
    }

    const icp: ICPInput = {
      target_countries: splitValues(countries),
      target_industries: splitValues(industries),
      min_employees:
        minEmployees === ""
          ? null
          : Number(minEmployees),
      max_employees:
        maxEmployees === ""
          ? null
          : Number(maxEmployees),
    };

    setRunning(true);
    setError(null);

    try {
      const result = await runAnalysis(
        companies,
        icp,
        "CSV Workspace"
      );

      const detail = await getAnalysisRun(
        result.analysis_run_id
      );

      onAnalysisComplete(detail);
      onClose();
    } catch {
      setError("The analysis could not be completed.");
    } finally {
      setRunning(false);
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Analyze your company list
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Upload a CSV, define your ICP, then run the decision engine.
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
              1. Upload companies
            </h3>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-7 text-center hover:border-slate-400"
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
                  : fileName || "Choose CSV file"}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Supports common company, CRM, and prospecting export columns.
              </p>
            </div>
          </section>


          {companies.length > 0 && (
            <section>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Imported companies
                </h3>

                <span className="text-sm text-slate-500">
                  {companies.length} companies
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
                    {companies.slice(0, 20).map((company) => (
                      <tr key={`${company.name}-${company.website}`}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {company.name}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {company.country || "—"}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {company.industry || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}


          <section>
            <h3 className="text-sm font-semibold text-slate-900">
              2. Define your ICP
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Target countries"
                value={countries}
                onChange={setCountries}
                placeholder="Germany, Netherlands"
              />

              <Field
                label="Target industries"
                value={industries}
                onChange={setIndustries}
                placeholder="Software, SaaS"
              />

              <Field
                label="Minimum employees"
                value={minEmployees}
                onChange={setMinEmployees}
                type="number"
              />

              <Field
                label="Maximum employees"
                value={maxEmployees}
                onChange={setMaxEmployees}
                type="number"
              />
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Separate multiple countries or industries with commas.
            </p>
          </section>


          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>


        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>

          <button
            onClick={handleRunAnalysis}
            disabled={!companies.length || running}
            className="rounded-lg bg-slate-950 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running
              ? "Analyzing..."
              : "Run Analysis"}
          </button>
        </div>
      </div>
    </div>
  );
}


function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label>
      <span className="text-xs font-medium text-slate-600">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500"
      />
    </label>
  );
}
