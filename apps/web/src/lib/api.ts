const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";


export type Company = {
  name: string;
  domain?: string | null;
  website: string | null;
  country: string | null;
  industry: string | null;
  employee_count: number | null;
  linkedin_url: string | null;
};


export type CRMContext = {
  status:
    | "new_prospect"
    | "existing_lead"
    | "existing_customer"
    | "open_opportunity"
    | "recently_contacted";

  owner: string | null;
  opportunity_stage: string | null;
  days_since_last_contact: number | null;
  source: string;
};


export type ColumnMapping = Record<string, string>;


export type AnalysisRunSummary = {
  id: string;
  workspace_name: string;
  total_companies: number;
  created_at: string;
};


export type StoredAnalysisResult = {
  company: Company;

  rank: number;
  icp_score: number;
  signal_score: number;
  priority_score: number;
  data_confidence: number;

  fit_level: string;
  signal_level: string;
  priority_level: string;
  confidence_level: string;

  crm_status: string;
  crm_source: string;

  potential_duplicate: boolean;
  duplicate_group_size: number;
  duplicate_account_names: string[];

  recommended_action: string;
  action_reason: string;

  reasons: string[];
  signal_reasons: string[];
  confidence_reasons: string[];

  enrichment: {
    reachable?: boolean;
    title?: string | null;
    description?: string | null;
    detected_technologies?: string[];
    signal_keywords?: string[];
    hiring_signal?: boolean;
    error?: string | null;
  };
};


export type AnalysisRunDetail = {
  id: string;
  workspace_name: string;
  created_at: string;
  icp: Record<string, unknown>;
  total_companies: number;
  results: StoredAnalysisResult[];
};


export type ICPInput = {
  target_countries: string[];
  target_industries: string[];
  min_employees: number | null;
  max_employees: number | null;
};


export type CsvImportResponse = {
  filename: string;
  headers: string[];
  detected_mapping: ColumnMapping;
  applied_mapping: ColumnMapping;
  available_fields: string[];

  imported_count: number;
  detected_crm_count: number;

  companies: Company[];
  crm_contexts: Record<string, CRMContext>;
};


export async function getAnalysisRuns(): Promise<{
  total_runs: number;
  runs: AnalysisRunSummary[];
}> {
  const response = await fetch(
    `${API_URL}/analysis/runs?limit=20`
  );

  if (!response.ok) {
    throw new Error(
      "Could not load analysis runs"
    );
  }

  return response.json();
}


export async function getAnalysisRun(
  runId: string
): Promise<AnalysisRunDetail> {
  const response = await fetch(
    `${API_URL}/analysis/runs/${runId}`
  );

  if (!response.ok) {
    throw new Error(
      "Could not load analysis run"
    );
  }

  return response.json();
}


export async function uploadCompaniesCsv(
  file: File,
  mapping?: ColumnMapping
): Promise<CsvImportResponse> {
  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  if (mapping) {
    formData.append(
      "column_mapping",
      JSON.stringify(mapping)
    );
  }

  const response = await fetch(
    `${API_URL}/companies/import`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      "CSV import failed"
    );
  }

  return response.json();
}


export async function runAnalysis(
  companies: Company[],
  icp: ICPInput,
  workspaceName = "CSV Workspace",
  crmContexts: Record<
    string,
    CRMContext
  > = {}
) {
  const cleanCompanies =
    companies.map(
      (company) => ({
        name: company.name,
        website: company.website,
        country: company.country,
        industry: company.industry,
        employee_count:
          company.employee_count,
        linkedin_url:
          company.linkedin_url,
      })
    );

  const response = await fetch(
    `${API_URL}/analysis/run`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        workspace_name:
          workspaceName,
        companies:
          cleanCompanies,
        icp,
        crm_contexts:
          crmContexts,
        use_website_enrichment:
          true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Analysis failed"
    );
  }

  return response.json();
}


export async function runDemoAnalysis() {
  const response = await fetch(
    `${API_URL}/analysis/demo`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Demo analysis failed"
    );
  }

  return response.json();
}


export async function checkBackendHealth() {
  const response = await fetch(
    `${API_URL}/health`
  );

  if (!response.ok) {
    throw new Error(
      "Backend is not available"
    );
  }

  return response.json();
}


export { API_URL };
