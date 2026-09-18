# PortfolioCMS — Dynamic Portfolio Builder

Fill in your details once, pick a design, and share your public portfolio
link. Changing the design never deletes your content.

Stack: **Next.js + React + TypeScript + Tailwind CSS + framer-motion + JSON files** (no database).

## Quickstart

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**.

```bash
npm run build   # production build — must pass with zero errors
npm start       # run the production build locally
```

Copy `.env.example` to `.env` and set a real `SESSION_SECRET` for anything
shared. Dev works without it (insecure fallback, localhost only).

## Demo logins (change immediately!)

| Username | Password | Portfolio |
| -------- | -------- | --------- |
| `vaishak` | `vaishak123` | http://localhost:3000/vaishak |
| `anil` | `anil123` | http://localhost:3000/anil |

Login at **http://localhost:3000/login** (no registration page by design).
After login you land in your dashboard. Change your password anytime in
**Dashboard → Settings** (current password required; the warning banner
clears once the default is gone).

> Demo defaults only. Never deploy publicly with these passwords.

## URLs

| URL | What it is |
| --- | ---------- |
| `/` | Landing page with live demo links |
| `/login` | Owner login (no registration) |
| `/vaishak`, `/anil`, … | Public portfolio per JSON slug (`data/portfolios/<slug>.json`) |
| `/dashboard` | Owner CMS: overview, content, design, media, settings (login required) |

Each portfolio's browser title/description come from its own JSON settings.

## Project structure

```text
PCMS/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # font, metadata, global CSS
│   │   ├── page.tsx          # animated landing page
│   │   ├── login/            # login form (page.tsx) + server action (actions.ts)
│   │   ├── [slug]/page.tsx   # public portfolio: /vaishak, /anil, …
│   │   ├── not-found.tsx     # unknown slug page
│   │   └── globals.css       # Tailwind v4 + theme tokens
│   ├── components/
│   │   ├── templates/        # Modern.tsx (animated), Minimal.tsx (CSS-only)
│   │   └── portfolio/ui.tsx  # Reveal, SectionTitle, theme vars, section order
│   ├── lib/
│   │   ├── types.ts          # the JSON data model (single source of truth)
│   │   ├── json-db.ts        # atomic JSON read/write + first-boot seeds
│   │   ├── session.ts        # jose cookie sessions (Edge-safe)
│   │   ├── passwords.ts      # bcryptjs hashing (server-only)
│   │   └── themes.ts         # template registry (add design = 1 file + 1 line)
│   └── middleware.ts         # redirects logged-out /dashboard* → /login
├── data/                     # auto-created: users.json, portfolios/*.json
├── public/                   # static assets + uploads (served at /…)
├── Dockerfile                # production multi-stage build (standalone)
├── idea.md                   # full product spec (long)
└── AGENT.md                  # rules for AI agents working on this repo
```

## Add a new design (2 steps)

1. Copy `src/components/templates/Minimal.tsx` → `src/components/templates/<Name>.tsx`, edit it (it receives the full `Portfolio` as prop `p`).
2. Add one line to `TEMPLATES` in `src/lib/themes.ts` + one case in `src/app/[slug]/page.tsx`.

## Deployment

**Recommended: Docker on any VPS / Render / Fly** (persistent disk required):

```bash
docker build -t portfoliocms .
docker run -p 3000:3000 \
  -e SESSION_SECRET="long-random-string" \
  -v pcms-data:/app/data -v pcms-uploads:/app/public/uploads \
  portfoliocms
```

- Mount persistent volumes at `/app/data` (and `/app/public/uploads`), or
  portfolios reset on every redeploy.
- Set `SESSION_SECRET` env — logins break across restarts without a stable one.

**Not recommended: Vercel / serverless.** Writable JSON files don't survive
there (ephemeral filesystem) — every redeploy wipes portfolios. The isolated
`src/lib/json-db.ts` layer exists precisely so a PostgreSQL swap later won't
rewrite the app.

## Roadmap

- **Phase 1 (this):** scaffold, auth, public portfolios, 2 animated templates, docs, Docker.
- **Phase 2 (done):** dashboard editor + resume upload API.
- **Phase 3:** Developer / Creative / Professional templates, version history.
