from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from services.api.app.schemas.company import (
    CompanyInput,
    CompanyNormalized,
)
from services.api.app.schemas.enrichment import WebsiteEnrichment
from services.api.app.schemas.scoring import CompanyScore, ICPProfile


class AnalysisRequest(BaseModel):
    companies: list[CompanyInput]
    icp: ICPProfile
    workspace_name: str = "Demo Workspace"
    use_website_enrichment: bool = True


class CompanyAnalysisResult(CompanyScore):
    rank: int
    enrichment: WebsiteEnrichment


class AnalysisResponse(BaseModel):
    analysis_run_id: Optional[UUID] = None
    total_companies: int
    results: list[CompanyAnalysisResult] = Field(default_factory=list)


class AnalysisRunSummary(BaseModel):
    id: UUID
    workspace_name: str
    total_companies: int
    created_at: datetime


class AnalysisRunListResponse(BaseModel):
    total_runs: int
    runs: list[AnalysisRunSummary]


class StoredAnalysisResult(BaseModel):
    company: CompanyNormalized

    rank: int
    icp_score: int
    signal_score: int
    priority_score: int
    data_confidence: int

    fit_level: str
    signal_level: str
    priority_level: str
    confidence_level: str

    crm_status: str
    crm_source: str

    recommended_action: str
    action_reason: str

    reasons: list[str]
    signal_reasons: list[str]
    confidence_reasons: list[str]

    enrichment: dict


class AnalysisRunDetail(BaseModel):
    id: UUID
    workspace_name: str
    created_at: datetime
    icp: dict
    total_companies: int
    results: list[StoredAnalysisResult]
