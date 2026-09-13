from collections import defaultdict

from services.api.app.schemas.company import (
    CompanyNormalized,
)


def build_duplicate_groups(
    companies: list[CompanyNormalized],
) -> dict[str, list[str]]:
    """
    Identify potential duplicate CRM accounts by shared domain.

    This deliberately flags records instead of merging them.
    Multiple legitimate subsidiaries may share a domain, so
    the result must be treated as a review signal only.
    """
    groups: dict[
        str,
        list[str],
    ] = defaultdict(list)

    for company in companies:
        domain = (
            company.domain
            or ""
        ).strip().lower()

        if not domain:
            continue

        groups[domain].append(
            company.name
        )

    return {
        domain: names
        for domain, names
        in groups.items()
        if len(names) > 1
    }
