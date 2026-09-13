from services.api.app.core.decision_policy import (
    HIGH_CONFIDENCE_THRESHOLD,
    HIGH_FIT_THRESHOLD,
    MEDIUM_FIT_THRESHOLD,
)
from services.api.app.core.priority_policy import (
    HIGH_PRIORITY_THRESHOLD,
    MEDIUM_PRIORITY_THRESHOLD,
)
from services.api.app.schemas.crm import CRMContext, CRMStatus
from services.api.app.schemas.decision import (
    DecisionResult,
    RecommendedAction,
)
from services.api.app.services.priority_engine import (
    calculate_priority_score,
)


def make_decision(
    icp_score: int,
    data_confidence: int,
    crm_context: CRMContext | None = None,
    signal_score: int | None = None,
    enrichment_available: bool | None = None,
    icp_configured: bool = True,
) -> DecisionResult:
    crm_context = crm_context or CRMContext()

    # CRM context always has the highest priority.
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

    # When no ICP has been configured, do not interpret
    # the absence of an ICP score as poor account fit.
    if not icp_configured:
        priority_score, _ = calculate_priority_score(
            icp_score=None,
            signal_score=(
                signal_score
                if enrichment_available is not False
                else None
            ),
            data_confidence=data_confidence,
        )

        if crm_context.status == CRMStatus.EXISTING_LEAD:
            if (
                priority_score >= HIGH_PRIORITY_THRESHOLD
                and data_confidence >= HIGH_CONFIDENCE_THRESHOLD
            ):
                return DecisionResult(
                    recommended_action=RecommendedAction.FOLLOW_UP_EXISTING,
                    action_reason=(
                        "An existing CRM lead has strong current signals "
                        "and reliable data; continue working the existing record."
                    ),
                )

            return DecisionResult(
                recommended_action=RecommendedAction.NURTURE,
                action_reason=(
                    "An existing CRM lead is present, but no ICP profile "
                    "has been configured to evaluate account fit."
                ),
            )

        if enrichment_available is False or signal_score is None:
            return DecisionResult(
                recommended_action=RecommendedAction.RESEARCH_FIRST,
                action_reason=(
                    "No ICP profile is configured and current buying signals "
                    "could not be verified; research the account before outreach."
                ),
            )

        if (
            priority_score >= HIGH_PRIORITY_THRESHOLD
            and data_confidence >= HIGH_CONFIDENCE_THRESHOLD
        ):
            return DecisionResult(
                recommended_action=RecommendedAction.WORK_NOW,
                action_reason=(
                    "Strong current account signals with high-confidence data."
                ),
            )

        return DecisionResult(
            recommended_action=RecommendedAction.NURTURE,
            action_reason=(
                "No ICP profile is configured; keep the account in consideration "
                "until stronger timing signals or targeting criteria are available."
            ),
        )

    # Existing-lead behavior when ICP is configured.
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

    # Backward-compatible behavior when enrichment was not used.
    if signal_score is None:
        if icp_score >= HIGH_FIT_THRESHOLD:
            if data_confidence >= HIGH_CONFIDENCE_THRESHOLD:
                return DecisionResult(
                    recommended_action=RecommendedAction.WORK_NOW,
                    action_reason="Strong ICP fit with high-confidence data.",
                )

            return DecisionResult(
                recommended_action=RecommendedAction.RESEARCH_FIRST,
                action_reason=(
                    "Strong ICP fit, but more reliable data is needed."
                ),
            )

        if icp_score >= MEDIUM_FIT_THRESHOLD:
            return DecisionResult(
                recommended_action=RecommendedAction.NURTURE,
                action_reason=(
                    "Moderate ICP fit; keep the account in consideration."
                ),
            )

        return DecisionResult(
            recommended_action=RecommendedAction.DEPRIORITIZE,
            action_reason=(
                "Low ICP fit compared with the current target profile."
            ),
        )

    # Failed enrichment is uncertainty, not proof of poor fit.
    if (
        icp_score >= HIGH_FIT_THRESHOLD
        and enrichment_available is False
    ):
        return DecisionResult(
            recommended_action=RecommendedAction.RESEARCH_FIRST,
            action_reason=(
                "Strong ICP fit, but live enrichment could not verify "
                "current buying or timing signals."
            ),
        )

    priority_score, _ = calculate_priority_score(
        icp_score=icp_score,
        signal_score=signal_score,
        data_confidence=data_confidence,
    )

    if (
        priority_score >= HIGH_PRIORITY_THRESHOLD
        and data_confidence >= HIGH_CONFIDENCE_THRESHOLD
    ):
        return DecisionResult(
            recommended_action=RecommendedAction.WORK_NOW,
            action_reason=(
                "Strong account fit combined with meaningful current signals."
            ),
        )

    if priority_score >= MEDIUM_PRIORITY_THRESHOLD:
        return DecisionResult(
            recommended_action=RecommendedAction.NURTURE,
            action_reason=(
                "The account has potential, but its current priority is "
                "not high enough for immediate outreach."
            ),
        )

    return DecisionResult(
        recommended_action=RecommendedAction.DEPRIORITIZE,
        action_reason=(
            "Account fit and current signals indicate low outbound priority."
        ),
    )
