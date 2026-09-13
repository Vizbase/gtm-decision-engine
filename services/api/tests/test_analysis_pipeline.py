import pytest

from services.api.app.integrations.crm.base import CRMProvider
from services.api.app.integrations.enrichment.base import EnrichmentProvider
from services.api.app.schemas.company import (
    CompanyInput,
    CompanyNormalized,
)
from services.api.app.schemas.crm import (
    CRMContext,
    CRMStatus,
)
from services.api.app.schemas.enrichment import WebsiteEnrichment
from services.api.app.schemas.scoring import ICPProfile
from services.api.app.services.analysis_pipeline import AnalysisPipeline


class FakeCRMProvider(CRMProvider):
    def get_context(
        self,
        company: CompanyNormalized,
    ) -> CRMContext:
        if company.domain == "acme.com":
            return CRMContext(
                status=CRMStatus.OPEN_OPPORTUNITY,
                source="test",
            )

        return CRMContext(
            status=CRMStatus.NEW_PROSPECT,
            source="test",
        )


class FakeEnrichmentProvider(EnrichmentProvider):
    async def enrich(
        self,
        company: CompanyNormalized,
    ) -> WebsiteEnrichment:
        return WebsiteEnrichment(
            requested_url=company.website,
            final_url=company.website,
            reachable=True,
            status_code=200,
            title=f"{company.name} Website",
            detected_technologies=["HubSpot"],
            signal_keywords=["careers"],
            hiring_signal=True,
        )


@pytest.mark.anyio
async def test_analysis_pipeline():
    pipeline = AnalysisPipeline(
        crm_provider=FakeCRMProvider(),
        enrichment_provider=FakeEnrichmentProvider(),
    )

    companies = [
        CompanyInput(
            name="Acme GmbH",
            website="acme.com",
            country="Germany",
            industry="Software",
            employee_count=120,
        ),
        CompanyInput(
            name="Other Corp",
            website="other.com",
            country="France",
            industry="Retail",
            employee_count=20,
        ),
    ]

    icp = ICPProfile(
        target_countries=["Germany"],
        target_industries=["Software"],
        min_employees=50,
        max_employees=500,
    )

    results = await pipeline.run(
        companies=companies,
        icp=icp,
    )

    assert len(results) == 2

    assert results[0].company.name == "Acme GmbH"
    assert results[0].icp_score == 100
    assert results[0].crm_status == "open_opportunity"
    assert results[0].recommended_action == "continue_opportunity"
    assert results[0].enrichment.hiring_signal is True

    assert results[1].company.name == "Other Corp"
    assert results[1].recommended_action == "deprioritize"
