"""PortfolioCMS - single-file FastAPI portfolio CMS (college demo).

Stack: Python FastAPI + plain HTML/CSS/vanilla JS + JSON files only.
No registration. Single default admin (admin / admin123) - change in Settings.

Run:
    pip install fastapi uvicorn python-multipart itsdangerous "passlib[bcrypt]"
    python app.py
Then open http://127.0.0.1:8000  (public)  and  http://127.0.0.1:8000/dashboard
"""

import json
import os
import tempfile
import uuid
from html import escape
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Form, Request, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from passlib.context import CryptContext
from starlette.middleware.sessions import SessionMiddleware

# ---------------------------------------------------------------- paths ---
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
USERS_FILE = DATA_DIR / "users.json"
PORTFOLIO_FILE = DATA_DIR / "portfolio.json"
STATIC_DIR = BASE_DIR / "static"
UPLOAD_DIR = STATIC_DIR / "uploads"

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
DEFAULT_ADMIN_USER = os.getenv("ADMIN_USERNAME", "admin")
DEFAULT_ADMIN_PASS = os.getenv("ADMIN_PASSWORD", "admin123")

MAX_RESUME_BYTES = 5 * 1024 * 1024  # 5 MB

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="PortfolioCMS (single file)")
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)


# ------------------------------------------------------------ defaults ----
def default_portfolio() -> dict:
    return {
        "profile": {
            "name": "Your Name",
            "title": "Full Stack Developer",
            "tagline": "Building modern web applications",
            "bio": "Write a short intro about yourself here.",
            "profileImage": "",
            "resume": "",
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
        "sections": [
            {"id": "hero", "type": "hero", "title": "Hero", "visible": True, "order": 1},
            {"id": "about", "type": "about", "title": "About", "visible": True, "order": 2},
            {"id": "skills", "type": "skills", "title": "Skills", "visible": True, "order": 3},
            {"id": "projects", "type": "projects", "title": "Projects", "visible": True, "order": 4},
            {"id": "experience", "type": "experience", "title": "Experience", "visible": True, "order": 5},
            {"id": "education", "type": "education", "title": "Education", "visible": True, "order": 6},
            {"id": "contact", "type": "contact", "title": "Contact", "visible": True, "order": 7},
        ],
        "skills": [],
        "projects": [],
        "experience": [],
        "education": [],
        "certifications": [],
        "settings": {
            "siteTitle": "My Portfolio",
            "description": "Portfolio built with PortfolioCMS",
            "slug": "my-portfolio",
        },
    }


# ------------------------------------------------------------- storage ----
def ensure_storage() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    if not USERS_FILE.exists():
        save_users(
            {
                "username": DEFAULT_ADMIN_USER,
                "password_hash": pwd_context.hash(DEFAULT_ADMIN_PASS),
                "is_default": True,
            }
        )
    if not PORTFOLIO_FILE.exists():
        save_portfolio(default_portfolio())


def _atomic_write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp, path)
    finally:
        try:
            if os.path.exists(tmp):
                os.remove(tmp)
        except OSError:
            pass


def load_users() -> dict:
    ensure_storage()
    return json.loads(USERS_FILE.read_text(encoding="utf-8"))


def save_users(data: dict) -> None:
    _atomic_write_json(USERS_FILE, data)


def load_portfolio() -> dict:
    ensure_storage()
    data = json.loads(PORTFOLIO_FILE.read_text(encoding="utf-8"))
    # fill missing keys so old JSON files keep working
    defaults = default_portfolio()
    for key, value in defaults.items():
        if key not in data:
            data[key] = value
    return data


def save_portfolio(data: dict) -> None:
    _atomic_write_json(PORTFOLIO_FILE, data)


ensure_storage()
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# ----------------------------------------------------------------- auth ---
def current_user(request: Request) -> Optional[str]:
    return request.session.get("user")


def login_required(request: Request) -> Optional[HTMLResponse]:
    if not current_user(request):
        return RedirectResponse(url="/login", status_code=303)
    return None


def default_password_warning() -> str:
    try:
        users = load_users()
    except Exception:
        return ""
    if users.get("is_default"):
        return (
            '<div style="background:#fef3c7;color:#92400e;padding:10px 14px;'
            'border:1px solid #f59e0b;border-radius:8px;margin-bottom:16px;">'
            "You are using the default password (<b>admin / admin123</b>). "
            "Change it in Settings below.</div>"
        )
    return ""


