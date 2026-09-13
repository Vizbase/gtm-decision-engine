from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from services.api.app.schemas.company import CompanyInput
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
    results: list[CompanyAnalysisResult] = Field(
        default_factory=list
    )
