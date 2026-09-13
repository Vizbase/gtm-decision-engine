import hashlib

from services.api.app.integrations.enrichment.base import (
    EnrichmentProvider,
)
from services.api.app.schemas.company import (
    CompanyNormalized,
)
from services.api.app.schemas.enrichment import (
    WebsiteEnrichment,
)


TECHNOLOGIES = [
    "HubSpot",
    "Salesforce",
    "Intercom",
    "Stripe",
    "Google Analytics",
    "Shopify",
    "Greenhouse",
    "Lever",
]

KEYWORDS = [
    "careers",
    "jobs",
    "hiring",
    "growth",
    "expansion",
]


# These profiles deliberately map to a useful spread
# under the real signal-scoring rules:
#
# 0, 20, 30, 50, 60, 70, 80, 100
SIGNAL_PROFILES = [
    {
        "reachable": False,
        "hiring": False,
        "technologies": 0,
        "keywords": 0,
    },
    {
        "reachable": True,
        "hiring": False,
        "technologies": 2,
        "keywords": 0,
    },
    {
        "reachable": True,
        "hiring": False,
        "technologies": 1,
        "keywords": 2,
    },
    {
        "reachable": True,
        "hiring": True,
        "technologies": 0,
        "keywords": 0,
    },
    {
        "reachable": True,
        "hiring": True,
        "technologies": 1,
        "keywords": 0,
    },
    {
        "reachable": True,
        "hiring": True,
        "technologies": 2,
        "keywords": 0,
    },
    {
        "reachable": True,
        "hiring": True,
        "technologies": 2,
        "keywords": 1,
    },
    {
        "reachable": True,
        "hiring": True,
        "technologies": 3,
        "keywords": 2,
    },
]


def _stable_digest(
    dataset_id: str,
    company: CompanyNormalized,
) -> bytes:
    identity = "|".join(
        [
            dataset_id,
            company.domain or "",
            company.name,
        ]
    )

    return hashlib.sha256(
        identity.encode("utf-8")
    ).digest()


def _rotated_values(
    values: list[str],
    count: int,
    offset: int,
) -> list[str]:
    if count <= 0:
        return []

    return [
        values[
            (offset + index)
            % len(values)
        ]
        for index in range(count)
    ]


class SampleSignalEnrichmentProvider(
    EnrichmentProvider
):
    """
    Stable synthetic enrichment for built-in portfolio
    datasets.

    It does not claim to represent live findings from the
    companies' websites. The normal CSV upload path continues
    to use WebsiteEnrichmentProvider.
    """

    def __init__(
        self,
        dataset_id: str = "sample",
    ):
        self.dataset_id = dataset_id

    async def enrich(
        self,
        company: CompanyNormalized,
    ) -> WebsiteEnrichment:
        digest = _stable_digest(
            self.dataset_id,
            company,
        )

        profile = SIGNAL_PROFILES[
            digest[0]
            % len(SIGNAL_PROFILES)
        ]

        requested_url = (
            company.website
            or (
                f"https://{company.domain}"
                if company.domain
                else None
            )
        )

        if not profile["reachable"]:
            return WebsiteEnrichment(
                source="sample_signal",
                requested_url=requested_url,
                reachable=False,
                error=(
                    "Synthetic sample scenario: "
                    "current signals could not be verified."
                ),
            )

        technology_count = int(
            profile["technologies"]
        )

        keyword_count = int(
            profile["keywords"]
        )

        technologies = _rotated_values(
            TECHNOLOGIES,
            technology_count,
            digest[1],
        )

        keywords = _rotated_values(
            KEYWORDS,
            keyword_count,
            digest[2],
        )

        return WebsiteEnrichment(
            source="sample_signal",
            requested_url=requested_url,
            final_url=requested_url,
            reachable=True,
            status_code=200,
            title=company.name,
            description=(
                "Deterministic synthetic signal snapshot "
                "used for the public portfolio demo."
            ),
            detected_technologies=technologies,
            signal_keywords=keywords,
            hiring_signal=bool(
                profile["hiring"]
            ),
        )
