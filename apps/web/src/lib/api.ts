const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";


export type Company = {
  name: string;
  domain?: string | null;
  website: string | null;
  country: string | null;
  industry: string | null;
  employee_count: number | null;
  linkedin_url: string | null;
};


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

  recommended_action: string;
  action_reason: string;
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


export async function getAnalysisRuns() {
  const response = await fetch(
    `${API_URL}/analysis/runs?limit=20`
  );

  if (!response.ok) {
    throw new Error("Could not load analysis runs");
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
    throw new Error("Could not load analysis run");
  }

  return response.json();
}


export async function uploadCompaniesCsv(
  file: File
): Promise<{
  imported_count: number;
  companies: Company[];
}> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/companies/import`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("CSV import failed");
  }

  return response.json();
}


export async function runAnalysis(
  companies: Company[],
  icp: ICPInput,
  workspaceName = "CSV Workspace"
) {
  const cleanCompanies = companies.map((company) => ({
    name: company.name,
    website: company.website,
    country: company.country,
    industry: company.industry,
    employee_count: company.employee_count,
    linkedin_url: company.linkedin_url,
  }));

  const response = await fetch(
    `${API_URL}/analysis/run`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspace_name: workspaceName,
        companies: cleanCompanies,
        icp,
        use_website_enrichment: true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Analysis failed");
  }

  return response.json();
}


export async function runDemoAnalysis() {
  return runAnalysis(
    [
      {
        name: "HubSpot",
        website: "https://www.hubspot.com",
        country: "United States",
        industry: "Software",
        employee_count: 8000,
        linkedin_url: null,
      },
      {
        name: "Acme GmbH",
        website: "acme.com",
        country: "Germany",
        industry: "Software",
        employee_count: 120,
        linkedin_url: null,
      },
      {
        name: "Nova AI",
        website: "nova.ai",
        country: "Netherlands",
        industry: "Artificial Intelligence",
        employee_count: 75,
        linkedin_url: null,
      },
    ],
    {
      target_countries: [
        "Germany",
        "Netherlands",
        "United States",
      ],
      target_industries: [
        "Software",
        "SaaS",
      ],
      min_employees: 50,
      max_employees: 10000,
    },
    "Demo Workspace"
  );
}


export async function checkBackendHealth() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend is not available");
  }

  return response.json();
}


export { API_URL };
