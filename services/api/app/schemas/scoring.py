from pydantic import BaseModel, Field
from typing import Optional

from services.api.app.schemas.company import CompanyNormalized


class ICPProfile(BaseModel):
    target_countries: list[str] = []
    target_industries: list[str] = []
    min_employees: Optional[int] = None
    max_employees: Optional[int] = None


class CompanyScore(BaseModel):
    company: CompanyNormalized
    icp_score: int = Field(ge=0, le=100)
    fit_level: str
    reasons: list[str]


class ScoreCompanyRequest(BaseModel):
    company: CompanyNormalized
    icp: ICPProfile
