from fastapi import APIRouter

from services.api.app.schemas.company import CompanyInput, CompanyNormalized
from services.api.app.services.company_normalizer import normalize_company

router = APIRouter(
    prefix="/companies",
    tags=["Companies"],
)


@router.post("/", response_model=CompanyNormalized)
def create_company(company: CompanyInput):
    return normalize_company(company)
