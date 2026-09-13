from fastapi import APIRouter
from services.api.app.schemas.company import CompanyInput

router = APIRouter(
    prefix="/companies",
    tags=["Companies"],
)


@router.post("/")
def create_company(company: CompanyInput):
    return {
        "status": "received",
        "company": company,
    }
