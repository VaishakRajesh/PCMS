"""Login + password helpers - everything about "who may edit".

How login works here (simple version):
  1. Owner types username + password at /login.
  2. We check the bcrypt hash stored in data/users.json.
  3. If correct, we store the username in a SIGNED cookie session.
  4. Every dashboard route calls login_required(): no session -> back to /login.
"""

from fastapi import Request
from fastapi.responses import RedirectResponse
from passlib.context import CryptContext

import config
import storage

# Password hasher. bcrypt = slow on purpose, so stolen hashes are hard to crack.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Turn a plain password into a safe hash for storage."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Check a typed password against the stored hash. Never un-hash."""
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False  # broken/empty hash -> treat as wrong password


def ensure_default_user() -> None:
    """Create data/users.json with the default admin on first run only.

    Uses ADMIN_USERNAME / ADMIN_PASSWORD env vars if set, else admin/admin123.
    Does nothing if the file already exists (so restarts never reset logins).
    """
    storage.ensure_dirs()
    if config.USERS_FILE.exists():
        return
    storage.save_users(
        {
            "username": config.DEFAULT_ADMIN_USER,
            "password_hash": hash_password(config.DEFAULT_ADMIN_PASS),
            "is_default": True,  # True until the owner changes the password
        }
    )


def current_user(request: Request):
    """Username from the login cookie, or None if not logged in."""
    return request.session.get("user")


def login_required(request: Request):
    """Call at the top of every dashboard route.

    Returns a redirect to /login when logged out, else None (= allowed).
    Usage:  denied = login_required(request); if denied: return denied
    """
    if not current_user(request):
        return RedirectResponse(url="/login", status_code=303)
    return None


def is_default_password() -> bool:
    """True while the owner still uses the seeded default login.

    The dashboard shows a warning banner until this becomes False.
    """
    try:
        return bool(storage.load_users().get("is_default"))
    except Exception:
        return False
