import pytest

from services.api.app.services.url_security import (
    UnsafeWebsiteURL,
    validate_public_http_url,
)


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1",
        "http://10.0.0.10",
        "http://192.168.1.20",
        "http://169.254.169.254",
        "http://[::1]",
        "http://localhost",
        "http://service.local",
        "http://service.internal",
    ],
)
def test_private_and_local_urls_are_blocked(
    url,
):
    with pytest.raises(
        UnsafeWebsiteURL
    ):
        validate_public_http_url(url)


def test_non_http_scheme_is_blocked():
    with pytest.raises(
        UnsafeWebsiteURL
    ):
        validate_public_http_url(
            "file:///etc/passwd"
        )


def test_credentials_are_blocked():
    with pytest.raises(
        UnsafeWebsiteURL
    ):
        validate_public_http_url(
            "https://user:password@8.8.8.8"
        )


def test_non_standard_port_is_blocked():
    with pytest.raises(
        UnsafeWebsiteURL
    ):
        validate_public_http_url(
            "https://8.8.8.8:8000"
        )


def test_public_http_ip_is_allowed():
    assert (
        validate_public_http_url(
            "https://8.8.8.8"
        )
        == "https://8.8.8.8"
    )
