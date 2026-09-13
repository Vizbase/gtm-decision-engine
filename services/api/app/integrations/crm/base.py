from abc import ABC, abstractmethod

from services.api.app.schemas.company import CompanyNormalized
from services.api.app.schemas.crm import CRMContext


class CRMProvider(ABC):
    @abstractmethod
    def get_context(self, company: CompanyNormalized) -> CRMContext:
        """Return CRM context for one company."""
        raise NotImplementedError

    def get_contexts(
        self,
        companies: list[CompanyNormalized],
    ) -> dict[str, CRMContext]:
        contexts = {}

        for company in companies:
            if not company.domain:
                continue

            contexts[company.domain.lower()] = self.get_context(company)

        return contexts
