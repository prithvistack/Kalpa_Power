import base64
from io import BytesIO


def generate_qr_png_bytes(value: str) -> bytes:
    try:
        import qrcode
    except ImportError as exc:
        raise RuntimeError("Install qrcode[pil] to generate QR PNG files") from exc

    image = qrcode.make(value)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def generate_qr_base64(value: str) -> str:
    return base64.b64encode(generate_qr_png_bytes(value)).decode("ascii")
