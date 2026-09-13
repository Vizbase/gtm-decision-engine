from urllib.parse import urlparse

from services.api.app.schemas.company import CompanyInput, CompanyNormalized


def clean_text(value: str | None) -> str | None:
    if not value:
        return None

    cleaned = " ".join(value.strip().split())
    return cleaned or None


def normalize_website(value: str | None) -> str | None:
    value = clean_text(value)

    if not value:
        return None

    if not value.startswith(("http://", "https://")):
        value = f"https://{value}"

    return value.rstrip("/")


def extract_domain(website: str | None) -> str | None:
    if not website:
        return None

    parsed = urlparse(website)
    domain = parsed.netloc.lower()

    if domain.startswith("www."):
        domain = domain[4:]

    return domain or None


def normalize_company(company: CompanyInput) -> CompanyNormalized:
    website = normalize_website(company.website)

    return CompanyNormalized(
        name=clean_text(company.name) or company.name,
        domain=extract_domain(website),
        website=website,
        country=clean_text(company.country),
        industry=clean_text(company.industry),
        employee_count=company.employee_count,
        linkedin_url=normalize_website(company.linkedin_url),
    )
