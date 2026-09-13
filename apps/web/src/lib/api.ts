const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";


export type AnalysisRunSummary = {
  id: string;
  workspace_name: string;
  total_companies: number;
  created_at: string;
};


export type StoredAnalysisResult = {
  company: {
    name: string;
    domain: string | null;
    website: string | null;
    country: string | null;
    industry: string | null;
    employee_count: number | null;
    linkedin_url: string | null;
  };

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


export async function getAnalysisRuns() {
  const response = await fetch(`${API_URL}/analysis/runs?limit=20`);

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


export async function checkBackendHealth() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend is not available");
  }

  return response.json();
}


export { API_URL };
