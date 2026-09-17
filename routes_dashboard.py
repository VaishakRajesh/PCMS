"""Dashboard routes - the OWNER editor. Login REQUIRED for all of these.

Pattern for every POST below (Post/Redirect/Get):
  1. Deny logged-out users (back to /login).
  2. Load portfolio JSON, change it, save it.
  3. Redirect (303) back to /dashboard so refresh never re-submits.

Routes:
  GET  /dashboard                        -> editor page
  POST /dashboard/profile                -> name/title/bio/site/slug
  POST /dashboard/social                 -> github/linkedin/twitter/email
  POST /dashboard/skills/add|delete      -> skills list
  POST /dashboard/projects/add|delete    -> projects list
  POST /dashboard/experience/add|delete  -> experience list
  POST /dashboard/education/add|delete   -> education list
  POST /dashboard/theme                  -> template + colors
  POST /dashboard/sections/toggle|move   -> visibility + order
  POST /dashboard/settings/credentials   -> change username/password
  POST /dashboard/upload-resume          -> PDF upload (5MB max)
  POST /dashboard/delete-resume          -> remove resume
"""

import uuid
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

import config
import security
import storage

router = APIRouter()
templates = Jinja2Templates(directory=str(config.TEMPLATES_DIR))


def _deny(request: Request):
    """Shared guard: returns redirect when logged out, else None."""
    return security.login_required(request)


def _dash(request: Request, msg: str = ""):
    """Render templates/dashboard.html with everything the editor needs."""
    p = storage.load_portfolio()
    sections = sorted(p.get("sections", []), key=lambda s: s.get("order", 99))
    return templates.TemplateResponse(
        request,
        "dashboard.html",
        {"request": request, "p": p, "sections": sections,
         "warn": security.is_default_password(), "msg": msg,
         "allowed_templates": config.available_templates(),
         "theme": p.get("theme", {}), "settings": p.get("settings", {})},
    )


@router.get("/dashboard")
def dashboard(request: Request):
    """Show the editor page."""
    denied = _deny(request)
    if denied:
        return denied
    return _dash(request)


# -- profile + social ---------------------------------------------------------
@router.post("/dashboard/profile")
def save_profile(
    request: Request,
    name: str = Form(""), title: str = Form(""), tagline: str = Form(""),
    bio: str = Form(""), location: str = Form(""), email: str = Form(""),
    phone: str = Form(""), siteTitle: str = Form(""),
    description: str = Form(""), slug: str = Form(""),
):
    """Save profile + site settings. Slug becomes the /p/{slug} link."""
    denied = _deny(request)
    if denied:
        return denied
    p = storage.load_portfolio()
    p["profile"].update({
        "name": name.strip(), "title": title.strip(), "tagline": tagline.strip(),
        "bio": bio.strip(), "location": location.strip(),
        "email": email.strip(), "phone": phone.strip()})
    if siteTitle.strip():
        p["settings"]["siteTitle"] = siteTitle.strip()
    p["settings"]["description"] = description.strip()
    if slug.strip():  # keep URLs safe: lowercase, dashes, no spaces
        p["settings"]["slug"] = slug.strip().replace(" ", "-").lower()
    storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@router.post("/dashboard/social")
def save_social(
    request: Request, github: str = Form(""), linkedin: str = Form(""),
    twitter: str = Form(""), contact_email: str = Form(""),
):
    """Save social / contact links shown in the Contact section."""
    denied = _deny(request)
    if denied:
        return denied
    p = storage.load_portfolio()
    p["social"] = {"github": github.strip(), "linkedin": linkedin.strip(),
                   "twitter": twitter.strip(), "email": contact_email.strip()}
    storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


# -- skills --------------------------------------------------------------------
@router.post("/dashboard/skills/add")
def skill_add(request: Request, name: str = Form(...),
              category: str = Form(""), level: str = Form("")):
    """Append one skill row."""
    denied = _deny(request)
    if denied:
        return denied
    p = storage.load_portfolio()
    p["skills"].append({"name": name.strip(),
                        "category": category.strip(), "level": level.strip()})
    storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@router.post("/dashboard/skills/delete")
