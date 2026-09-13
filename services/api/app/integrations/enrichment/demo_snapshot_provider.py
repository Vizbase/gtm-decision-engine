from services.api.app.integrations.enrichment.base import (
    EnrichmentProvider,
)
from services.api.app.schemas.company import CompanyNormalized
from services.api.app.schemas.enrichment import WebsiteEnrichment


DEMO_SNAPSHOTS = {
    "hubspot.com": {
        "reachable": True,
        "status_code": 200,
        "title": "HubSpot",
        "description": (
            "Customer platform with marketing, sales, "
            "service, content, and operations software."
        ),
        "detected_technologies": [
            "HubSpot",
            "Google Analytics",
            "Stripe",
        ],
        "signal_keywords": [
            "careers",
            "jobs",
        ],
        "hiring_signal": True,
    },
    "acme.com": {
        "reachable": True,
        "status_code": 200,
        "title": "Acme GmbH",
        "description": (
            "B2B software company expanding its "
            "enterprise platform."
        ),
        "detected_technologies": [
            "Salesforce",
            "Stripe",
        ],
        "signal_keywords": [
            "careers",
        ],
        "hiring_signal": True,
    },
    "nova.ai": {
        "reachable": True,
        "status_code": 200,
        "title": "Nova AI",
        "description": (
            "AI software company building automation "
            "tools for business teams."
        ),
        "detected_technologies": [
            "HubSpot",
        ],
        "signal_keywords": [],
        "hiring_signal": False,
    },
    "example.com": {
        "reachable": True,
        "status_code": 200,
        "title": "Example Systems",
        "description": (
            "SaaS platform serving mid-market "
            "operations teams."
        ),
        "detected_technologies": [
            "HubSpot",
            "Intercom",
        ],
        "signal_keywords": [
            "jobs",
        ],
        "hiring_signal": True,
    },
    "signalcraft.example": {
        "reachable": False,
        "error": (
            "Demo scenario: public website research "
            "could not be verified."
        ),
    },
    "bluepeak.example": {
        "reachable": True,
        "status_code": 200,
        "title": "BluePeak SaaS",
        "description": (
            "Workflow SaaS company selling to "
            "European operations teams."
        ),
        "detected_technologies": [
            "HubSpot",
            "Intercom",
            "Stripe",
        ],
        "signal_keywords": [
            "careers",
        ],
        "hiring_signal": False,
    },
    "legacy.example": {
        "reachable": True,
        "status_code": 200,
        "title": "Legacy Manufacturing Group",
        "description": (
            "Large industrial manufacturing company."
        ),
        "detected_technologies": [],
        "signal_keywords": [],
        "hiring_signal": False,
    },
}


class DemoSnapshotEnrichmentProvider(
    EnrichmentProvider
):
    async def enrich(
        self,
        company: CompanyNormalized,
    ) -> WebsiteEnrichment:
        domain = (
            company.domain.lower()
            if company.domain
            else ""
        )

        snapshot = DEMO_SNAPSHOTS.get(domain)

        if snapshot is None:
            return WebsiteEnrichment(
                source="demo_snapshot",
                requested_url=company.website,
                reachable=False,
                error=(
                    "No demo enrichment snapshot "
                    "available."
                ),
            )

        return WebsiteEnrichment(
            source="demo_snapshot",
            requested_url=company.website,
            final_url=(
                company.website
                if snapshot.get("reachable")
                else None
            ),
            **snapshot,
        )
