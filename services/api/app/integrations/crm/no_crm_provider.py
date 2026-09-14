from services.api.app.integrations.crm.base import CRMProvider
from services.api.app.schemas.company import CompanyNormalized
from services.api.app.schemas.crm import CRMContext


class NoCRMProvider(CRMProvider):
    """Return neutral CRM context when no CRM source is connected."""

    def get_context(
        self,
        company: CompanyNormalized,
    ) -> CRMContext:
        return CRMContext(
            source="not_provided",
        )
