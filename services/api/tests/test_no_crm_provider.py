from services.api.app.integrations.crm.no_crm_provider import (
    NoCRMProvider,
)
from services.api.app.schemas.company import CompanyInput
from services.api.app.schemas.crm import CRMStatus
from services.api.app.services.company_normalizer import (
    normalize_company,
)


def test_no_crm_provider_returns_neutral_context():
    company = normalize_company(
        CompanyInput(
            name="Example Company",
            website="https://example.com",
        )
    )

    context = NoCRMProvider().get_context(company)

    assert context.status == CRMStatus.NEW_PROSPECT
    assert context.source == "not_provided"
    assert context.owner is None
    assert context.opportunity_stage is None
    assert context.days_since_last_contact is None


def test_no_crm_provider_builds_contexts_for_domains():
    company = normalize_company(
        CompanyInput(
            name="Example Company",
            website="https://example.com",
        )
    )

    contexts = NoCRMProvider().get_contexts(
        [company]
    )

    assert "example.com" in contexts
    assert contexts["example.com"].source == "not_provided"
