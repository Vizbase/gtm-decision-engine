from bs4 import BeautifulSoup


TECH_PATTERNS = {
    "HubSpot": [
        "hubspot",
        "js.hs-scripts.com",
        "hsforms",
    ],
    "Salesforce": [
        "salesforce",
        "force.com",
    ],
    "Intercom": [
        "intercom",
        "intercomcdn",
    ],
    "Google Analytics": [
        "google-analytics",
        "googletagmanager",
        "gtag(",
    ],
    "Stripe": [
        "stripe.com",
        "js.stripe.com",
    ],
    "Shopify": [
        "shopify",
        "cdn.shopify.com",
    ],
    "Greenhouse": [
        "greenhouse.io",
        "boards.greenhouse",
    ],
    "Lever": [
        "lever.co",
        "jobs.lever.co",
    ],
}


SIGNAL_PATTERNS = {
    "careers": [
        "careers",
        "career",
        "join our team",
    ],
    "jobs": [
        "jobs",
        "job openings",
        "open positions",
    ],
    "hiring": [
        "we are hiring",
        "we're hiring",
        "now hiring",
    ],
}


def extract_website_signals(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")

    title = None

    if soup.title and soup.title.string:
        title = " ".join(soup.title.string.strip().split())

    description = None

    description_tag = soup.find(
        "meta",
        attrs={"name": lambda value: value and value.lower() == "description"},
    )

    if description_tag:
        description = description_tag.get("content")

        if description:
            description = " ".join(description.strip().split())

    page_text = soup.get_text(" ", strip=True).lower()
    raw_html = html.lower()

    detected_technologies = []

    for technology, patterns in TECH_PATTERNS.items():
        if any(pattern.lower() in raw_html for pattern in patterns):
            detected_technologies.append(technology)

    signal_keywords = []

    for signal, patterns in SIGNAL_PATTERNS.items():
        if any(pattern.lower() in page_text for pattern in patterns):
            signal_keywords.append(signal)

    hiring_signal = any(
        signal in signal_keywords
        for signal in ["careers", "jobs", "hiring"]
    )

    return {
        "title": title,
        "description": description,
        "detected_technologies": detected_technologies,
        "signal_keywords": signal_keywords,
        "hiring_signal": hiring_signal,
    }
