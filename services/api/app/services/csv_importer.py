import csv
import io
import re
from datetime import date, datetime

from services.api.app.schemas.company import (
    CompanyInput,
    CompanyNormalized,
)
from services.api.app.schemas.crm import (
    CRMContext,
    CRMStatus,
)
from services.api.app.services.company_normalizer import (
    normalize_company,
)


COMPANY_COLUMN_ALIASES = {
    "name": [
        "name",
        "company",
        "company_name",
        "account_name",
        "organization_name",
    ],
    "website": [
        "website",
        "domain",
        "company_website",
        "url",
        "account_website",
        "website_url",
    ],
    "country": [
        "country",
        "location",
        "company_country",
        "billing_country",
        "account_country",
    ],
    "industry": [
        "industry",
        "company_industry",
        "account_industry",
    ],
    "employee_count": [
        "employee_count",
        "employees",
        "headcount",
        "number_of_employees",
        "company_size",
    ],
    "linkedin_url": [
        "linkedin_url",
        "linkedin",
        "company_linkedin",
        "linkedin_company_page",
    ],
}


CRM_COLUMN_ALIASES = {
    "lifecycle_stage": [
        "lifecycle_stage",
        "lifecycle",
        "lead_status",
        "account_status",
        "customer_status",
    ],
    "owner": [
        "account_owner",
        "company_owner",
        "owner",
        "record_owner",
        "hubspot_owner",
        "account_owner_name",
    ],
    "opportunity_stage": [
        "deal_stage",
        "opportunity_stage",
        "pipeline_stage",
        "stage",
    ],
    "last_activity_date": [
        "last_activity_date",
        "last_activity",
        "last_contact_date",
        "last_contacted",
        "last_touch_date",
    ],
    "days_since_last_contact": [
        "days_since_last_contact",
        "days_since_last_activity",
    ],
    "source": [
        "source_platform",
        "crm_source",
        "source",
        "platform",
    ],
}


def normalize_header(value: str) -> str:
    value = value.strip().lower()

    value = re.sub(
        r"[^a-z0-9]+",
        "_",
        value,
    )

    return value.strip("_")


def normalize_row(row: dict) -> dict:
    normalized = {}

    for key, value in row.items():
        if key is None:
            continue

        normalized_key = normalize_header(key)

        if isinstance(value, str):
            value = value.strip()

        normalized[normalized_key] = value

    return normalized


def get_value(
    row: dict,
    field: str,
    aliases: dict[str, list[str]],
):
    for alias in aliases[field]:
        value = row.get(alias)

        if value not in (
            None,
            "",
        ):
            return value

    return None


def parse_employee_count(
    value,
) -> int | None:
    if value in (
        None,
        "",
    ):
        return None

    cleaned = (
        str(value)
        .replace(",", "")
        .replace(" ", "")
    )

    try:
        return int(float(cleaned))
    except ValueError:
        return None


def parse_date(
    value,
) -> date | None:
    if not value:
        return None

    text = str(value).strip()

    try:
        return datetime.fromisoformat(
            text.replace(
                "Z",
                "+00:00",
            )
        ).date()
    except ValueError:
        pass

    formats = [
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%d.%m.%Y",
        "%d/%m/%Y",
        "%m/%d/%Y",
    ]

    for date_format in formats:
        try:
            return datetime.strptime(
                text,
                date_format,
            ).date()
        except ValueError:
            continue

    return None


def parse_days_since_contact(
    row: dict,
) -> int | None:
    direct_value = get_value(
        row,
        "days_since_last_contact",
        CRM_COLUMN_ALIASES,
    )

    if direct_value not in (
        None,
        "",
    ):
        try:
            return max(
                int(float(direct_value)),
                0,
            )
        except ValueError:
            pass

    activity_value = get_value(
        row,
        "last_activity_date",
        CRM_COLUMN_ALIASES,
    )

    activity_date = parse_date(
        activity_value
    )

    if activity_date is None:
        return None

    return max(
        (
            date.today()
            - activity_date
        ).days,
        0,
    )


def lifecycle_to_status(
    value,
) -> CRMStatus:
    if not value:
        return CRMStatus.NEW_PROSPECT

    normalized = normalize_header(
        str(value)
    )

    if normalized in {
        "customer",
        "existing_customer",
        "client",
        "evangelist",
    }:
        return CRMStatus.EXISTING_CUSTOMER

    if normalized in {
        "opportunity",
        "open_opportunity",
    }:
        return CRMStatus.OPEN_OPPORTUNITY

    if normalized in {
        "lead",
        "existing_lead",
        "mql",
        "sql",
        "marketing_qualified_lead",
        "sales_qualified_lead",
    }:
        return CRMStatus.EXISTING_LEAD

    if normalized in {
        "recently_contacted",
        "contacted",
    }:
        return CRMStatus.RECENTLY_CONTACTED

    return CRMStatus.NEW_PROSPECT


