import asyncio

from services.api.app.integrations.enrichment.sample_signal_provider import (
    SampleSignalEnrichmentProvider,
)
from services.api.app.schemas.company import (
    CompanyNormalized,
)
from services.api.app.services.signal_scorer import (
    calculate_signal_score,
)


def enrich(
    provider: SampleSignalEnrichmentProvider,
    company: CompanyNormalized,
):
    return asyncio.run(
        provider.enrich(company)
    )


def test_sample_signal_provider_is_deterministic():
    provider = SampleSignalEnrichmentProvider(
        dataset_id="salesforce"
    )

    company = CompanyNormalized(
        name="Example Account",
        domain="example-account.test",
        website="https://example-account.test",
    )

    first = enrich(
        provider,
        company,
    )

    second = enrich(
        provider,
        company,
    )

    assert first == second
    assert first.source == "sample_signal"


def test_sample_signal_provider_creates_varied_scores():
    provider = SampleSignalEnrichmentProvider(
        dataset_id="hubspot"
    )

    scores = set()

    for index in range(80):
        company = CompanyNormalized(
            name=f"Sample Account {index}",
            domain=f"sample-{index}.test",
        )

        enrichment = enrich(
            provider,
            company,
        )

        score = calculate_signal_score(
            enrichment
        ).score

        scores.add(score)

    assert len(scores) >= 5
    assert max(scores) >= 70
    assert min(scores) == 0
