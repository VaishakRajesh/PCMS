"""Login / logout routes - the ONLY auth endpoints (no registration).

Routes:
  GET  /login  -> show the login form
  POST /login  -> check password, start session, go to /dashboard
  GET  /logout -> end session, go back to /
"""

from fastapi import APIRouter, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

import config
import security
import storage

router = APIRouter()
templates = Jinja2Templates(directory=str(config.TEMPLATES_DIR))

# Login page uses the default theme (owner may not have customized yet).
from storage import default_portfolio  # noqa: E402  (default look for login page)


def _login_page(request: Request, error: str = "", status: int = 200):
    """Render templates/login.html with an optional error message."""
    theme = default_portfolio()["theme"]
    return templates.TemplateResponse(
        "login.html",
        {"request": request, "error": error, "theme": theme,
         "settings": default_portfolio()["settings"]},
        status_code=status,
    )


@router.get("/login")
def login_form(request: Request):
    """Show the login form. Already logged in? Skip straight to dashboard."""
    if security.current_user(request):
        return RedirectResponse(url="/dashboard", status_code=303)
    return _login_page(request)


@router.post("/login")
def login_post(request: Request,
               username: str = Form(...),
               password: str = Form(...)):
    """Check credentials. Correct -> session cookie + /dashboard.

    Wrong -> same form with an error (401). The hash is NEVER compared
    as plain text; bcrypt does the checking.
    """
    users = storage.load_users()
    ok = (username == users.get("username")
          and security.verify_password(password, users.get("password_hash", "")))
    if not ok:
        return _login_page(request, "Invalid username or password.", 401)
    request.session["user"] = username  # <-- this cookie = "logged in"
    return RedirectResponse(url="/dashboard", status_code=303)


@router.get("/logout")
def logout(request: Request):
    """Clear the session cookie and return to the public homepage."""
    request.session.clear()
    return RedirectResponse(url="/", status_code=303)