def skill_delete(request: Request, index: int = Form(...)):
    """Remove the skill at position `index` (bounds-checked)."""
    denied = _deny(request)
    if denied:
        return denied
    p = storage.load_portfolio()
    if 0 <= index < len(p.get("skills", [])):
        p["skills"].pop(index)
        storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


# -- projects -------------------------------------------------------------------
@router.post("/dashboard/projects/add")
def project_add(
    request: Request, name: str = Form(...), description: str = Form(""),
    technologies: str = Form(""), github: str = Form(""), live: str = Form(""),
    featured: Optional[str] = Form(None),  # checkbox: "1" if ticked, None if not
):
    """Append one project card."""
    denied = _deny(request)
    if denied:
        return denied
    p = storage.load_portfolio()
    p["projects"].append({
        "name": name.strip(), "description": description.strip(),
        "technologies": technologies.strip(), "github": github.strip(),
        "live": live.strip(), "featured": bool(featured)})
    storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@router.post("/dashboard/projects/delete")
def project_delete(request: Request, index: int = Form(...)):
    """Remove the project at position `index` (bounds-checked)."""
    denied = _deny(request)
    if denied:
        return denied
    p = storage.load_portfolio()
    if 0 <= index < len(p.get("projects", [])):
        p["projects"].pop(index)
        storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


# -- experience ------------------------------------------------------------------
@router.post("/dashboard/experience/add")
def experience_add(
    request: Request, company: str = Form(...), position: str = Form(...),
    start: str = Form(""), end: str = Form(""), description: str = Form(""),
):
    """Append one job entry."""
    denied = _deny(request)
    if denied:
        return denied
    p = storage.load_portfolio()
    p["experience"].append({
        "company": company.strip(), "position": position.strip(),
        "start": start.strip(), "end": end.strip(), "description": description.strip()})
    storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@router.post("/dashboard/experience/delete")
def experience_delete(request: Request, index: int = Form(...)):
    """Remove the experience entry at position `index` (bounds-checked)."""
    denied = _deny(request)
    if denied:
        return denied
    p = storage.load_portfolio()
    if 0 <= index < len(p.get("experience", [])):
        p["experience"].pop(index)
        storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


# -- education --------------------------------------------------------------------
@router.post("/dashboard/education/add")
def education_add(
    request: Request, institution: str = Form(...), degree: str = Form(...),
    start: str = Form(""), end: str = Form(""), description: str = Form(""),
):
    """Append one education entry."""
    denied = _deny(request)
    if denied:
        return denied
    p = storage.load_portfolio()
    p["education"].append({
        "institution": institution.strip(), "degree": degree.strip(),
        "start": start.strip(), "end": end.strip(), "description": description.strip()})
    storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@router.post("/dashboard/education/delete")
def education_delete(request: Request, index: int = Form(...)):
    """Remove the education entry at position `index` (bounds-checked)."""
    denied = _deny(request)
    if denied:
        return denied
    p = storage.load_portfolio()
    if 0 <= index < len(p.get("education", [])):
        p["education"].pop(index)
        storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


# -- theme + sections ---------------------------------------------------------------
@router.post("/dashboard/theme")
def save_theme(
    request: Request, template: str = Form("modern"),
    primaryColor: str = Form("#4f46e5"),
    backgroundColor: str = Form("#ffffff"), textColor: str = Form("#111827"),
):
    """Save template choice + colors. Unknown template names are rejected."""
    denied = _deny(request)
    if denied:
        return denied
    p = storage.load_portfolio()
    if template not in config.available_templates():
        template = "modern"
    p["theme"].update({"template": template, "primaryColor": primaryColor.strip(),
                       "backgroundColor": backgroundColor.strip(),
                       "textColor": textColor.strip()})
    storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@router.post("/dashboard/sections/toggle")
def section_toggle(request: Request, sid: str = Form(...)):
    """Show/hide one section on the public page (content is kept)."""
    denied = _deny(request)
    if denied:
        return denied
    p = storage.load_portfolio()
    for s in p.get("sections", []):
        if s.get("id") == sid:
            s["visible"] = not s.get("visible", True)
    storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@router.post("/dashboard/sections/move")
