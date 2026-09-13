from services.api.app.schemas.crm import CRMStatus
from services.api.app.services.csv_importer import (
    company_context_key,
    import_accounts_from_csv,
)


def test_same_domain_accounts_keep_separate_crm_contexts():
    csv_content = """Account Name;Type;Website
Kestrel Digital GmbH;Prospect;kestrel-digital.de
Kestrel Digital;Customer;http://kestrel-digital.de
""".encode("utf-8")

    companies, crm_contexts = import_accounts_from_csv(
        csv_content
    )

    assert len(companies) == 2

    assert companies[0].name == "Kestrel Digital GmbH"
    assert companies[1].name == "Kestrel Digital"

    assert companies[0].domain == "kestrel-digital.de"
    assert companies[1].domain == "kestrel-digital.de"

    first_key = company_context_key(
        companies[0]
    )
    second_key = company_context_key(
        companies[1]
    )

    assert first_key != second_key
    assert len(crm_contexts) == 2

    assert (
        crm_contexts[first_key].status
        == CRMStatus.NEW_PROSPECT
    )

    assert (
        crm_contexts[second_key].status
        == CRMStatus.EXISTING_CUSTOMER
    )
