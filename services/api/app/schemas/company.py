from pydantic import BaseModel, HttpUrl
from typing import Optional


class CompanyInput(BaseModel):
    name: str
    website: Optional[HttpUrl] = None
    country: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    linkedin_url: Optional[HttpUrl] = None
