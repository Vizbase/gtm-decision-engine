import json
from functools import lru_cache
from pathlib import Path

from services.api.app.integrations.crm.base import CRMProvider
from services.api.app.schemas.company import CompanyNormalized
from services.api.app.schemas.crm import CRMContext


PROJECT_ROOT = Path(__file__).resolve().parents[5]
DEMO_CRM_PATH = PROJECT_ROOT / "data" / "sample" / "demo_crm.json"


@lru_cache
def load_demo_crm_records() -> dict:
    with DEMO_CRM_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


class DemoCRMProvider(CRMProvider):
    def get_context(self, company: CompanyNormalized) -> CRMContext:
        if not company.domain:
            return CRMContext(source="demo")

        records = load_demo_crm_records()
        record = records.get(company.domain.lower())

        if not record:
            return CRMContext(source="demo")

        return CRMContext(
            **record,
            source="demo",
        )
