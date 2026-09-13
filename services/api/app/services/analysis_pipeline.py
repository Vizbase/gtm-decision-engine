import asyncio

from services.api.app.integrations.crm.base import (
    CRMProvider,
)
from services.api.app.integrations.enrichment.base import (
    EnrichmentProvider,
)
from services.api.app.schemas.analysis import (
    CompanyAnalysisResult,
)
from services.api.app.schemas.company import (
    CompanyInput,
    CompanyNormalized,
)
from services.api.app.schemas.crm import (
    CRMContext,
)
from services.api.app.schemas.enrichment import (
    WebsiteEnrichment,
)
from services.api.app.schemas.scoring import (
    ICPProfile,
)
from services.api.app.services.company_normalizer import (
    normalize_company,
)
from services.api.app.services.icp_scorer import (
    score_and_rank_companies,
)


def company_key(
    company: CompanyNormalized,
) -> str:
    if company.domain:
        return company.domain.lower()

    if company.website:
        return company.website.lower()

    return company.name.strip().lower()


class AnalysisPipeline:
    def __init__(
        self,
        crm_provider: CRMProvider,
        enrichment_provider: EnrichmentProvider,
    ):
        self.crm_provider = crm_provider
        self.enrichment_provider = (
            enrichment_provider
        )

    async def run(
        self,
        companies: list[
            CompanyInput
        ],
        icp: ICPProfile,
        use_website_enrichment: bool = True,
        crm_contexts: dict[
            str,
            CRMContext
        ]
        | None = None,
    ) -> list[
        CompanyAnalysisResult
    ]:
        normalized_companies = [
            normalize_company(
                company
            )
            for company in companies
        ]

        enrichment_by_company = (
            await self._enrich_companies(
                normalized_companies,
                use_website_enrichment,
            )
        )

        provider_crm_contexts = (
            self.crm_provider.get_contexts(
                normalized_companies
            )
        )

        merged_crm_contexts = {
            key.lower(): value
            for key, value
            in provider_crm_contexts.items()
        }

        for key, value in (
            crm_contexts or {}
        ).items():
            merged_crm_contexts[
                key.lower()
            ] = value

        enrichment_contexts = {
            company.domain.lower():
                enrichment_by_company[
                    company_key(
                        company
                    )
                ]
            for company
            in normalized_companies
            if company.domain
        }

        scored_companies = (
            score_and_rank_companies(
                companies=(
                    normalized_companies
                ),
                icp=icp,
                crm_contexts=(
                    merged_crm_contexts
                ),
                enrichment_contexts=(
                    enrichment_contexts
                ),
            )
        )

        results = []

        for rank, scored in enumerate(
            scored_companies,
            start=1,
        ):
            key = company_key(
                scored.company
            )

            enrichment = (
                enrichment_by_company.get(
                    key,
                    WebsiteEnrichment(
                        reachable=False,
                        error=(
                            "No enrichment result "
                            "available."
                        ),
                    ),
                )
            )

            results.append(
                CompanyAnalysisResult(
                    rank=rank,
                    enrichment=enrichment,
                    **scored.model_dump(),
                )
            )

        return results

    async def _enrich_companies(
        self,
        companies: list[
            CompanyNormalized
        ],
        enabled: bool,
    ) -> dict[
        str,
        WebsiteEnrichment
    ]:
        if not enabled:
            return {
                company_key(
                    company
                ): WebsiteEnrichment(
                    reachable=False,
                    error=(
                        "Website enrichment "
                        "disabled."
                    ),
                )
                for company
                in companies
            }

        tasks = [
            self.enrichment_provider.enrich(
                company
            )
            for company
            in companies
        ]

        enrichment_results = (
            await asyncio.gather(
                *tasks
            )
        )

        return {
            company_key(
                company
            ): enrichment
            for company, enrichment
            in zip(
                companies,
                enrichment_results,
            )
        }
