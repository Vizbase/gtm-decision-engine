import asyncio
from urllib.parse import urljoin

import httpx

from services.api.app.core.config import (
    get_settings,
)
from services.api.app.integrations.enrichment.base import (
    EnrichmentProvider,
)
from services.api.app.schemas.company import (
    CompanyNormalized,
)
from services.api.app.schemas.enrichment import (
    WebsiteEnrichment,
)
from services.api.app.services.url_security import (
    UnsafeWebsiteURL,
    validate_public_http_url,
)
from services.api.app.services.website_parser import (
    extract_website_signals,
)


REDIRECT_STATUS_CODES = {
    301,
    302,
    303,
    307,
    308,
}


class WebsiteEnrichmentProvider(
    EnrichmentProvider
):
    def __init__(self):
        settings = get_settings()

        self.timeout = (
            settings.enrichment_timeout_seconds
        )

        self.max_redirects = (
            settings.max_enrichment_redirects
        )

        self.max_response_bytes = (
            settings.max_enrichment_response_bytes
        )

        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 "
                "(compatible; "
                "GTMDecisionEngine/0.1; "
                "+portfolio-project)"
            )
        }

    async def _validate_url(
        self,
        url: str,
    ) -> str:
        # DNS lookup is blocking, so keep it
        # outside the async event loop.
        return await asyncio.to_thread(
            validate_public_http_url,
            url,
        )

    async def enrich(
        self,
        company: CompanyNormalized,
    ) -> WebsiteEnrichment:
        requested_url = company.website

        if (
            not requested_url
            and company.domain
        ):
            requested_url = (
                f"https://{company.domain}"
            )

        if not requested_url:
            return WebsiteEnrichment(
                reachable=False,
                error=(
                    "No website or domain available."
                ),
            )

        current_url = requested_url

        try:
            async with httpx.AsyncClient(
                follow_redirects=False,
                timeout=self.timeout,
                headers=self.headers,
                trust_env=False,
            ) as client:

                for redirect_index in range(
                    self.max_redirects + 1
                ):
                    await self._validate_url(
                        current_url
                    )

                    async with client.stream(
                        "GET",
                        current_url,
                    ) as response:

                        if (
                            response.status_code
                            in REDIRECT_STATUS_CODES
                        ):
                            location = (
                                response.headers.get(
                                    "location"
                                )
                            )

                            if not location:
                                return WebsiteEnrichment(
                                    requested_url=(
                                        requested_url
                                    ),
                                    final_url=str(
                                        response.url
                                    ),
                                    reachable=False,
                                    status_code=(
                                        response.status_code
                                    ),
                                    error=(
                                        "Website returned "
                                        "an invalid redirect."
                                    ),
                                )

                            if (
                                redirect_index
                                >= self.max_redirects
                            ):
                                return WebsiteEnrichment(
                                    requested_url=(
                                        requested_url
                                    ),
                                    final_url=str(
                                        response.url
                                    ),
                                    reachable=False,
                                    status_code=(
                                        response.status_code
                                    ),
                                    error=(
                                        "Website exceeded "
                                        "the redirect limit."
                                    ),
                                )

                            current_url = urljoin(
                                str(response.url),
                                location,
                            )

                            # The next loop validates the
                            # redirect destination before
                            # contacting it.
                            continue

                        if (
                            response.status_code
                            >= 400
                        ):
                            return WebsiteEnrichment(
                                requested_url=(
                                    requested_url
                                ),
                                final_url=str(
                                    response.url
                                ),
                                reachable=False,
                                status_code=(
                                    response.status_code
                                ),
                                error=(
                                    "Website returned HTTP "
                                    f"{response.status_code}."
                                ),
                            )

                        content_type = (
                            response.headers.get(
                                "content-type",
                                "",
                            ).lower()
                        )

                        if (
                            content_type
                            and "text/html"
                            not in content_type
                            and "application/xhtml+xml"
                            not in content_type
                            and "text/plain"
                            not in content_type
                        ):
                            return WebsiteEnrichment(
                                requested_url=(
                                    requested_url
                                ),
                                final_url=str(
                                    response.url
                                ),
                                reachable=False,
                                status_code=(
                                    response.status_code
                                ),
                                error=(
                                    "Website response was "
                                    "not HTML content."
                                ),
                            )

                        body = bytearray()

                        async for chunk in (
                            response.aiter_bytes()
                        ):
                            remaining = (
                                self.max_response_bytes
                                - len(body)
                            )

                            if remaining <= 0:
                                break

                            body.extend(
                                chunk[:remaining]
                            )

                            if (
                                len(body)
                                >= self.max_response_bytes
                            ):
                                break

                        encoding = (
                            response.encoding
                            or "utf-8"
                        )

                        html = bytes(body).decode(
                            encoding,
                            errors="replace",
                        )

                        signals = (
                            extract_website_signals(
                                html
                            )
                        )

                        return WebsiteEnrichment(
                            requested_url=(
                                requested_url
                            ),
                            final_url=str(
                                response.url
                            ),
                            reachable=True,
                            status_code=(
                                response.status_code
                            ),
                            **signals,
                        )

        except UnsafeWebsiteURL:
            return WebsiteEnrichment(
                requested_url=requested_url,
                reachable=False,
                error=(
                    "Website URL was blocked "
                    "by public-network safety checks."
                ),
            )

        except httpx.RequestError as exc:
            return WebsiteEnrichment(
                requested_url=requested_url,
                reachable=False,
                error=(
                    "Website request failed: "
                    f"{exc.__class__.__name__}"
                ),
            )

        return WebsiteEnrichment(
            requested_url=requested_url,
            reachable=False,
            error=(
                "Website enrichment could "
                "not be completed."
            ),
        )
