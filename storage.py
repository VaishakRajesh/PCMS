"""JSON "database" layer - the ONLY file allowed to touch data files.

Rule: routes never read/write JSON directly. They always call the
functions in this file. That way we can later swap JSON for a real
database (PostgreSQL) without rewriting the whole app.
"""

import json
import os
import tempfile

import config


def default_portfolio() -> dict:
    """Fresh portfolio content used on first run (or to fill missing keys)."""
    return {
        "profile": {
            "name": "Your Name",
            "title": "Full Stack Developer",
            "tagline": "Building modern web applications",
            "bio": "Write a short intro about yourself here.",
            "profileImage": "",
            "resume": "",  # e.g. "/static/uploads/resume-abc123.pdf"
            "location": "",
            "email": "",
            "phone": "",
        },
        "social": {"github": "", "linkedin": "", "twitter": "", "email": ""},
        "theme": {
            "template": "modern",
            "mode": "light",
            "primaryColor": "#4f46e5",
            "secondaryColor": "#8b5cf6",
            "backgroundColor": "#ffffff",
            "textColor": "#111827",
            "borderRadius": "12px",
            "animations": False,
        },
        # Sections control WHAT shows on the public page and IN WHAT ORDER.
        # Switching templates never touches this - only the design changes.
        "sections": [
            {"id": "hero", "type": "hero", "title": "Hero", "visible": True, "order": 1},
            {"id": "about", "type": "about", "title": "About", "visible": True, "order": 2},
            {"id": "skills", "type": "skills", "title": "Skills", "visible": True, "order": 3},
            {"id": "projects", "type": "projects", "title": "Projects", "visible": True, "order": 4},
            {"id": "experience", "type": "experience", "title": "Experience", "visible": True, "order": 5},
            {"id": "education", "type": "education", "title": "Education", "visible": True, "order": 6},
            {"id": "contact", "type": "contact", "title": "Contact", "visible": True, "order": 7},
        ],
        "skills": [],        # each: {name, category, level}
        "projects": [],      # each: {name, description, technologies, github, live, featured}
        "experience": [],    # each: {company, position, start, end, description}
        "education": [],     # each: {institution, degree, start, end, description}
        "certifications": [],
        "settings": {
            "siteTitle": "My Portfolio",
            "description": "Portfolio built with PortfolioCMS",
            "slug": "my-portfolio",  # public URL becomes /p/my-portfolio
        },
    }


def ensure_dirs() -> None:
    """Create data/ and static/uploads/ folders if they are missing."""
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _atomic_write_json(path, data: dict) -> None:
    """Save JSON safely: write to a temp file first, then rename.

    Why: if the server crashes mid-save, the real file is never left
    half-written and corrupted. os.replace() is atomic on one disk.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp, path)  # atomic swap: temp file BECOMES the real file
    finally:
        try:
            if os.path.exists(tmp):  # clean up if the rename never happened
                os.remove(tmp)
        except OSError:
            pass


# -- users (single owner login) -------------------------------------------
def load_users() -> dict:
    """Read data/users.json -> {username, password_hash, is_default}."""
    ensure_dirs()
    return json.loads(config.USERS_FILE.read_text(encoding="utf-8"))


def save_users(data: dict) -> None:
    """Save data/users.json (always through the atomic writer)."""
    _atomic_write_json(config.USERS_FILE, data)


# -- portfolio --------------------------------------------------------------
def load_portfolio() -> dict:
    """Read data/portfolio.json, creating it with defaults on first run.

    Missing keys are filled from defaults so old files keep working
    after we add new fields.
    """
    ensure_dirs()
    if not config.PORTFOLIO_FILE.exists():
        data = default_portfolio()
        save_portfolio(data)
        return data
    data = json.loads(config.PORTFOLIO_FILE.read_text(encoding="utf-8"))
    for key, value in default_portfolio().items():
        if key not in data:
            data[key] = value
    return data


def save_portfolio(data: dict) -> None:
    """Save data/portfolio.json (always through the atomic writer)."""
    _atomic_write_json(config.PORTFOLIO_FILE, data)


def delete_local_static_file(path_value: str) -> None:
    """Delete an old uploaded file, but ONLY inside static/uploads/.

    The folder check stops a malicious path like /static/../app.py
    from ever deleting project code.
    """
    if not path_value or not path_value.startswith("/static/"):
        return
    target = config.BASE_DIR / path_value.lstrip("/").replace("/", os.sep)
    try:
        if target.is_file() and config.UPLOAD_DIR in target.parents:
            target.unlink()
    except OSError:
        pass  # file already gone -> nothing to do
