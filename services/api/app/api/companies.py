from fastapi import APIRouter, File, HTTPException, UploadFile

from services.api.app.schemas.company import CompanyInput, CompanyNormalized
from services.api.app.schemas.scoring import CompanyScore, ScoreCompanyRequest
from services.api.app.services.company_normalizer import normalize_company
from services.api.app.services.csv_importer import import_companies_from_csv
from services.api.app.services.icp_scorer import score_company

router = APIRouter(
    prefix="/companies",
    tags=["Companies"],
)


@router.post("/", response_model=CompanyNormalized)
def create_company(company: CompanyInput):
    return normalize_company(company)


@router.post("/import")
async def import_companies(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file.")

    content = await file.read()

    try:
        companies = import_companies_from_csv(content)
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Could not read the CSV file.")

    return {
        "imported_count": len(companies),
        "companies": companies,
    }


@router.post("/score", response_model=CompanyScore)
def score_company_endpoint(request: ScoreCompanyRequest):
    return score_company(request.company, request.icp)