# ------------------------------------------------------------------ css ---
def base_css(theme: dict) -> str:
    return f"""
    * {{ box-sizing: border-box; }}
    body {{ font-family: Arial, Helvetica, sans-serif; margin: 0;
      background: {escape(theme.get('backgroundColor', '#ffffff'))};
      color: {escape(theme.get('textColor', '#111827'))}; }}
    a {{ color: {escape(theme.get('primaryColor', '#4f46e5'))}; }}
    .wrap {{ max-width: 900px; margin: 0 auto; padding: 24px; }}
    .hero {{ padding: 48px 24px; text-align: center;
      background: {escape(theme.get('primaryColor', '#4f46e5'))}; color: #fff;
      border-radius: {escape(theme.get('borderRadius', '12px'))}; }}
    .hero a.btn {{ display: inline-block; margin: 8px; padding: 10px 18px;
      background: #fff; color: #111; border-radius: 8px; text-decoration: none; }}
    .card {{ border: 1px solid #ddd; padding: 16px; margin: 12px 0;
      border-radius: {escape(theme.get('borderRadius', '12px'))}; background: #fff; color:#111; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }}
    .muted {{ opacity: .75; }}
    nav.top {{ display:flex; gap:12px; padding:12px 24px; background:#111827; color:#fff; }}
    nav.top a {{ color:#fff; text-decoration:none; }}
    form.card label {{ display:block; margin:8px 0 2px; font-weight:bold; }}
    form.card input, form.card textarea, form.card select {{
      width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; }}
    button {{ padding:8px 14px; border:none; border-radius:6px; cursor:pointer;
      background:{escape(theme.get('primaryColor', '#4f46e5'))}; color:#fff; margin-top:8px; }}
    button.danger {{ background:#dc2626; }}
    table {{ width:100%; border-collapse:collapse; }}
    td, th {{ border:1px solid #ddd; padding:6px; text-align:left; }}
    """


def page(title: str, body: str, theme: Optional[dict] = None) -> HTMLResponse:
    theme = theme or default_portfolio()["theme"]
    html_doc = f"""<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)}</title>
<style>{base_css(theme)}</style></head>
<body>{body}</body></html>"""
    return HTMLResponse(html_doc)


