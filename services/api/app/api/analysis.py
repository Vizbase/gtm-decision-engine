from fastapi import APIRouter

from services.api.app.integrations.crm.demo_provider import DemoCRMProvider
from services.api.app.integrations.enrichment.website_provider import (
    WebsiteEnrichmentProvider,
)
from services.api.app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
)
from services.api.app.services.analysis_pipeline import AnalysisPipeline


router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"],
)


analysis_pipeline = AnalysisPipeline(
    crm_provider=DemoCRMProvider(),
    enrichment_provider=WebsiteEnrichmentProvider(),
)


@router.post("/run", response_model=AnalysisResponse)
async def run_analysis(request: AnalysisRequest):
    results = await analysis_pipeline.run(
        companies=request.companies,
        icp=request.icp,
        use_website_enrichment=request.use_website_enrichment,
    )

    return AnalysisResponse(
        total_companies=len(results),
        results=results,
    )
