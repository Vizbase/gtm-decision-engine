import csv
import io

from services.api.app.schemas.company import CompanyInput, CompanyNormalized
from services.api.app.services.company_normalizer import normalize_company


COLUMN_ALIASES = {
    "name": ["name", "company", "company_name"],
    "website": ["website", "domain", "company_website", "url"],
    "country": ["country", "location", "company_country"],
    "industry": ["industry", "company_industry"],
    "employee_count": ["employee_count", "employees", "headcount"],
    "linkedin_url": ["linkedin_url", "linkedin", "company_linkedin"],
}


def get_value(row: dict, field: str):
    for alias in COLUMN_ALIASES[field]:
        value = row.get(alias)
        if value not in (None, ""):
            return value
    return None


def import_companies_from_csv(content: bytes) -> list[CompanyNormalized]:
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    companies = []

    for row in reader:
        name = get_value(row, "name")

        if not name:
            continue

        employee_count = get_value(row, "employee_count")

        try:
            employee_count = int(employee_count) if employee_count else None
        except ValueError:
            employee_count = None

        company = CompanyInput(
            name=name,
            website=get_value(row, "website"),
            country=get_value(row, "country"),
            industry=get_value(row, "industry"),
            employee_count=employee_count,
            linkedin_url=get_value(row, "linkedin_url"),
        )

        companies.append(normalize_company(company))

    return companies