# --------------------------------------------------------------- public ---
def render_portfolio(p: dict) -> str:
    prof = p.get("profile", {})
    social = p.get("social", {})
    settings = p.get("settings", {})
    secs = sorted(p.get("sections", []), key=lambda s: s.get("order", 99))
    visible = {s.get("id") for s in secs if s.get("visible", True)}

    def section_visible(sid: str) -> bool:
        return sid in visible

    resume = prof.get("resume", "")
    resume_btn = (
        f'<a class="btn" href="{escape(resume)}" download>Download Resume</a>'
        if resume
        else ""
    )

    parts = [f'<div class="wrap">']
    parts.append(f"<h1>{escape(settings.get('siteTitle', prof.get('name', 'Portfolio')))}</h1>")
    parts.append(f"<p class='muted'>{escape(settings.get('description', ''))}</p>")

    if section_visible("hero"):
        parts.append(
            "<div class='hero'>"
            f"<h2>{escape(prof.get('name', ''))}</h2>"
            f"<p>{escape(prof.get('title', ''))}</p>"
            f"<p>{escape(prof.get('tagline', ''))}</p>"
            f"{resume_btn}</div>"
        )
    if section_visible("about"):
        parts.append(
            "<div class='card'><h3>About</h3>"
            f"<p>{escape(prof.get('bio', ''))}</p>"
            f"<p class='muted'>{escape(prof.get('location', ''))} "
            f"{escape(prof.get('email', ''))} {escape(prof.get('phone', ''))}</p></div>"
        )
    if section_visible("skills"):
        skills = p.get("skills", [])
        items = "".join(
            f"<div class='card'><b>{escape(s.get('name', ''))}</b><br>"
            f"<span class='muted'>{escape(s.get('category', ''))} - "
            f"{escape(s.get('level', ''))}</span></div>"
            for s in skills
        ) or "<p class='muted'>No skills yet.</p>"
        parts.append(f"<h3>Skills</h3><div class='grid'>{items}</div>")
    if section_visible("projects"):
        projs = p.get("projects", [])
        cards = ""
        for pr in projs:
            techs = pr.get("technologies", "")
            if isinstance(techs, list):
                techs = ", ".join(techs)
            links = ""
            if pr.get("github"):
                links += f" <a href='{escape(pr['github'])}'>GitHub</a>"
            if pr.get("live"):
                links += f" <a href='{escape(pr['live'])}'>Live</a>"
            star = " ⭐" if pr.get("featured") else ""
            cards += (
                f"<div class='card'><b>{escape(pr.get('name', ''))}{star}</b>"
                f"<p>{escape(pr.get('description', ''))}</p>"
                f"<p class='muted'>{escape(str(techs))}</p><p>{links}</p></div>"
            )
        parts.append(f"<h3>Projects</h3>{cards or '<p class=m muted>No projects yet.</p>'}")
    if section_visible("experience"):
        exps = p.get("experience", [])
        rows = "".join(
            f"<div class='card'><b>{escape(e.get('position', ''))}</b> at "
            f"{escape(e.get('company', ''))}<br><span class='muted'>"
            f"{escape(e.get('start', ''))} - {escape(e.get('end', ''))}</span>"
            f"<p>{escape(e.get('description', ''))}</p></div>"
            for e in exps
        ) or "<p class='muted'>No experience yet.</p>"
        parts.append(f"<h3>Experience</h3>{rows}")
    if section_visible("education"):
        edus = p.get("education", [])
        rows = "".join(
            f"<div class='card'><b>{escape(e.get('degree', ''))}</b>, "
            f"{escape(e.get('institution', ''))}<br><span class='muted'>"
            f"{escape(e.get('start', ''))} - {escape(e.get('end', ''))}</span>"
            f"<p>{escape(e.get('description', ''))}</p></div>"
            for e in edus
        ) or "<p class='muted'>No education yet.</p>"
        parts.append(f"<h3>Education</h3>{rows}")
    if section_visible("contact"):
        parts.append(
            "<div class='card'><h3>Contact</h3>"
            f"<p>GitHub: {escape(social.get('github', ''))}<br>"
            f"LinkedIn: {escape(social.get('linkedin', ''))}<br>"
            f"Twitter: {escape(social.get('twitter', ''))}<br>"
            f"Email: {escape(social.get('email', ''))}</p></div>"
        )
    parts.append(
        "<p class='muted'><a href='/login'>Owner login</a> | "
        "<a href='/dashboard'>Dashboard</a></p></div>"
    )
    return "".join(parts)


@app.get("/", response_class=HTMLResponse)
def public_home():
    p = load_portfolio()
    body = render_portfolio(p)
    return page(p["settings"].get("siteTitle", "Portfolio"), body, p.get("theme"))


@app.get("/p/{slug}", response_class=HTMLResponse)
def public_by_slug(slug: str):
    p = load_portfolio()
    if slug != p.get("settings", {}).get("slug", ""):
        return HTMLResponse("<h2>Portfolio not found</h2>", status_code=404)
    return page(p["settings"].get("siteTitle", "Portfolio"), render_portfolio(p), p.get("theme"))


# ------------------------------------------------------------------ login --
@app.get("/login", response_class=HTMLResponse)
def login_form():
    body = """<div class="wrap"><h2>Owner Login</h2>
    <p class="muted">Default: <b>admin / admin123</b> (change after first login)</p>
    <form class="card" method="post" action="/login">
      <label>Username</label><input name="username" required>
      <label>Password</label><input name="password" type="password" required>
      <button type="submit">Login</button>
    </form><p><a href="/">Back to portfolio</a></p></div>"""
    return page("Login", body)


@app.post("/login")
def login_post(username: str = Form(...), password: str = Form(...), request: Request = None):
    users = load_users()
    if username != users.get("username") or not pwd_context.verify(
        password, users.get("password_hash", "")
    ):
        body = """<div class="wrap"><h2>Owner Login</h2>
        <p style="color:red">Invalid username or password.</p>
        <form class="card" method="post" action="/login">
          <label>Username</label><input name="username" required>
          <label>Password</label><input name="password" type="password" required>
          <button type="submit">Login</button>
        </form></div>"""
        return HTMLResponse(body, status_code=401)
    request.session["user"] = username
    return RedirectResponse(url="/dashboard", status_code=303)


