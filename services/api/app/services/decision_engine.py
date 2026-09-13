from services.api.app.core.decision_policy import (
    HIGH_CONFIDENCE_THRESHOLD,
    HIGH_FIT_THRESHOLD,
    MEDIUM_FIT_THRESHOLD,
)
from services.api.app.schemas.crm import CRMContext, CRMStatus
from services.api.app.schemas.decision import DecisionResult, RecommendedAction


def make_decision(
    icp_score: int,
    data_confidence: int,
    crm_context: CRMContext | None = None,
) -> DecisionResult:
    crm_context = crm_context or CRMContext()

    # CRM context takes priority over normal prospecting logic.
    if crm_context.status == CRMStatus.OPEN_OPPORTUNITY:
        return DecisionResult(
            recommended_action=RecommendedAction.CONTINUE_OPPORTUNITY,
            action_reason=(
                "An active opportunity already exists; continue the current "
                "sales process instead of creating new outbound activity."
            ),
        )

    if crm_context.status == CRMStatus.EXISTING_CUSTOMER:
        return DecisionResult(
            recommended_action=RecommendedAction.EXPANSION,
            action_reason=(
                "This company is already a customer; evaluate it for expansion "
                "or cross-sell opportunities."
            ),
        )

    if crm_context.status == CRMStatus.RECENTLY_CONTACTED:
        return DecisionResult(
            recommended_action=RecommendedAction.PAUSE_OUTREACH,
            action_reason=(
                "The account was contacted recently; avoid duplicate outreach."
            ),
        )

    if crm_context.status == CRMStatus.EXISTING_LEAD:
        if (
            icp_score >= HIGH_FIT_THRESHOLD
            and data_confidence >= HIGH_CONFIDENCE_THRESHOLD
        ):
            return DecisionResult(
                recommended_action=RecommendedAction.FOLLOW_UP_EXISTING,
                action_reason=(
                    "A high-fit lead already exists in the CRM; continue "
                    "working the existing record."
                ),
            )

        if icp_score >= MEDIUM_FIT_THRESHOLD:
            return DecisionResult(
                recommended_action=RecommendedAction.NURTURE,
                action_reason=(
                    "An existing lead has moderate fit; keep it in nurture."
                ),
            )

    # Normal new-prospect logic.
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
