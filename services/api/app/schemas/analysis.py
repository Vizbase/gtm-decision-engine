from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
)

from services.api.app.schemas.company import (
    CompanyInput,
    CompanyNormalized,
)
from services.api.app.schemas.crm import (
    CRMContext,
)
from services.api.app.schemas.enrichment import (
    WebsiteEnrichment,
)
from services.api.app.schemas.scoring import (
    CompanyScore,
    ICPProfile,
)


class AnalysisRequest(BaseModel):
    companies: list[CompanyInput]

    icp: ICPProfile = Field(
        default_factory=ICPProfile
    )

    crm_contexts: dict[
        str,
        CRMContext
    ] = Field(
        default_factory=dict
    )

    workspace_name: str = (
        "Demo Workspace"
    )

    use_website_enrichment: bool = True

    enrichment_mode: Literal[
        "live",
        "sample",
    ] = "live"

    sample_dataset_id: Optional[str] = None

    persist: bool = True


class CompanyAnalysisResult(
    CompanyScore
):
    rank: int
    enrichment: WebsiteEnrichment

    potential_duplicate: bool = False
    duplicate_group_size: int = 1
    duplicate_account_names: list[str] = Field(
        default_factory=list
    )


class AnalysisResponse(BaseModel):
    analysis_run_id: Optional[
        UUID
    ] = None

    total_companies: int

    results: list[
        CompanyAnalysisResult
    ] = Field(
        default_factory=list
    )


class AnalysisRunSummary(BaseModel):
    id: UUID
    workspace_name: str
    total_companies: int
    created_at: datetime


class AnalysisRunListResponse(
    BaseModel
):
    total_runs: int
    runs: list[
        AnalysisRunSummary
    ]


class StoredAnalysisResult(
    BaseModel
):
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

    potential_duplicate: bool = False
    duplicate_group_size: int = 1
    duplicate_account_names: list[str] = Field(
        default_factory=list
    )

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

    results: list[
        StoredAnalysisResult
    ]
