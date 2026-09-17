# PortfolioCMS — Dynamic Portfolio Builder

Fill in your details once in a dashboard, pick a design, and share your
public portfolio link. Changing the design never deletes your content.

Stack: **Python FastAPI + Jinja2 HTML + plain CSS/JS + JSON files** (no database).

## Quickstart (3 commands)

```bash
pip install -r requirements.txt
python main.py
```

Then open **http://127.0.0.1:8000** in your browser.

## Default login (change immediately!)

| Field    | Value    |
| -------- | -------- |
| URL      | http://127.0.0.1:8000/login |
| Username | `admin`  |
| Password | `admin123` |

After logging in, go to **Dashboard → Settings - change login** and set your
own username/password. The yellow warning banner disappears once you do.

> Demo default only. Never deploy publicly with `admin/admin123`.

## URLs

| URL | What it is |
| --- | ---------- |
| `/` | Public portfolio (what visitors see) |
| `/p/{slug}` | Same portfolio via its slug link (slug editable in dashboard) |
| `/login`, `/logout` | Owner login / logout (no registration page) |
| `/dashboard` | Owner editor (login required) |
| `/docs` | Auto-generated API docs (great for learning FastAPI) |

## What you can do in the dashboard

- Edit profile, site title, slug, social links
- Add/delete skills, projects, experience, education
- Upload a **PDF resume** (max 5MB) → public page gets a Download button
- Pick template + colors, show/hide and reorder sections
- Add a new design: copy `templates/themes/minimal.html` to
  `templates/themes/<name>.html` and edit it — it appears in the
  dashboard dropdown automatically (no code changes)
- Change your login credentials

## Project structure

```text
PCMS/
├── main.py               # entry point: python main.py
├── config.py             # all settings/paths in one place
├── storage.py            # JSON read/write (only file touching data/)
├── security.py           # password hashing + login session helpers
├── routes_public.py      # / and /p/{slug}
├── routes_auth.py        # /login, /logout
├── routes_dashboard.py   # /dashboard + all save/upload actions
├── requirements.txt      # pip install -r requirements.txt
├── templates/            # HTML pages (base/login/dashboard + themes/ designs)
├── static/css/           # stylesheet (+ static/uploads/ for resumes)
├── data/                 # auto-created: users.json, portfolio.json
├── idea.md               # full product idea (long spec)
└── AGENT.md              # rules for AI agents working on this repo
```

## Notes

- The public portfolio shows NO login links — the owner logs in by typing
  `/login` in the browser address bar.
- Storage is **JSON files** (`data/`), good for local/college demo — not for
  serverless hosting with throwaway disks. The `storage.py` layer exists so a
  PostgreSQL swap later won't rewrite the app.
- Uploads accept **PDF only**, size + magic-byte checked, stored with random
  names under `static/uploads/`.
- See `AGENT.md` for contributor/agent conventions.