@app.get("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/", status_code=303)


# -------------------------------------------------------------- dashboard --
def dash_nav() -> str:
    return (
        "<nav class='top'><a href='/'>View site</a>"
        "<a href='/dashboard'>Dashboard</a>"
        "<a href='/logout'>Logout</a></nav>"
    )


@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    prof = p["profile"]
    theme = p.get("theme", {})
    warn = default_password_warning()

    skills_rows = "".join(
        f"<tr><td>{escape(s.get('name', ''))}</td>"
        f"<td>{escape(s.get('category', ''))}</td>"
        f"<td>{escape(s.get('level', ''))}</td>"
        f"<td><form method='post' action='/dashboard/skills/delete'>"
        f"<input type='hidden' name='index' value='{i}'>"
        f"<button class='danger' type='submit'>Delete</button></form></td></tr>"
        for i, s in enumerate(p.get("skills", []))
    )
    proj_rows = "".join(
        f"<tr><td>{escape(x.get('name', ''))}</td>"
        f"<td>{'⭐' if x.get('featured') else ''}</td>"
        f"<td><form method='post' action='/dashboard/projects/delete'>"
        f"<input type='hidden' name='index' value='{i}'>"
        f"<button class='danger' type='submit'>Delete</button></form></td></tr>"
        for i, x in enumerate(p.get("projects", []))
    )
    exp_rows = "".join(
        f"<tr><td>{escape(e.get('position', ''))}</td>"
        f"<td>{escape(e.get('company', ''))}</td>"
        f"<td><form method='post' action='/dashboard/experience/delete'>"
        f"<input type='hidden' name='index' value='{i}'>"
        f"<button class='danger' type='submit'>Delete</button></form></td></tr>"
        for i, e in enumerate(p.get("experience", []))
    )
    edu_rows = "".join(
        f"<tr><td>{escape(e.get('degree', ''))}</td>"
        f"<td>{escape(e.get('institution', ''))}</td>"
        f"<td><form method='post' action='/dashboard/education/delete'>"
        f"<input type='hidden' name='index' value='{i}'>"
        f"<button class='danger' type='submit'>Delete</button></form></td></tr>"
        for i, e in enumerate(p.get("education", []))
    )
    sec_rows = "".join(
        f"<tr><td>{escape(s.get('title', s.get('id', '')))}</td>"
        f"<td>{'visible' if s.get('visible') else 'hidden'}</td>"
        f"<td><form method='post' action='/dashboard/sections/toggle' style='display:inline'>"
        f"<input type='hidden' name='sid' value='{escape(s.get('id', ''))}'>"
        f"<button type='submit'>Toggle</button></form> "
        f"<form method='post' action='/dashboard/sections/move' style='display:inline'>"
        f"<input type='hidden' name='sid' value='{escape(s.get('id', ''))}'>"
        f"<input type='hidden' name='direction' value='up'>"
        f"<button type='submit'>Up</button></form> "
        f"<form method='post' action='/dashboard/sections/move' style='display:inline'>"
        f"<input type='hidden' name='sid' value='{escape(s.get('id', ''))}'>"
        f"<input type='hidden' name='direction' value='down'>"
        f"<button type='submit'>Down</button></form></td></tr>"
        for s in sorted(p.get("sections", []), key=lambda x: x.get("order", 99))
    )

    resume = prof.get("resume", "")
    resume_block = (
        f"<p>Current: <a href='{escape(resume)}' download>{escape(resume)}</a></p>"
        "<form class='card' method='post' action='/dashboard/delete-resume'>"
        "<button class='danger' type='submit'>Remove resume</button></form>"
        if resume
        else "<p class='muted'>No resume uploaded yet.</p>"
    )

    body = f"""{dash_nav()}<div class="wrap"><h2>Dashboard</h2>{warn}

    <form class="card" method="post" action="/dashboard/profile">
      <h3>Profile + Site</h3>
      <label>Name</label><input name="name" value="{escape(prof.get('name', ''))}">
      <label>Title</label><input name="title" value="{escape(prof.get('title', ''))}">
      <label>Tagline</label><input name="tagline" value="{escape(prof.get('tagline', ''))}">
      <label>Bio</label><textarea name="bio" rows="4">{escape(prof.get('bio', ''))}</textarea>
      <label>Location</label><input name="location" value="{escape(prof.get('location', ''))}">
      <label>Email</label><input name="email" value="{escape(prof.get('email', ''))}">
      <label>Phone</label><input name="phone" value="{escape(prof.get('phone', ''))}">
      <label>Site title</label><input name="siteTitle" value="{escape(p['settings'].get('siteTitle', ''))}">
      <label>Site description</label><input name="description" value="{escape(p['settings'].get('description', ''))}">
      <label>Slug (public URL /p/your-slug)</label><input name="slug" value="{escape(p['settings'].get('slug', ''))}">
      <button type="submit">Save profile</button>
    </form>

    <form class="card" method="post" action="/dashboard/social">
      <h3>Social links</h3>
      <label>GitHub</label><input name="github" value="{escape(p['social'].get('github', ''))}">
      <label>LinkedIn</label><input name="linkedin" value="{escape(p['social'].get('linkedin', ''))}">
      <label>Twitter</label><input name="twitter" value="{escape(p['social'].get('twitter', ''))}">
      <label>Contact email</label><input name="contact_email" value="{escape(p['social'].get('email', ''))}">
      <button type="submit">Save social</button>
    </form>

    <div class="card"><h3>Resume (PDF, max 5MB)</h3>{resume_block}
      <form method="post" action="/dashboard/upload-resume" enctype="multipart/form-data">
        <input type="file" name="resume" accept="application/pdf,.pdf" required>
        <button type="submit">Upload resume</button>
      </form>
    </div>

    <div class="card"><h3>Skills</h3>
      <table><tr><th>Name</th><th>Category</th><th>Level</th><th></th></tr>{skills_rows}</table>
      <form method="post" action="/dashboard/skills/add">
        <label>Name</label><input name="name" required>
        <label>Category</label><input name="category" placeholder="e.g. Frontend">
        <label>Level</label><input name="level" placeholder="e.g. Advanced">
        <button type="submit">Add skill</button>
      </form>
    </div>

    <div class="card"><h3>Projects</h3>
      <table><tr><th>Name</th><th>Featured</th><th></th></tr>{proj_rows}</table>
      <form method="post" action="/dashboard/projects/add">
        <label>Name</label><input name="name" required>
        <label>Description</label><textarea name="description" rows="3"></textarea>
        <label>Technologies (comma separated)</label><input name="technologies">
        <label>GitHub URL</label><input name="github">
        <label>Live URL</label><input name="live">
        <label><input type="checkbox" name="featured" value="1"> Featured</label>
        <button type="submit">Add project</button>
      </form>
    </div>

    <div class="card"><h3>Experience</h3>
      <table><tr><th>Position</th><th>Company</th><th></th></tr>{exp_rows}</table>
      <form method="post" action="/dashboard/experience/add">
        <label>Company</label><input name="company" required>
        <label>Position</label><input name="position" required>
        <label>Start</label><input name="start">
        <label>End</label><input name="end">
        <label>Description</label><textarea name="description" rows="3"></textarea>
        <button type="submit">Add experience</button>
      </form>
    </div>

    <div class="card"><h3>Education</h3>
      <table><tr><th>Degree</th><th>Institution</th><th></th></tr>{edu_rows}</table>
      <form method="post" action="/dashboard/education/add">
        <label>Institution</label><input name="institution" required>
        <label>Degree</label><input name="degree" required>
        <label>Start</label><input name="start">
        <label>End</label><input name="end">
        <label>Description</label><textarea name="description" rows="3"></textarea>
        <button type="submit">Add education</button>
      </form>
    </div>

    <form class="card" method="post" action="/dashboard/theme">
      <h3>Theme</h3>
      <label>Template</label><select name="template">
        {"".join(f"<option value='{t}' {'selected' if theme.get('template') == t else ''}>{t}</option>" for t in ['modern', 'developer', 'minimal', 'creative', 'professional'])}
      </select>
      <label>Primary color</label><input name="primaryColor" value="{escape(theme.get('primaryColor', '#4f46e5'))}">
      <label>Background color</label><input name="backgroundColor" value="{escape(theme.get('backgroundColor', '#ffffff'))}">
      <label>Text color</label><input name="textColor" value="{escape(theme.get('textColor', '#111827'))}">
      <button type="submit">Save theme</button>
    </form>

    <div class="card"><h3>Sections (visibility + order)</h3>
      <table><tr><th>Section</th><th>Status</th><th>Actions</th></tr>{sec_rows}</table>
    </div>

    <form class="card" method="post" action="/dashboard/settings/credentials">
      <h3>Settings - change login</h3>
      <label>Current password</label><input name="current_password" type="password" required>
      <label>New username</label><input name="new_username" required>
      <label>New password</label><input name="new_password" type="password" required>
      <button type="submit">Update login</button>
    </form>

    </div>"""
    return page("Dashboard", body, p.get("theme"))


