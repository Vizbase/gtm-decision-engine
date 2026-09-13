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
    account_context_key,
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
        "company_domain_name",
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
        "country_region",
        "account_country",
    ],
    "industry": [
        "industry",
        "gtm_industry",
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
        "linkedin_company_url",
    ],
}


CRM_COLUMN_ALIASES = {
    "lifecycle_stage": [
        "lifecycle_stage",
        "lifecycle",
        "lead_status",
        "account_status",
        "customer_status",
        "account_type",
        "type",
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
        "record_source",
        "account_source",
        "source",
        "platform",
    ],
}


ALL_FIELD_ALIASES = {
    **COMPANY_COLUMN_ALIASES,
    **CRM_COLUMN_ALIASES,
}


def normalize_header(value: str) -> str:
    value = value.strip().lower()

    value = re.sub(
        r"[^a-z0-9]+",
        "_",
        value,
    )

    return value.strip("_")


def detect_delimiter(
    content: bytes,
) -> str:
    text = content.decode(
        "utf-8-sig"
    )

    sample = text[:10000]

    try:
        dialect = csv.Sniffer().sniff(
            sample,
            delimiters=",;\t|",
        )

        return dialect.delimiter

    except csv.Error:
        return ","


def build_reader(
    content: bytes,
) -> csv.DictReader:
    text = content.decode(
        "utf-8-sig"
    )

    delimiter = detect_delimiter(
        content
    )

    return csv.DictReader(
        io.StringIO(text),
        delimiter=delimiter,
    )


def get_csv_headers(
    content: bytes,
) -> list[str]:
    reader = build_reader(
        content
    )

    return [
        header
        for header in (
            reader.fieldnames or []
        )
        if header
    ]


def detect_column_mapping(
    headers: list[str],
) -> dict[str, str]:
    normalized_headers = {
        normalize_header(header):
            header
        for header in headers
    }

    mapping = {}

    for field, aliases in (
        ALL_FIELD_ALIASES.items()
    ):
        for alias in aliases:
            normalized_alias = (
                normalize_header(alias)
            )

            if (
                normalized_alias
                in normalized_headers
            ):
                mapping[field] = (
                    normalized_headers[
                        normalized_alias
                    ]
                )

                break

    return mapping


def normalize_row(
    row: dict,
) -> dict:
    normalized = {}

    for key, value in row.items():
        if key is None:
            continue

        normalized_key = (
            normalize_header(key)
        )

        if isinstance(
            value,
            str,
        ):
            value = value.strip()

        normalized[
            normalized_key
        ] = value

    return normalized


def get_mapped_value(
    row: dict,
    field: str,
    mapping: dict[
        str,
        str
    ],
):
    source_column = (
        mapping.get(field)
    )

    if not source_column:
        return None

    normalized_source = (
        normalize_header(
            source_column
        )
    )

    value = row.get(
        normalized_source
    )

    if value in (
        None,
        "",
    ):
        return None

    return value


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
        return int(
            float(cleaned)
        )
    except ValueError:
        return None


