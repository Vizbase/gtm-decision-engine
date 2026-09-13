from services.api.app.core.decision_policy import (
    HIGH_CONFIDENCE_THRESHOLD,
    HIGH_FIT_THRESHOLD,
    MEDIUM_FIT_THRESHOLD,
)
from services.api.app.schemas.decision import DecisionResult, RecommendedAction


def make_decision(icp_score: int, data_confidence: int) -> DecisionResult:
    if icp_score >= HIGH_FIT_THRESHOLD:
        if data_confidence >= HIGH_CONFIDENCE_THRESHOLD:
            return DecisionResult(
                recommended_action=RecommendedAction.WORK_NOW,
                action_reason="Strong ICP fit with high-confidence data.",
            )

        return DecisionResult(
            recommended_action=RecommendedAction.RESEARCH_FIRST,
            action_reason="Strong ICP fit, but more reliable data is needed.",
        )

    if icp_score >= MEDIUM_FIT_THRESHOLD:
        return DecisionResult(
            recommended_action=RecommendedAction.NURTURE,
            action_reason="Moderate ICP fit; keep the account in consideration.",
        )

    return DecisionResult(
        recommended_action=RecommendedAction.DEPRIORITIZE,
        action_reason="Low ICP fit compared with the current target profile.",
    )
