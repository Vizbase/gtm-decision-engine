import json

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    UploadFile,
)

from services.api.app.integrations.crm.demo_provider import (
    DemoCRMProvider,
)
from services.api.app.integrations.enrichment.website_provider import (
    WebsiteEnrichmentProvider,
)
from services.api.app.schemas.company import (
    CompanyInput,
    CompanyNormalized,
)
from services.api.app.schemas.enrichment import (
    CompanyEnrichmentRequest,
    WebsiteEnrichment,
)
from services.api.app.schemas.scoring import (
    BatchScoreRequest,
    BatchScoreResponse,
    CompanyScore,
    RankedCompanyScore,
    ScoreCompanyRequest,
)
from services.api.app.services.company_normalizer import (
    normalize_company,
)
from services.api.app.services.csv_importer import (
    ALL_FIELD_ALIASES,
    detect_column_mapping,
    get_csv_headers,
    import_accounts_from_csv,
)
from services.api.app.services.icp_scorer import (
    score_and_rank_companies,
    score_company,
)

from services.api.app.core.config import get_settings

settings = get_settings()
MAX_CSV_UPLOAD_BYTES = settings.max_csv_upload_bytes
MAX_ANALYSIS_ACCOUNTS = settings.max_analysis_accounts


router = APIRouter(
    prefix="/companies",
    tags=["Companies"],
)


crm_provider = DemoCRMProvider()

website_enrichment_provider = (
    WebsiteEnrichmentProvider()
)


@router.post(
    "/",
    response_model=CompanyNormalized,
)
def create_company(
    company: CompanyInput,
):
    return normalize_company(
        company
    )


@router.post("/import")
async def import_companies(
    file: UploadFile = File(...),
    column_mapping: str | None = Form(
        default=None
    ),
):
    if (
        not file.filename
        or not file.filename.lower().endswith(
            ".csv"
        )
    ):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file.",
        )

    content = await file.read()

    if len(content) > MAX_CSV_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=(
                "CSV file is too large. "
                f"Maximum upload size is "
                f"{MAX_CSV_UPLOAD_BYTES // (1024 * 1024)} MB."
            ),
        )

    try:
        headers = get_csv_headers(
            content
        )

        detected_mapping = (
            detect_column_mapping(
                headers
            )
        )

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail=(
                "Could not read the CSV file."
            ),
        )

    applied_mapping = (
        detected_mapping
    )

    if column_mapping:
        try:
            parsed_mapping = (
                json.loads(
                    column_mapping
                )
            )
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Column mapping must be valid JSON."
                ),
            )

        if not isinstance(
            parsed_mapping,
            dict,
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Column mapping must be an object."
                ),
            )

        valid_fields = set(
            ALL_FIELD_ALIASES.keys()
        )

        valid_headers = set(
            headers
        )

        cleaned_mapping = {}

        for (
            target_field,
            source_column,
        ) in parsed_mapping.items():
            if (
                target_field
                not in valid_fields
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Unknown target field: "
                        f"{target_field}"
                    ),
                )

            if (
                source_column
                in (
                    None,
                    "",
                )
            ):
                continue

            if (
                source_column
                not in valid_headers
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"CSV column not found: "
                        f"{source_column}"
                    ),
                )

            cleaned_mapping[
                target_field
            ] = source_column

        applied_mapping = (
            cleaned_mapping
        )

    try:
        (
            companies,
            crm_contexts,
        ) = import_accounts_from_csv(
            content,
            column_mapping=(
                applied_mapping
            ),
        )

        if not companies:
            raise HTTPException(
                status_code=400,
                detail=(
                    "The CSV did not contain "
                    "any usable accounts."
                ),
            )

        if (
            len(companies)
            > MAX_ANALYSIS_ACCOUNTS
        ):
            raise HTTPException(
                status_code=413,
                detail=(
                    "This public demo supports up to "
                    f"{MAX_ANALYSIS_ACCOUNTS} "
                    "accounts per CSV."
                ),
            )

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail=(
                "Could not read the CSV file."
            ),
        )

    return {
        "filename": file.filename,
        "headers": headers,
        "detected_mapping": (
            detected_mapping
        ),
        "applied_mapping": (
            applied_mapping
        ),
        "available_fields": list(
            ALL_FIELD_ALIASES.keys()
        ),
        "imported_count": len(
            companies
        ),
        "detected_crm_count": len(
            crm_contexts
        ),
        "companies": companies,
        "crm_contexts": (
            crm_contexts
        ),
    }


@router.post(
    "/enrich",
    response_model=WebsiteEnrichment,
)
async def enrich_company(
    request: CompanyEnrichmentRequest,
):
    return (
        await website_enrichment_provider.enrich(
            request.company
        )
    )


@router.post(
    "/score",
    response_model=CompanyScore,
)
def score_company_endpoint(
    request: ScoreCompanyRequest,
):
    crm_context = (
        request.crm_context
        or crm_provider.get_context(
            request.company
        )
    )

    return score_company(
        company=request.company,
        icp=request.icp,
        crm_context=crm_context,
    )


@router.post(
    "/rank",
    response_model=BatchScoreResponse,
)
def rank_companies(
    request: BatchScoreRequest,
):
    crm_contexts = (
        crm_provider.get_contexts(
            request.companies
        )
    )

    crm_contexts.update(
        request.crm_contexts
    )

    scored = score_and_rank_companies(
        companies=request.companies,
        icp=request.icp,
        crm_contexts=crm_contexts,
    )

    ranked = [
        RankedCompanyScore(
            rank=index,
            **item.model_dump(),
        )
        for index, item in enumerate(
            scored,
            start=1,
        )
    ]

    return BatchScoreResponse(
        total_companies=len(
            ranked
        ),
        results=ranked,
    )
