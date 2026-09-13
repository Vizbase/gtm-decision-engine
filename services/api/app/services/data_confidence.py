from services.api.app.schemas.company import CompanyNormalized


def calculate_data_confidence(company: CompanyNormalized):
    score = 0
    reasons = []

    fields = [
        ("domain", company.domain, 25),
        ("website", company.website, 20),
        ("country", company.country, 15),
        ("industry", company.industry, 20),
        ("employee count", company.employee_count, 15),
        ("LinkedIn URL", company.linkedin_url, 5),
    ]

    for label, value, points in fields:
        if value not in (None, ""):
            score += points
        else:
            reasons.append(f"Missing {label}")

    if score >= 80:
        level = "high"
    elif score >= 50:
        level = "medium"
    else:
        level = "low"

    return score, level, reasons
