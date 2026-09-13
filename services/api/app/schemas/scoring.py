from typing import Optional

from pydantic import BaseModel, Field

from services.api.app.schemas.company import CompanyNormalized
from services.api.app.schemas.crm import CRMContext


class ICPProfile(BaseModel):
    target_countries: list[str] = Field(default_factory=list)
    target_industries: list[str] = Field(default_factory=list)
    min_employees: Optional[int] = None
    max_employees: Optional[int] = None


class CompanyScore(BaseModel):
    company: CompanyNormalized

    icp_score: int = Field(ge=0, le=100)
    fit_level: str

    data_confidence: int = Field(ge=0, le=100)
    confidence_level: str

    crm_status: str
    crm_source: str

    recommended_action: str
    action_reason: str

    reasons: list[str]
    confidence_reasons: list[str]


class ScoreCompanyRequest(BaseModel):
    company: CompanyNormalized
    icp: ICPProfile
    crm_context: Optional[CRMContext] = None


class BatchScoreRequest(BaseModel):
    companies: list[CompanyNormalized]
    icp: ICPProfile

    # Optional manual CRM overrides.
    # Key = company domain, e.g. "acme.com"
    crm_contexts: dict[str, CRMContext] = Field(default_factory=dict)


class RankedCompanyScore(CompanyScore):
    rank: int


class BatchScoreResponse(BaseModel):
    total_companies: int
    results: list[RankedCompanyScore]
