from typing import Optional

from pydantic import BaseModel, Field

from services.api.app.schemas.company import CompanyNormalized


class CompanyEnrichmentRequest(BaseModel):
    company: CompanyNormalized


class WebsiteEnrichment(BaseModel):
    source: str = "website"

    requested_url: Optional[str] = None
    final_url: Optional[str] = None

    reachable: bool = False
    status_code: Optional[int] = None

    title: Optional[str] = None
    description: Optional[str] = None

    detected_technologies: list[str] = Field(default_factory=list)
    signal_keywords: list[str] = Field(default_factory=list)

    hiring_signal: bool = False

    error: Optional[str] = None
