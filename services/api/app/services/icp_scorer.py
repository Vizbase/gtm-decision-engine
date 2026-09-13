from services.api.app.schemas.company import CompanyNormalized
from services.api.app.schemas.scoring import CompanyScore, ICPProfile


def score_company(company: CompanyNormalized, icp: ICPProfile) -> CompanyScore:
    score = 0
    reasons = []

    # Country: 30 points
    if company.country and icp.target_countries:
        countries = [c.lower() for c in icp.target_countries]
        if company.country.lower() in countries:
            score += 30
            reasons.append("Target country match")
        else:
            reasons.append("Country outside target market")

    # Industry: 40 points
    if company.industry and icp.target_industries:
        industries = [i.lower() for i in icp.target_industries]
        if company.industry.lower() in industries:
            score += 40
            reasons.append("Target industry match")
        else:
            reasons.append("Industry outside target ICP")

    # Company size: 30 points
    if company.employee_count is not None:
        min_ok = icp.min_employees is None or company.employee_count >= icp.min_employees
        max_ok = icp.max_employees is None or company.employee_count <= icp.max_employees

        if min_ok and max_ok:
            score += 30
            reasons.append("Company size within preferred range")
        else:
            reasons.append("Company size outside preferred range")

    if score >= 80:
        fit_level = "high"
    elif score >= 50:
        fit_level = "medium"
    else:
        fit_level = "low"

    return CompanyScore(
        company=company,
        icp_score=score,
        fit_level=fit_level,
        reasons=reasons,
    )


def score_and_rank_companies(
    companies: list[CompanyNormalized],
    icp: ICPProfile,
):
    scored = [score_company(company, icp) for company in companies]

    scored.sort(
        key=lambda item: item.icp_score,
        reverse=True,
    )

    return scored
