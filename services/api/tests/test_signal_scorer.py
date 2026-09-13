from services.api.app.schemas.enrichment import WebsiteEnrichment
from services.api.app.services.priority_engine import (
    calculate_priority_score,
)
from services.api.app.services.signal_scorer import (
    calculate_signal_score,
)


def test_strong_signal_score():
    enrichment = WebsiteEnrichment(
        reachable=True,
        detected_technologies=[
            "HubSpot",
            "Salesforce",
        ],
        signal_keywords=[
            "careers",
            "jobs",
        ],
        hiring_signal=True,
    )

    result = calculate_signal_score(enrichment)

    assert result.score == 90
    assert result.level == "high"


def test_failed_enrichment_has_unknown_signal():
    enrichment = WebsiteEnrichment(
        reachable=False,
        error="Blocked",
    )

    result = calculate_signal_score(enrichment)

    assert result.score == 0
    assert result.level == "unknown"


def test_priority_combines_icp_and_signal():
    score, level = calculate_priority_score(
        icp_score=100,
        signal_score=80,
    )

    assert score == 95
    assert level == "high"
