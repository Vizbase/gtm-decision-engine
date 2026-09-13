from services.api.app.services.website_parser import extract_website_signals


def test_extract_basic_website_information():
    html = """
    <html>
        <head>
            <title>Acme Software</title>
            <meta
                name="description"
                content="B2B software for modern sales teams."
            >
            <script src="https://js.hs-scripts.com/test.js"></script>
        </head>

        <body>
            <h1>Acme Software</h1>
            <p>We are hiring. Visit our careers page.</p>
        </body>
    </html>
    """

    result = extract_website_signals(html)

    assert result["title"] == "Acme Software"
    assert result["description"] == "B2B software for modern sales teams."
    assert "HubSpot" in result["detected_technologies"]
    assert result["hiring_signal"] is True
    assert "careers" in result["signal_keywords"]
