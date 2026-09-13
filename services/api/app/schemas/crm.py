from enum import Enum
from typing import Optional

from pydantic import BaseModel


class CRMStatus(str, Enum):
    NEW_PROSPECT = "new_prospect"
    EXISTING_LEAD = "existing_lead"
    EXISTING_CUSTOMER = "existing_customer"
    OPEN_OPPORTUNITY = "open_opportunity"
    RECENTLY_CONTACTED = "recently_contacted"


class CRMContext(BaseModel):
    status: CRMStatus = CRMStatus.NEW_PROSPECT
    owner: Optional[str] = None
    opportunity_stage: Optional[str] = None
    days_since_last_contact: Optional[int] = None
    source: str = "demo"