def deal_stage_status(
    value,
) -> CRMStatus | None:
    if not value:
        return None

    normalized = normalize_header(
        str(value)
    )

    if normalized in {
        "closed_won",
        "won",
    }:
        return CRMStatus.EXISTING_CUSTOMER

    if normalized in {
        "closed_lost",
        "lost",
        "disqualified",
    }:
        return None

    return CRMStatus.OPEN_OPPORTUNITY


def build_crm_context(
    row: dict,
) -> CRMContext | None:
    lifecycle = get_value(
        row,
        "lifecycle_stage",
        CRM_COLUMN_ALIASES,
    )

    owner = get_value(
        row,
        "owner",
        CRM_COLUMN_ALIASES,
    )

    opportunity_stage = get_value(
        row,
        "opportunity_stage",
        CRM_COLUMN_ALIASES,
    )

    source = get_value(
        row,
        "source",
        CRM_COLUMN_ALIASES,
    )

    days_since_last_contact = (
        parse_days_since_contact(row)
    )

    has_crm_data = any(
        value not in (
            None,
            "",
        )
        for value in [
            lifecycle,
            owner,
            opportunity_stage,
            days_since_last_contact,
        ]
    )

    if not has_crm_data:
        return None

    status = lifecycle_to_status(
        lifecycle
    )

    opportunity_status = (
        deal_stage_status(
            opportunity_stage
        )
    )

    if opportunity_status is not None:
        status = opportunity_status

    # CRM hierarchy:
    # open opportunity / customer > recent contact > lead > prospect.
    if (
        status
        not in {
            CRMStatus.OPEN_OPPORTUNITY,
            CRMStatus.EXISTING_CUSTOMER,
        }
        and days_since_last_contact
        is not None
        and days_since_last_contact <= 7
    ):
        status = CRMStatus.RECENTLY_CONTACTED

    return CRMContext(
        status=status,
        owner=(
            str(owner)
            if owner
            else None
        ),
        opportunity_stage=(
            str(opportunity_stage)
            if opportunity_stage
            else None
        ),
        days_since_last_contact=(
            days_since_last_contact
        ),
        source=(
            str(source)
            if source
            else "csv"
        ),
    )


def company_context_key(
    company: CompanyNormalized,
) -> str:
    if company.domain:
        return company.domain.lower()

    if company.website:
        return company.website.lower()

    return company.name.strip().lower()


def import_accounts_from_csv(
    content: bytes,
) -> tuple[
    list[CompanyNormalized],
    dict[str, CRMContext],
]:
    text = content.decode(
        "utf-8-sig"
    )

    reader = csv.DictReader(
        io.StringIO(text)
    )

    companies: list[
        CompanyNormalized
    ] = []

    crm_contexts: dict[
        str,
        CRMContext
    ] = {}

    for raw_row in reader:
        row = normalize_row(
            raw_row
        )

        name = get_value(
            row,
            "name",
            COMPANY_COLUMN_ALIASES,
        )

        if not name:
            continue

        company = CompanyInput(
            name=str(name),
            website=get_value(
                row,
                "website",
                COMPANY_COLUMN_ALIASES,
            ),
            country=get_value(
                row,
                "country",
                COMPANY_COLUMN_ALIASES,
            ),
            industry=get_value(
                row,
                "industry",
                COMPANY_COLUMN_ALIASES,
            ),
            employee_count=(
                parse_employee_count(
                    get_value(
                        row,
                        "employee_count",
                        COMPANY_COLUMN_ALIASES,
                    )
                )
            ),
            linkedin_url=get_value(
                row,
                "linkedin_url",
                COMPANY_COLUMN_ALIASES,
            ),
        )

        normalized_company = (
            normalize_company(
                company
            )
        )

        companies.append(
            normalized_company
        )

        crm_context = (
            build_crm_context(
                row
            )
        )

        if crm_context:
            crm_contexts[
                company_context_key(
                    normalized_company
                )
            ] = crm_context

    return (
        companies,
        crm_contexts,
    )


# Keep the original function available
# for existing callers/tests.
def import_companies_from_csv(
    content: bytes,
) -> list[CompanyNormalized]:
    companies, _ = (
        import_accounts_from_csv(
            content
        )
    )

    return companies
