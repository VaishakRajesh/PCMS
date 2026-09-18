# AGENT.md — working rules for this repo (humans + AI agents)

## Stack

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4 + framer-motion
+ JSON files. Run: `npm install`, then `npm run dev`. No database.
No registration page. (Python FastAPI files remain in root, retired —
delete them when the Next.js app is confirmed working.)

## File map (respect it)

| File | Owns |
| ---- | ---- |
| `src/app/*` | Routes only: landing, login, `[slug]` portfolio, dashboard (Phase 2) |
| `src/components/templates/*` | One design per file; receives full `Portfolio` as prop `p` |
| `src/components/portfolio/ui.tsx` | Shared bits: `Reveal`, `SectionTitle`, theme vars, section order |
| `src/lib/types.ts` | THE data model — change shapes here first, JSON follows |
| `src/lib/json-db.ts` | ONLY module touching `data/` (atomic writes, seeds, legacy backup) |
| `src/lib/session.ts` | jose cookie sessions — Edge-safe, the only auth import in middleware |
| `src/lib/passwords.ts` | bcryptjs — server-only, NEVER import from middleware/client |
| `src/lib/themes.ts` | Template registry (add design = file + 1 registry line + 1 page case) |
| `middleware.ts` | Logged-out `/dashboard*` → `/login` |
| `src/app/dashboard/*` | CMS pages (overview/content/design/media/settings) + `actions.ts` mutations |
| `src/app/api/resume/route.ts` | Resume upload/delete API (PDF-only, validated) |

## Hard rules

1. **Multi-user, no `/register`.** Accounts seeded in `data/users.json`
   (`vaishak`, `anil`); each owns one `data/portfolios/<slug>.json`.
   New users = documented JSON entries until Phase 2 user management.
2. **JSON-only storage.** All persistence via `src/lib/json-db.ts` with
   atomic temp-file writes. Routes/actions never touch `fs` directly.
   Seeds fill MISSING files only; legacy single-owner JSON gets timestamped
   backup, never silent overwrite.
3. **Auth on every mutation.** Dashboard + all write actions verify the
   session and scope edits to `session.slug`. Public routes never expose
   edit controls or password hashes. Never log secrets.
4. **Slug safety.** `[slug]` input is sanitized (`[a-z0-9-]`) and must match
   the file's saved `settings.slug`, else `notFound()`.
5. **Uploads: PDF only**, size + `%PDF` magic-byte checked in
   `src/app/api/resume/route.ts`, uuid filenames under `public/uploads/`,
   old file removed on replace.
6. **Templates: content is sacred.** Switching `theme.template` changes
   design only; unknown ids fall back via `resolveTemplate()`. React
   auto-escapes by default — never use `dangerouslySetInnerHTML` on user data.
7. **Motion with taste.** framer-motion for entrances/scrolls/hovers
   (`Reveal` wrapper, `once: true` viewports); respect reduced motion for
   Phase 2 theme `animations: false`.
8. **Server/Client split.** Data fetching + secrets stay in Server
   Components/actions; `"use client"` only where motion/forms need it.
   `passwords.ts` and `json-db.ts` never ship to the browser.
9. **Minimal diffs.** Match existing commented style. No new deps, DBs, or
   features without an approved plan. `npm run build` must stay green.
10. **Validate.** Re-read touched files; user runs `npm install`, `npm run
    dev` (/, /login → /dashboard, edits reflect on /slug, upload works,
    logged-out /dashboard bounces to /login), and `npm run build` green.
