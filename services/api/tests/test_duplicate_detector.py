from services.api.app.schemas.company import (
    CompanyNormalized,
)
from services.api.app.services.duplicate_detector import (
    build_duplicate_groups,
)


def test_shared_domain_is_flagged_as_potential_duplicate():
    companies = [
        CompanyNormalized(
            name="Kestrel Digital GmbH",
            domain="kestrel-digital.de",
        ),
        CompanyNormalized(
            name="Kestrel Digital",
            domain="kestrel-digital.de",
        ),
        CompanyNormalized(
            name="Independent Account",
            domain="independent.example",
        ),
    ]

    groups = build_duplicate_groups(
        companies
    )

    assert groups == {
        "kestrel-digital.de": [
            "Kestrel Digital GmbH",
            "Kestrel Digital",
        ]
    }


def test_missing_domains_are_not_duplicate_signals():
    companies = [
        CompanyNormalized(
            name="Company One",
        ),
        CompanyNormalized(
            name="Company Two",
        ),
    ]

    groups = build_duplicate_groups(
        companies
    )

    assert groups == {}
