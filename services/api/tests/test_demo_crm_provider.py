from services.api.app.integrations.crm.demo_provider import DemoCRMProvider
from services.api.app.schemas.company import CompanyNormalized


provider = DemoCRMProvider()


def test_demo_crm_matches_domain():
    company = CompanyNormalized(
        name="Acme GmbH",
        domain="acme.com",
    )

    context = provider.get_context(company)

    assert context.status.value == "open_opportunity"
    assert context.owner == "Anna Keller"


def test_unknown_company_is_new_prospect():
    company = CompanyNormalized(
        name="Unknown Company",
        domain="unknown-example.com",
    )

    context = provider.get_context(company)

    assert context.status.value == "new_prospect"
