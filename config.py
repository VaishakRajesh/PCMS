"""Project settings - ONE place for every path and default.

If you ever need to change where files live, the default login,
or the upload size limit, change it HERE and nowhere else.
"""

import os
from pathlib import Path

# Folder that contains this file = project root (PCMS/).
BASE_DIR = Path(__file__).resolve().parent

# Where the JSON "database" files live. Created automatically on first run.
# Overridable via DATA_DIR env var so Render disks (e.g. /var/data) can persist
# data across deploys. Defaults to ./data for local dev.
DATA_DIR = Path(os.getenv("DATA_DIR", str(BASE_DIR / "data")))
USERS_FILE = DATA_DIR / "users.json"       # single owner login (username + hash)
PORTFOLIO_FILE = DATA_DIR / "portfolio.json"  # the whole portfolio content

# Static files (served at /static/...) and HTML templates.
STATIC_DIR = BASE_DIR / "static"
UPLOAD_DIR = STATIC_DIR / "uploads"          # uploaded resumes land here (served at /static/uploads/...)
TEMPLATES_DIR = BASE_DIR / "templates"     # Jinja2 HTML files live here

# Secret used to sign the login cookie. Set a real random value in
# production, e.g.  SECRET_KEY="long-random-string"  python main.py
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")

# Default owner login, used ONLY the very first time (when data/users.json
# does not exist yet). Change it after login via Dashboard -> Settings.
DEFAULT_ADMIN_USER = os.getenv("ADMIN_USERNAME", "admin")
DEFAULT_ADMIN_PASS = os.getenv("ADMIN_PASSWORD", "admin123")

# Largest accepted resume upload (5 MB). Bigger files are rejected.
MAX_RESUME_BYTES = 5 * 1024 * 1024

# Portfolio designs live as files in templates/themes/<name>.html.
# The dashboard dropdown is AUTO-DISCOVERED from that folder, so adding a
# design = adding one HTML file (copy minimal.html, rename, edit). Files
# starting with "_" are partials (shared pieces) and are skipped.
THEMES_DIR = TEMPLATES_DIR / "themes"


def available_templates() -> list:
    """Sorted theme names (= .html filenames in templates/themes/)."""
    try:
        return sorted(
            f.stem for f in THEMES_DIR.glob("*.html")
            if not f.name.startswith("_")
        ) or ["modern"]
    except OSError:
        return ["modern"]  # folder unreadable -> safe fallback
