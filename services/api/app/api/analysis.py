from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from services.api.app.core.database import get_db
from services.api.app.integrations.crm.demo_provider import (
    DemoCRMProvider,
)
from services.api.app.integrations.enrichment.demo_snapshot_provider import (
    DemoSnapshotEnrichmentProvider,
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
    AnalysisRunDetail,
    AnalysisRunListResponse,
    AnalysisRunSummary,
    StoredAnalysisResult,
)
from services.api.app.schemas.company import (
    CompanyInput,
    CompanyNormalized,
)
from services.api.app.schemas.scoring import ICPProfile
from services.api.app.services.analysis_pipeline import (
    AnalysisPipeline,
)


router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"],
)


live_analysis_pipeline = AnalysisPipeline(
    crm_provider=DemoCRMProvider(),
    enrichment_provider=WebsiteEnrichmentProvider(),
)


demo_analysis_pipeline = AnalysisPipeline(
    crm_provider=DemoCRMProvider(),
    enrichment_provider=DemoSnapshotEnrichmentProvider(),
)


DEMO_ICP = ICPProfile(
    target_countries=[
        "Germany",
        "Netherlands",
        "United States",
    ],
    target_industries=[
        "Software",
        "SaaS",
        "Artificial Intelligence",
    ],
    min_employees=50,
    max_employees=10000,
)


DEMO_COMPANIES = [
    CompanyInput(
        name="HubSpot",
        website="https://www.hubspot.com",
        country="United States",
        industry="Software",
        employee_count=8000,
        linkedin_url=None,
    ),
    CompanyInput(
        name="Acme GmbH",
        website="https://acme.com",
        country="Germany",
        industry="Software",
        employee_count=120,
        linkedin_url=None,
    ),
    CompanyInput(
        name="Nova AI",
        website="https://nova.ai",
        country="Netherlands",
        industry="Artificial Intelligence",
        employee_count=75,
        linkedin_url=None,
    ),
    CompanyInput(
        name="Example Systems",
        website="https://example.com",
        country="Germany",
        industry="SaaS",
        employee_count=300,
        linkedin_url=None,
    ),
    CompanyInput(
        name="SignalCraft",
        website="https://signalcraft.example",
        country="Germany",
        industry="Software",
        employee_count=180,
        linkedin_url=None,
    ),
    CompanyInput(
        name="BluePeak SaaS",
        website="https://bluepeak.example",
        country="France",
        industry="SaaS",
        employee_count=240,
        linkedin_url=None,
    ),
    CompanyInput(
        name="Legacy Manufacturing Group",
        website="https://legacy.example",
        country="Spain",
        industry="Manufacturing",
        employee_count=25000,
        linkedin_url=None,
    ),
]


@router.post(
    "/run",
    response_model=AnalysisResponse,
)
async def run_analysis(
    request: AnalysisRequest,
    db: Session = Depends(get_db),
):
    results = await live_analysis_pipeline.run(
        companies=request.companies,
        icp=request.icp,
        use_website_enrichment=(
            request.use_website_enrichment
        ),
        crm_contexts=request.crm_contexts,
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


@router.post(
    "/demo",
    response_model=AnalysisResponse,
)
async def run_demo_analysis(
    db: Session = Depends(get_db),
):
    results = await demo_analysis_pipeline.run(
        companies=DEMO_COMPANIES,
        icp=DEMO_ICP,
        use_website_enrichment=True,
    )

    repository = AnalysisRepository(db)

    analysis_run = repository.save_analysis(
        workspace_name="Demo Workspace",
        icp=DEMO_ICP,
        results=results,
    )

    return AnalysisResponse(
        analysis_run_id=analysis_run.id,
        total_companies=len(results),
        results=results,
    )


@router.get(
    "/runs",
    response_model=AnalysisRunListResponse,
)
def list_analysis_runs(
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
):
    repository = AnalysisRepository(db)

    rows = repository.list_analysis_runs(
        limit=limit
    )

    runs = [
        AnalysisRunSummary(
            id=analysis_run.id,
            workspace_name=workspace_name,
            total_companies=total_companies,
            created_at=analysis_run.created_at,
        )
        for analysis_run, workspace_name, total_companies in rows
    ]

    return AnalysisRunListResponse(
        total_runs=len(runs),
        runs=runs,
    )


@router.get(
    "/runs/{run_id}",
    response_model=AnalysisRunDetail,
)
def get_analysis_run(
    run_id: UUID,
    db: Session = Depends(get_db),
):
    repository = AnalysisRepository(db)

    stored = repository.get_analysis_run(
        run_id=run_id
    )

    if not stored:
        raise HTTPException(
            status_code=404,
            detail="Analysis run not found.",
        )

    run_row, result_rows = stored

    analysis_run, workspace_name = run_row

    results = []

    for result, company in result_rows:
        details = result.details or {}

        results.append(
            StoredAnalysisResult(
                company=CompanyNormalized(
                    name=company.name,
                    domain=company.domain,
                    website=company.website,
                    country=company.country,
                    industry=company.industry,
                    employee_count=company.employee_count,
                    linkedin_url=company.linkedin_url,
                ),
                rank=result.rank,
                icp_score=result.icp_score,
                signal_score=result.signal_score,
                priority_score=result.priority_score,
                data_confidence=result.data_confidence,
                fit_level=details.get(
                    "fit_level",
                    "unknown",
                ),
                signal_level=details.get(
                    "signal_level",
                    "unknown",
                ),
                priority_level=details.get(
                    "priority_level",
                    "unknown",
                ),
                confidence_level=details.get(
                    "confidence_level",
                    "unknown",
                ),
                crm_status=result.crm_status,
                crm_source=details.get(
                    "crm_source",
                    "unknown",
                ),
                potential_duplicate=details.get(
                    "potential_duplicate",
                    False,
                ),
                duplicate_group_size=details.get(
                    "duplicate_group_size",
                    1,
                ),
                duplicate_account_names=details.get(
                    "duplicate_account_names",
                    [],
                ),
                recommended_action=(
                    result.recommended_action
                ),
                action_reason=result.action_reason,
                reasons=details.get(
                    "reasons",
                    [],
                ),
                signal_reasons=details.get(
                    "signal_reasons",
                    [],
                ),
                confidence_reasons=details.get(
                    "confidence_reasons",
                    [],
                ),
                enrichment=result.enrichment or {},
            )
        )

    return AnalysisRunDetail(
        id=analysis_run.id,
        workspace_name=workspace_name,
        created_at=analysis_run.created_at,
        icp=analysis_run.icp_config,
        total_companies=len(results),
        results=results,
    )
