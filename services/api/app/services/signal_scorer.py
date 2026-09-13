from services.api.app.schemas.enrichment import WebsiteEnrichment
from services.api.app.schemas.signal import SignalScore


def calculate_signal_score(
    enrichment: WebsiteEnrichment | None,
) -> SignalScore:
    if enrichment is None:
        return SignalScore(
            score=0,
            level="unknown",
            reasons=["No enrichment data available"],
        )

    if not enrichment.reachable:
        return SignalScore(
            score=0,
            level="unknown",
            reasons=["Website enrichment was not available"],
        )

    score = 0
    reasons = []

    # Strong timing signal
    if enrichment.hiring_signal:
        score += 50
        reasons.append("Active hiring signal detected")

    # Technology signals: up to 30 points
    technology_points = min(
        len(enrichment.detected_technologies) * 10,
        30,
    )

    if technology_points:
        score += technology_points
        reasons.append(
            f"{len(enrichment.detected_technologies)} technology signals detected"
        )

    # Other website signals: up to 20 points
    keyword_points = min(
        len(enrichment.signal_keywords) * 10,
        20,
    )

    if keyword_points:
        score += keyword_points
        reasons.append(
            f"{len(enrichment.signal_keywords)} business signals detected"
        )

    score = min(score, 100)

    if score >= 70:
        level = "high"
    elif score >= 40:
        level = "medium"
    else:
        level = "low"

    if not reasons:
        reasons.append("No strong timing signals detected")

    return SignalScore(
        score=score,
        level=level,
        reasons=reasons,
    )
