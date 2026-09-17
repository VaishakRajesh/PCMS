# AGENT.md — working rules for this repo (humans + AI agents)

## Stack

Python FastAPI + Jinja2 (`templates/`) + plain CSS/JS + JSON files.
Run: `pip install -r requirements.txt`, then `python main.py`.
No frontend build step. No database. No registration page.

## File map (respect it)

| File | Owns |
| ---- | ---- |
| `main.py` | Wiring only: app, session middleware, `/static` mount, routers, Uvicorn |
| `config.py` | Every path, secret, default, limit — settings change HERE only |
| `storage.py` | ONLY file that reads/writes `data/` + deletes uploads |
| `security.py` | Hashing, session helpers, `login_required`, default-password flag |
| `routes_public.py` | `/`, `/p/{slug}` (no login) |
| `routes_auth.py` | `/login`, `/logout` |
| `routes_dashboard.py` | `/dashboard*` (login required) + resume upload |
| `templates/` | All HTML (`base.html` shell; `themes/<name>.html` designs; `_`-prefixed files are partials) |
| `static/` | CSS + uploads (never put Python here) |

## Hard rules

1. **Single owner, no `/register`.** One admin seeded from
   `ADMIN_USERNAME`/`ADMIN_PASSWORD` (default `admin`/`admin123`).
   Credential changes only via `POST /dashboard/settings/credentials`
   with current-password check.
2. **JSON-only storage.** All persistence goes through `storage.py` with
   atomic temp-file writes. Routes never touch the filesystem directly
   (except validated resume bytes via `config.UPLOAD_DIR`).
3. **Auth on every edit.** Every `/dashboard*` route calls
   `login_required()` first. Public routes must never expose edit controls.
4. **Never expose password hashes** in responses, templates, or logs.
5. **Uploads: PDF only**, ≤ `MAX_RESUME_BYTES`, `%PDF` magic-byte check,
   uuid filename, old file removed. Delete helper must stay inside
   `static/uploads/` (no path traversal).
6. **Templates: autoescape stays ON.** Never use `| safe` on user content.
   Dynamic styling only via theme CSS variables in `base.html`.
7. **Templates are files, switching preserves content.** Designs live in
   `templates/themes/<name>.html` sharing the `_sections.html` partial;
   the dropdown is auto-discovered via `config.available_templates()`.
   New theme = copy `minimal.html`, rename, edit. Unknown/missing values
   fall back to `modern` (`_theme_template()` in `routes_public.py`).
8. **Post/Redirect/Get.** POST handlers end with `RedirectResponse(..., 303)`
   to `/dashboard`; error pages use 400, unknown slugs 404, bad login 401.
9. **Minimal diffs.** Match existing style (commented, plain FastAPI).
   Don't add deps, packages, DBs, or features without an approved plan.
10. **Validate.** Re-read touched files; ask the user to run
    `pip install -r requirements.txt` + `python main.py` and check
    login → edit → public page → resume upload.
