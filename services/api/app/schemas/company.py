from pydantic import BaseModel
from typing import Optional


class CompanyInput(BaseModel):
    name: str
    website: Optional[str] = None
    country: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    linkedin_url: Optional[str] = None


class CompanyNormalized(BaseModel):
    name: str
    domain: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    linkedin_url: Optional[str] = None
