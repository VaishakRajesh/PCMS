"""Public pages - what VISITORS see. No login needed here.

Routes:
  GET /         -> portfolio homepage
  GET /p/{slug} -> same portfolio via its shareable slug link
"""

from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

import config
import storage

router = APIRouter()

# Jinja2 template loader. autoescape=True for .html means {{ ... }}
# user text is escaped automatically (XSS protection).
templates = Jinja2Templates(directory=str(config.TEMPLATES_DIR))


def _theme_template(p: dict) -> str:
    """Pick themes/<name>.html from the saved theme.

    Unknown/missing names fall back to modern so the page never crashes
    because of a bad template value (e.g. theme file deleted by hand).
    """
    name = p.get("theme", {}).get("template", "modern")
    if name in config.available_templates():
        return f"themes/{name}.html"
    return "themes/modern.html"


def _public_context(request: Request, p: dict) -> dict:
    """Shared variables every public render needs.

    Sections are sorted here (Python) so the template just loops.
    `visible` is a set of shown section ids for quick `in` checks.
    """
    sections = sorted(p.get("sections", []), key=lambda s: s.get("order", 99))
    visible = {s.get("id") for s in sections if s.get("visible", True)}
    return {
        "request": request,
        "p": p,
        "sections": sections,
        "visible": visible,
        "theme": p.get("theme", {}),
        "settings": p.get("settings", {}),
    }


@router.get("/", response_class=HTMLResponse)
def home(request: Request):
    """Portfolio homepage - renders the chosen themes/<name>.html from JSON."""
    p = storage.load_portfolio()
    return templates.TemplateResponse(_theme_template(p), _public_context(request, p))


@router.get("/p/{slug}", response_class=HTMLResponse)
def by_slug(request: Request, slug: str):
    """Shareable link (/p/my-portfolio). Wrong slug -> 404 page."""
    p = storage.load_portfolio()
    if slug != p.get("settings", {}).get("slug", ""):
        return HTMLResponse("<h2>Portfolio not found</h2>", status_code=404)
    return templates.TemplateResponse(_theme_template(p), _public_context(request, p))
