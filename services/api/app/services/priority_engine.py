from services.api.app.core.priority_policy import (
    HIGH_PRIORITY_THRESHOLD,
    ICP_WEIGHT,
    MEDIUM_PRIORITY_THRESHOLD,
    SIGNAL_WEIGHT,
)


def calculate_priority_score(
    icp_score: int | None,
    signal_score: int | None = None,
    data_confidence: int | None = None,
) -> tuple[int, str]:
    """
    Priority strategy:

    With ICP configured:
        - ICP only when signals are unavailable.
        - ICP + signals when live enrichment succeeds.

    Without ICP configured:
        - Use current signals as the main prioritization input.
        - Use data confidence as a smaller supporting input.
        - Missing enrichment is uncertainty, not a negative signal.
    """

    if icp_score is None:
        confidence = data_confidence or 0

        if signal_score is None:
            # No ICP and no verified current signal.
            # Confidence helps order research work, but cannot
            # create a high-priority account by itself.
            priority_score = round(confidence * 0.40)
        else:
            priority_score = round(
                (signal_score * 0.80)
                + (confidence * 0.20)
            )

    elif signal_score is None:
        # Preserve the existing behavior when ICP exists
        # but enrichment is unavailable.
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