def parse_date(
    value,
) -> date | None:
    if not value:
        return None

    text = str(
        value
    ).strip()

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
        "%d.%m.%y",
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
    mapping: dict[
        str,
        str
    ],
) -> int | None:
    direct_value = (
        get_mapped_value(
            row,
            "days_since_last_contact",
            mapping,
        )
    )

    if direct_value not in (
        None,
        "",
    ):
        try:
            return max(
                int(
                    float(
                        direct_value
                    )
                ),
                0,
            )
        except ValueError:
            pass

    activity_value = (
        get_mapped_value(
            row,
            "last_activity_date",
            mapping,
        )
    )

    activity_date = (
        parse_date(
            activity_value
        )
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
        return (
            CRMStatus.NEW_PROSPECT
        )

    normalized = (
        normalize_header(
            str(value)
        )
    )

    if normalized in {
        "customer",
        "existing_customer",
        "client",
        "evangelist",
    }:
        return (
            CRMStatus.EXISTING_CUSTOMER
        )

    if normalized in {
        "opportunity",
        "open_opportunity",
    }:
        return (
            CRMStatus.OPEN_OPPORTUNITY
        )

    if normalized in {
        "lead",
        "existing_lead",
        "mql",
        "sql",
        "marketing_qualified_lead",
        "sales_qualified_lead",
    }:
        return (
            CRMStatus.EXISTING_LEAD
        )

    if normalized in {
        "recently_contacted",
        "contacted",
    }:
        return (
            CRMStatus.RECENTLY_CONTACTED
        )

    return (
        CRMStatus.NEW_PROSPECT
    )


def deal_stage_status(
    value,
) -> CRMStatus | None:
    if not value:
        return None

    normalized = (
        normalize_header(
            str(value)
        )
    )

    if normalized in {
        "closed_won",
        "won",
    }:
        return (
            CRMStatus.EXISTING_CUSTOMER
        )

    if normalized in {
        "closed_lost",
        "lost",
        "disqualified",
    }:
        return None

    return (
        CRMStatus.OPEN_OPPORTUNITY
    )


def build_crm_context(
    row: dict,
    mapping: dict[
        str,
        str
    ],
) -> CRMContext | None:
    lifecycle = (
        get_mapped_value(
            row,
            "lifecycle_stage",
            mapping,
        )
    )

    owner = (
        get_mapped_value(
            row,
            "owner",
            mapping,
        )
    )

    opportunity_stage = (
        get_mapped_value(
            row,
            "opportunity_stage",
            mapping,
        )
    )

    source = (
        get_mapped_value(
            row,
            "source",
            mapping,
        )
    )

    days_since_last_contact = (
        parse_days_since_contact(
            row,
            mapping,
        )
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

    status = (
        lifecycle_to_status(
            lifecycle
        )
    )

    opportunity_status = (
        deal_stage_status(
            opportunity_stage
        )
    )

    if (
        opportunity_status
        is not None
    ):
        status = (
            opportunity_status
        )

    if (
        status
        not in {
            CRMStatus.OPEN_OPPORTUNITY,
            CRMStatus.EXISTING_CUSTOMER,
        }
        and days_since_last_contact
        is not None
        and days_since_last_contact
        <= 7
    ):
        status = (
            CRMStatus.RECENTLY_CONTACTED
        )

    return CRMContext(
        status=status,
        owner=(
            str(owner)
            if owner
            else None
        ),
        opportunity_stage=(
            str(
                opportunity_stage
            )
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
    return account_context_key(
        company
    )


def import_accounts_from_csv(
    content: bytes,
    column_mapping: dict[
        str,
        str
    ]
    | None = None,
) -> tuple[
    list[
        CompanyNormalized
    ],
    dict[
        str,
        CRMContext
    ],
]:
    headers = (
        get_csv_headers(
            content
        )
    )

    mapping = (
        column_mapping
        or detect_column_mapping(
            headers
        )
    )

    reader = build_reader(
        content
    )

    companies = []

    crm_contexts = {}

    for raw_row in reader:
        row = normalize_row(
            raw_row
        )

        name = (
            get_mapped_value(
                row,
                "name",
                mapping,
            )
        )

        if not name:
            continue

        company = CompanyInput(
            name=str(name),

            website=(
                get_mapped_value(
                    row,
                    "website",
                    mapping,
                )
            ),

            country=(
                get_mapped_value(
                    row,
                    "country",
                    mapping,
                )
            ),

            industry=(
                get_mapped_value(
                    row,
                    "industry",
                    mapping,
                )
            ),

            employee_count=(
                parse_employee_count(
                    get_mapped_value(
                        row,
                        "employee_count",
                        mapping,
                    )
                )
            ),

            linkedin_url=(
                get_mapped_value(
                    row,
                    "linkedin_url",
                    mapping,
                )
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
                row,
                mapping,
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


def import_companies_from_csv(
    content: bytes,
) -> list[
    CompanyNormalized
]:
    companies, _ = (
        import_accounts_from_csv(
            content
        )
    )

    return companies
