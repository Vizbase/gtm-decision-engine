from services.api.app.schemas.company import CompanyNormalized
from services.api.app.schemas.crm import CRMContext
from services.api.app.schemas.enrichment import WebsiteEnrichment
from services.api.app.schemas.scoring import CompanyScore, ICPProfile
from services.api.app.services.data_confidence import (
    calculate_data_confidence,
)
from services.api.app.services.decision_engine import make_decision
from services.api.app.services.priority_engine import (
    calculate_priority_score,
)
from services.api.app.services.signal_scorer import (
    calculate_signal_score,
)


def is_icp_configured(icp: ICPProfile) -> bool:
    return bool(
        icp.target_countries
        or icp.target_industries
        or icp.min_employees is not None
        or icp.max_employees is not None
    )


def calculate_icp_fit(
    company: CompanyNormalized,
    icp: ICPProfile,
) -> tuple[int, str, list[str]]:
    configured = is_icp_configured(icp)

    if not configured:
        return (
            0,
            "not_configured",
            [
                "ICP not configured; this account was not filtered or penalized by fit."
            ],
        )

    matched_weight = 0
    configured_weight = 0
    reasons: list[str] = []

    # Country criterion: weight 30
    if icp.target_countries:
        configured_weight += 30

        countries = {
            country.strip().lower()
            for country in icp.target_countries
        }

        if (
            company.country
            and company.country.strip().lower() in countries
        ):
            matched_weight += 30
            reasons.append("Target country match")
        else:
            reasons.append("Country outside target market")

    # Industry criterion: weight 40
    if icp.target_industries:
        configured_weight += 40

        industries = {
            industry.strip().lower()
            for industry in icp.target_industries
        }

        if (
            company.industry
            and company.industry.strip().lower() in industries
        ):
            matched_weight += 40
            reasons.append("Target industry match")
        else:
            reasons.append("Industry outside target ICP")

    # Company-size criterion: weight 30.
    # Only contributes when the user actually configured a range.
    size_configured = (
        icp.min_employees is not None
        or icp.max_employees is not None
    )

    if size_configured:
        configured_weight += 30

        if company.employee_count is None:
            reasons.append(
                "Company size unavailable for ICP comparison"
            )
        else:
            min_ok = (
                icp.min_employees is None
                or company.employee_count >= icp.min_employees
            )

            max_ok = (
                icp.max_employees is None
                or company.employee_count <= icp.max_employees
            )

            if min_ok and max_ok:
                matched_weight += 30
                reasons.append(
                    "Company size within preferred range"
                )
            else:
                reasons.append(
                    "Company size outside preferred range"
                )

    # Normalize against only the criteria that were configured.
    score = (
        round((matched_weight / configured_weight) * 100)
        if configured_weight
        else 0
    )

    if score >= 80:
        fit_level = "high"
    elif score >= 50:
        fit_level = "medium"
    else:
        fit_level = "low"

    return score, fit_level, reasons


def score_company(
    company: CompanyNormalized,
    icp: ICPProfile,
    crm_context: CRMContext | None = None,
    enrichment: WebsiteEnrichment | None = None,
) -> CompanyScore:
    crm_context = crm_context or CRMContext()

    icp_configured = is_icp_configured(icp)

    score, fit_level, reasons = calculate_icp_fit(
        company=company,
        icp=icp,
    )

    data_confidence, confidence_level, confidence_reasons = (
        calculate_data_confidence(company)
    )

    signal_result = calculate_signal_score(enrichment)

    enrichment_available = (
        enrichment is not None
        and enrichment.reachable
    )

    signal_for_priority = (
        signal_result.score
        if enrichment_available
        else None
    )

    priority_score, priority_level = calculate_priority_score(
        icp_score=(
            score
            if icp_configured
            else None
        ),
        signal_score=signal_for_priority,
        data_confidence=data_confidence,
    )

    decision = make_decision(
        icp_score=score,
        data_confidence=data_confidence,
        crm_context=crm_context,
        signal_score=(
            signal_result.score
            if enrichment is not None
            else None
        ),
        enrichment_available=(
            enrichment.reachable
            if enrichment is not None
            else None
        ),
        icp_configured=icp_configured,
    )

    return CompanyScore(
        company=company,
        icp_score=score,
        fit_level=fit_level,
        signal_score=signal_result.score,
        signal_level=signal_result.level,
        priority_score=priority_score,
        priority_level=priority_level,
        data_confidence=data_confidence,
        confidence_level=confidence_level,
        crm_status=crm_context.status.value,
        crm_source=crm_context.source,
        recommended_action=decision.recommended_action.value,
        action_reason=decision.action_reason,
        reasons=reasons,
        signal_reasons=signal_result.reasons,
        confidence_reasons=confidence_reasons,
    )


def score_and_rank_companies(
    companies: list[CompanyNormalized],
    icp: ICPProfile,
    crm_contexts: dict[str, CRMContext] | None = None,
    enrichment_contexts: dict[str, WebsiteEnrichment] | None = None,
) -> list[CompanyScore]:
    crm_contexts = crm_contexts or {}
    enrichment_contexts = enrichment_contexts or {}

    normalized_crm_contexts = {
        domain.lower(): context
        for domain, context in crm_contexts.items()
    }

    normalized_enrichment_contexts = {
        domain.lower(): enrichment
        for domain, enrichment in enrichment_contexts.items()
    }

    scored = []

    for company in companies:
        domain = (company.domain or "").lower()

        crm_context = normalized_crm_contexts.get(
            domain,
            CRMContext(),
        )

        enrichment = normalized_enrichment_contexts.get(
            domain
        )

        scored.append(
            score_company(
                company=company,
                icp=icp,
                crm_context=crm_context,
                enrichment=enrichment,
            )
        )

    scored.sort(
        key=lambda item: (
            item.priority_score,
            item.signal_score,
            item.data_confidence,
            item.icp_score,
        ),
        reverse=True,
    )

    return scored
