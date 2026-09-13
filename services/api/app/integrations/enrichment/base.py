from abc import ABC, abstractmethod

from services.api.app.schemas.company import CompanyNormalized
from services.api.app.schemas.enrichment import WebsiteEnrichment


class EnrichmentProvider(ABC):
    @abstractmethod
    async def enrich(
        self,
        company: CompanyNormalized,
    ) -> WebsiteEnrichment:
        raise NotImplementedError
