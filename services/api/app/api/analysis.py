from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from services.api.app.core.database import get_db
from services.api.app.integrations.crm.demo_provider import (
    DemoCRMProvider,
)
from services.api.app.integrations.enrichment.website_provider import (
    WebsiteEnrichmentProvider,
)
from services.api.app.repositories.analysis_repository import (
    AnalysisRepository,
)
from services.api.app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
)
from services.api.app.services.analysis_pipeline import (
    AnalysisPipeline,
)


router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"],
)


analysis_pipeline = AnalysisPipeline(
    crm_provider=DemoCRMProvider(),
    enrichment_provider=WebsiteEnrichmentProvider(),
)


@router.post(
    "/run",
    response_model=AnalysisResponse,
)
async def run_analysis(
    request: AnalysisRequest,
    db: Session = Depends(get_db),
):
    results = await analysis_pipeline.run(
        companies=request.companies,
        icp=request.icp,
        use_website_enrichment=(
            request.use_website_enrichment
        ),
    )

    repository = AnalysisRepository(db)

    analysis_run = repository.save_analysis(
        workspace_name=request.workspace_name,
        icp=request.icp,
        results=results,
    )

    return AnalysisResponse(
        analysis_run_id=analysis_run.id,
        total_companies=len(results),
        results=results,
    )
