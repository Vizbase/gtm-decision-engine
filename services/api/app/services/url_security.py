import ipaddress
import socket
from urllib.parse import urlsplit


ALLOWED_SCHEMES = {
    "http",
    "https",
}

ALLOWED_PORTS = {
    80,
    443,
}

BLOCKED_HOST_SUFFIXES = (
    ".localhost",
    ".local",
    ".internal",
    ".lan",
    ".home",
)


class UnsafeWebsiteURL(ValueError):
    pass


def _validate_ip(
    address: str,
) -> None:
    try:
        ip = ipaddress.ip_address(
            address
        )
    except ValueError as exc:
        raise UnsafeWebsiteURL(
            "Invalid IP address."
        ) from exc

    # is_global excludes private, loopback,
    # link-local, multicast, reserved,
    # unspecified, documentation ranges, etc.
    if not ip.is_global:
        raise UnsafeWebsiteURL(
            "Private or non-public network "
            "addresses are not allowed."
        )


def validate_public_http_url(
    url: str,
) -> str:
    if not url or not url.strip():
        raise UnsafeWebsiteURL(
            "Website URL is empty."
        )

    value = url.strip()

    try:
        parsed = urlsplit(value)
    except ValueError as exc:
        raise UnsafeWebsiteURL(
            "Invalid website URL."
        ) from exc

    if (
        parsed.scheme.lower()
        not in ALLOWED_SCHEMES
    ):
        raise UnsafeWebsiteURL(
            "Only HTTP and HTTPS URLs are allowed."
        )

    if (
        parsed.username is not None
        or parsed.password is not None
    ):
        raise UnsafeWebsiteURL(
            "Credentials in website URLs are not allowed."
        )

    hostname = parsed.hostname

    if not hostname:
        raise UnsafeWebsiteURL(
            "Website hostname is missing."
        )

    hostname = (
        hostname.rstrip(".").lower()
    )

    if (
        hostname == "localhost"
        or hostname.endswith(
            BLOCKED_HOST_SUFFIXES
        )
    ):
        raise UnsafeWebsiteURL(
            "Local network hostnames are not allowed."
        )

    try:
        port = parsed.port
    except ValueError as exc:
        raise UnsafeWebsiteURL(
            "Invalid website port."
        ) from exc

    if (
        port is not None
        and port not in ALLOWED_PORTS
    ):
        raise UnsafeWebsiteURL(
            "Only standard HTTP/HTTPS ports are allowed."
        )

    # Literal IP address.
    try:
        literal_ip = ipaddress.ip_address(
            hostname
        )
    except ValueError:
        literal_ip = None

    if literal_ip is not None:
        _validate_ip(
            str(literal_ip)
        )

        return value

    # Resolve DNS before allowing the request.
    try:
        records = socket.getaddrinfo(
            hostname,
            port
            or (
                443
                if parsed.scheme.lower()
                == "https"
                else 80
            ),
            type=socket.SOCK_STREAM,
        )
    except socket.gaierror as exc:
        raise UnsafeWebsiteURL(
            "Website hostname could not be resolved."
        ) from exc

    addresses = {
        record[4][0]
        for record in records
        if record[4]
    }

    if not addresses:
        raise UnsafeWebsiteURL(
            "Website hostname did not resolve."
        )

    for address in addresses:
        _validate_ip(address)

    return value
