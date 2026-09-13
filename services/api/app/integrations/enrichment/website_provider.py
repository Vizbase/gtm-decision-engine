import httpx

from services.api.app.integrations.enrichment.base import EnrichmentProvider
from services.api.app.schemas.company import CompanyNormalized
from services.api.app.schemas.enrichment import WebsiteEnrichment
from services.api.app.services.website_parser import extract_website_signals


class WebsiteEnrichmentProvider(EnrichmentProvider):
    def __init__(self):
        self.timeout = 8.0

        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (compatible; GTMDecisionEngine/0.1; "
                "+portfolio-project)"
            )
        }

    async def enrich(
        self,
        company: CompanyNormalized,
    ) -> WebsiteEnrichment:
        url = company.website

        if not url and company.domain:
            url = f"https://{company.domain}"

        if not url:
            return WebsiteEnrichment(
                reachable=False,
                error="No website or domain available.",
            )

        try:
            async with httpx.AsyncClient(
                follow_redirects=True,
                timeout=self.timeout,
                headers=self.headers,
            ) as client:
                response = await client.get(url)

            if response.status_code >= 400:
                return WebsiteEnrichment(
                    requested_url=url,
                    final_url=str(response.url),
                    reachable=False,
                    status_code=response.status_code,
                    error=f"Website returned HTTP {response.status_code}.",
                )

            html = response.text[:2_000_000]

            signals = extract_website_signals(html)

            return WebsiteEnrichment(
                requested_url=url,
                final_url=str(response.url),
                reachable=True,
                status_code=response.status_code,
                **signals,
            )

        except httpx.RequestError as exc:
            return WebsiteEnrichment(
                requested_url=url,
                reachable=False,
                error=f"Website request failed: {exc.__class__.__name__}",
            )