@app.post("/dashboard/profile")
def save_profile(
    request: Request,
    name: str = Form(""),
    title: str = Form(""),
    tagline: str = Form(""),
    bio: str = Form(""),
    location: str = Form(""),
    email: str = Form(""),
    phone: str = Form(""),
    siteTitle: str = Form(""),
    description: str = Form(""),
    slug: str = Form(""),
):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    p["profile"].update(
        {"name": name.strip(), "title": title.strip(), "tagline": tagline.strip(),
         "bio": bio.strip(), "location": location.strip(),
         "email": email.strip(), "phone": phone.strip()}
    )
    if siteTitle.strip():
        p["settings"]["siteTitle"] = siteTitle.strip()
    p["settings"]["description"] = description.strip()
    if slug.strip():
        p["settings"]["slug"] = slug.strip().replace(" ", "-").lower()
    save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@app.post("/dashboard/social")
def save_social(
    request: Request,
    github: str = Form(""),
    linkedin: str = Form(""),
    twitter: str = Form(""),
    contact_email: str = Form(""),
):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    p["social"] = {"github": github.strip(), "linkedin": linkedin.strip(),
                   "twitter": twitter.strip(), "email": contact_email.strip()}
    save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@app.post("/dashboard/skills/add")
def skill_add(request: Request, name: str = Form(...),
              category: str = Form(""), level: str = Form("")):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    p["skills"].append({"name": name.strip(), "category": category.strip(), "level": level.strip()})
    save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@app.post("/dashboard/skills/delete")
