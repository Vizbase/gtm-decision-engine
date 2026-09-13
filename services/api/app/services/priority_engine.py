from services.api.app.core.priority_policy import (
    HIGH_PRIORITY_THRESHOLD,
    ICP_WEIGHT,
    MEDIUM_PRIORITY_THRESHOLD,
    SIGNAL_WEIGHT,
)


def calculate_priority_score(
    icp_score: int,
    signal_score: int | None = None,
) -> tuple[int, str]:
    # If enrichment was not run, do not penalize the company.
    if signal_score is None:
        priority_score = icp_score
    else:
        priority_score = round(
            (icp_score * ICP_WEIGHT)
            + (signal_score * SIGNAL_WEIGHT)
        )

    if priority_score >= HIGH_PRIORITY_THRESHOLD:
        level = "high"
    elif priority_score >= MEDIUM_PRIORITY_THRESHOLD:
        level = "medium"
    else:
        level = "low"

    return priority_score, level