def section_move(request: Request, sid: str = Form(...), direction: str = Form(...)):
    """Move a section up/down by swapping its `order` with its neighbour."""
    denied = _deny(request)
    if denied:
        return denied
    p = storage.load_portfolio()
    secs = sorted(p.get("sections", []), key=lambda x: x.get("order", 99))
    idx = next((i for i, s in enumerate(secs) if s.get("id") == sid), None)
    if idx is not None:
        swap = idx - 1 if direction == "up" else idx + 1
        if 0 <= swap < len(secs):
            secs[idx]["order"], secs[swap]["order"] = (
                secs[swap]["order"], secs[idx]["order"])
            p["sections"] = secs
            storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


# -- change login ----------------------------------------------------------------------
@router.post("/dashboard/settings/credentials")
def change_credentials(
    request: Request, current_password: str = Form(...),
    new_username: str = Form(...), new_password: str = Form(...),
):
    """Change the owner login. Must prove the CURRENT password first.

    On success the default-password warning disappears (is_default=False).
    """
    denied = _deny(request)
    if denied:
        return denied
    users = storage.load_users()
    if not security.verify_password(current_password, users.get("password_hash", "")):
        return HTMLResponse(
            "<h3>Current password is wrong.</h3><p><a href='/dashboard'>Back</a></p>",
            status_code=400)
    new_username = new_username.strip()
    if len(new_username) < 3 or len(new_password) < 6:
        return HTMLResponse(
            "<h3>Username min 3 chars, password min 6 chars.</h3>"
            "<p><a href='/dashboard'>Back</a></p>", status_code=400)
    users.update({"username": new_username,
                  "password_hash": security.hash_password(new_password),
                  "is_default": False})
    storage.save_users(users)
    request.session["user"] = new_username  # stay logged in under the new name
    return RedirectResponse(url="/dashboard", status_code=303)


# -- resume upload -----------------------------------------------------------------------
async def _reject(message: str) -> HTMLResponse:
    """Small helper: 400 page with a Back link for upload errors."""
    return HTMLResponse(
        f"<h3>{message}</h3><p><a href='/dashboard'>Back</a></p>", status_code=400)


@router.post("/dashboard/upload-resume")
async def upload_resume(request: Request, resume: UploadFile = File(...)):
    """Upload a PDF resume. Four safety checks, in order:
    1. File extension (.pdf) + upload mime type.
    2. Size: non-empty and under MAX_RESUME_BYTES (5MB).
    3. Magic bytes: real PDFs start with b"%PDF".
    4. Random server filename (uuid) so the original name can't attack us.
    The old resume file is deleted after the new one is saved.
    """
    denied = _deny(request)
    if denied:
        return denied
    filename = (resume.filename or "").lower()
    if not filename.endswith(".pdf") or resume.content_type not in (
            "application/pdf", "application/octet-stream"):
        return await _reject("Only PDF resumes are allowed.")
    contents = await resume.read()
    if not contents or len(contents) > config.MAX_RESUME_BYTES:
        return await _reject("Resume must be a non-empty PDF under 5MB.")
    if not contents.startswith(b"%PDF"):
        return await _reject("Uploaded file is not a valid PDF.")
    storage.ensure_dirs()
    new_name = f"resume-{uuid.uuid4().hex}.pdf"  # unpredictable, always safe
    (config.UPLOAD_DIR / new_name).write_bytes(contents)
    p = storage.load_portfolio()
    storage.delete_local_static_file(p.get("profile", {}).get("resume", ""))
    p["profile"]["resume"] = f"/static/uploads/{new_name}"
    storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)


@router.post("/dashboard/delete-resume")
def delete_resume(request: Request):
    """Remove the resume file (if any) and clear its link from the JSON."""
    denied = _deny(request)
    if denied:
        return denied
    p = storage.load_portfolio()
    storage.delete_local_static_file(p.get("profile", {}).get("resume", ""))
    p["profile"]["resume"] = ""
    storage.save_portfolio(p)
    return RedirectResponse(url="/dashboard", status_code=303)
