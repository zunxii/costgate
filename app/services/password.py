import base64
import hashlib
import hmac
import os


SALT_BYTES = 16
KEY_BYTES = 64

SCRYPT_N = 16_384
SCRYPT_R = 8
SCRYPT_P = 1


def hash_password(password: str) -> str:
    if not password:
        raise ValueError("Password cannot be empty")

    salt = os.urandom(SALT_BYTES)

    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=KEY_BYTES,
    )

    return (
        "scrypt$"
        f"{base64.urlsafe_b64encode(salt).decode()}"
        "$"
        f"{base64.urlsafe_b64encode(derived).decode()}"
    )


def verify_password(
    password: str,
    stored_hash: str,
) -> bool:
    try:
        algorithm, salt_b64, hash_b64 = (
            stored_hash.split("$")
        )

        if algorithm != "scrypt":
            return False

        salt = base64.urlsafe_b64decode(
            salt_b64.encode()
        )

        expected = base64.urlsafe_b64decode(
            hash_b64.encode()
        )

        derived = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=SCRYPT_N,
            r=SCRYPT_R,
            p=SCRYPT_P,
            dklen=len(expected),
        )

        return hmac.compare_digest(
            derived,
            expected,
        )

    except Exception:
        return False