def skill_delete(request: Request, index: int = Form(...)):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    if 0 <= index < len(p.get("skills", [])):
        p["skills"].pop(index)
        save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@app.post("/dashboard/projects/add")
def project_add(
    request: Request,
    name: str = Form(...),
    description: str = Form(""),
    technologies: str = Form(""),
    github: str = Form(""),
    live: str = Form(""),
    featured: Optional[str] = Form(None),
):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    p["projects"].append({
        "name": name.strip(), "description": description.strip(),
        "technologies": technologies.strip(), "github": github.strip(),
        "live": live.strip(), "featured": bool(featured),
    })
    save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@app.post("/dashboard/projects/delete")
def project_delete(request: Request, index: int = Form(...)):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    if 0 <= index < len(p.get("projects", [])):
        p["projects"].pop(index)
        save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@app.post("/dashboard/experience/add")
def experience_add(
    request: Request,
    company: str = Form(...),
    position: str = Form(...),
    start: str = Form(""),
    end: str = Form(""),
    description: str = Form(""),
):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    p["experience"].append({
        "company": company.strip(), "position": position.strip(),
        "start": start.strip(), "end": end.strip(), "description": description.strip(),
    })
    save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@app.post("/dashboard/experience/delete")
def experience_delete(request: Request, index: int = Form(...)):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    if 0 <= index < len(p.get("experience", [])):
        p["experience"].pop(index)
        save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@app.post("/dashboard/education/add")
def education_add(
    request: Request,
    institution: str = Form(...),
    degree: str = Form(...),
    start: str = Form(""),
    end: str = Form(""),
    description: str = Form(""),
):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    p["education"].append({
        "institution": institution.strip(), "degree": degree.strip(),
        "start": start.strip(), "end": end.strip(), "description": description.strip(),
    })
    save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@app.post("/dashboard/education/delete")
def education_delete(request: Request, index: int = Form(...)):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    if 0 <= index < len(p.get("education", [])):
        p["education"].pop(index)
        save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@app.post("/dashboard/theme")
def save_theme(
    request: Request,
    template: str = Form("modern"),
    primaryColor: str = Form("#4f46e5"),
    backgroundColor: str = Form("#ffffff"),
    textColor: str = Form("#111827"),
):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    if template not in ["modern", "developer", "minimal", "creative", "professional"]:
        template = "modern"
    p["theme"].update({"template": template, "primaryColor": primaryColor.strip(),
                       "backgroundColor": backgroundColor.strip(), "textColor": textColor.strip()})
    save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@app.post("/dashboard/sections/toggle")
def section_toggle(request: Request, sid: str = Form(...)):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    for s in p.get("sections", []):
        if s.get("id") == sid:
            s["visible"] = not s.get("visible", True)
    save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@app.post("/dashboard/sections/move")
def section_move(request: Request, sid: str = Form(...), direction: str = Form(...)):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    secs = sorted(p.get("sections", []), key=lambda x: x.get("order", 99))
    idx = next((i for i, s in enumerate(secs) if s.get("id") == sid), None)
    if idx is not None:
        swap = idx - 1 if direction == "up" else idx + 1
        if 0 <= swap < len(secs):
            secs[idx]["order"], secs[swap]["order"] = secs[swap]["order"], secs[idx]["order"]
            p["sections"] = secs
            save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@app.post("/dashboard/settings/credentials")
def change_credentials(
    request: Request,
    current_password: str = Form(...),
    new_username: str = Form(...),
    new_password: str = Form(...),
):
    if login_required(request):
        return login_required(request)
    users = load_users()
    if not pwd_context.verify(current_password, users.get("password_hash", "")):
        return HTMLResponse("<h3>Current password is wrong.</h3><p><a href='/dashboard'>Back</a></p>",
                            status_code=400)
    new_username = new_username.strip()
    if len(new_username) < 3 or len(new_password) < 6:
        return HTMLResponse(
            "<h3>Username min 3 chars, password min 6 chars.</h3>"
            "<p><a href='/dashboard'>Back</a></p>", status_code=400)
    users.update({"username": new_username,
                  "password_hash": pwd_context.hash(new_password),
                  "is_default": False})
    save_users(users)
    request.session["user"] = new_username
    return RedirectResponse(url="/dashboard", status_code=303)


# ---------------------------------------------------------------- resume ---
def _remove_file_if_local(path_value: str) -> None:
    if not path_value or not path_value.startswith("/static/"):
        return
    target = BASE_DIR / path_value.lstrip("/").replace("/", os.sep)
    try:
        if target.is_file() and UPLOAD_DIR in target.parents:
            target.unlink()
    except OSError:
        pass


@app.post("/dashboard/upload-resume")
async def upload_resume(request: Request, resume: UploadFile = File(...)):
    if login_required(request):
        return login_required(request)
    filename = (resume.filename or "").lower()
    if not filename.endswith(".pdf") or resume.content_type not in (
        "application/pdf", "application/octet-stream"
    ):
        return HTMLResponse(
            "<h3>Only PDF resumes are allowed.</h3><p><a href='/dashboard'>Back</a></p>",
            status_code=400)
    contents = await resume.read()
    if not contents or len(contents) > MAX_RESUME_BYTES:
        return HTMLResponse(
            "<h3>Resume must be a non-empty PDF under 5MB.</h3>"
            "<p><a href='/dashboard'>Back</a></p>", status_code=400)
    if not contents.startswith(b"%PDF"):
        return HTMLResponse(
            "<h3>Uploaded file is not a valid PDF.</h3><p><a href='/dashboard'>Back</a></p>",
            status_code=400)
    ensure_storage()
    new_name = f"resume-{uuid.uuid4().hex}.pdf"
    dest = UPLOAD_DIR / new_name
    dest.write_bytes(contents)
    p = load_portfolio()
    _remove_file_if_local(p.get("profile", {}).get("resume", ""))
    p["profile"]["resume"] = f"/static/uploads/{new_name}"
    save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@app.post("/dashboard/delete-resume")
def delete_resume(request: Request):
    if login_required(request):
        return login_required(request)
    p = load_portfolio()
    _remove_file_if_local(p.get("profile", {}).get("resume", ""))
    p["profile"]["resume"] = ""
    save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000)
