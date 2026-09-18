import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import type { Portfolio, User } from "./types";

// JSON "database" layer — the ONLY module allowed to touch data/.
// Routes/actions always call these functions; filesystem details (atomic
// writes, seeding, legacy backup) live here alone, so a later move to
// PostgreSQL means replacing this file, not the whole app.
//
// LAYOUT:
//   data/users.json                -> { users: User[] }
//   data/portfolios/<slug>.json    -> one Portfolio per owner
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const PORTFOLIOS_DIR = path.join(DATA_DIR, "portfolios");

function ensureDirs(): void {
  fs.mkdirSync(PORTFOLIOS_DIR, { recursive: true });
}

// Save safely: write temp file first, then rename over the real one.
// A crash mid-save can never leave half-written JSON behind.
function atomicWriteJson(file: string, data: unknown): void {
  ensureDirs();
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, file);
}

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return null; // missing or corrupt -> caller decides (usually: seed fresh)
  }
}

// -- default documents -------------------------------------------------------

function defaultSections() {
  return [
    { id: "hero", type: "hero", title: "Hero", visible: true, order: 1 },
    { id: "about", type: "about", title: "About", visible: true, order: 2 },
    { id: "skills", type: "skills", title: "Skills", visible: true, order: 3 },
    { id: "projects", type: "projects", title: "Projects", visible: true, order: 4 },
    { id: "experience", type: "experience", title: "Experience", visible: true, order: 5 },
    { id: "education", type: "education", title: "Education", visible: true, order: 6 },
    { id: "contact", type: "contact", title: "Contact", visible: true, order: 7 },
  ];
}

// Demo content for a seeded user. Real users replace this via the dashboard.
function seedPortfolio(opts: {
  slug: string;
  name: string;
  title: string;
  tagline: string;
  bio: string;
  email: string;
  github: string;
  skills: { name: string; category: string; level: string }[];
  projectName: string;
  projectDesc: string;
}): Portfolio {
  return {
    profile: {
      name: opts.name,
      title: opts.title,
      tagline: opts.tagline,
      bio: opts.bio,
      profileImage: "",
      resume: "",
      location: "India",
      email: opts.email,
      phone: "",
    },
    social: { github: opts.github, linkedin: "", twitter: "", email: opts.email },
    theme: {
      template: "modern",
      mode: "light",
      primaryColor: "#4f46e5",
      secondaryColor: "#8b5cf6",
      backgroundColor: "#ffffff",
      textColor: "#111827",
      borderRadius: "12px",
      animations: true,
    },
    sections: defaultSections(),
    skills: opts.skills,
    projects: [
      {
        name: opts.projectName,
        description: opts.projectDesc,
        technologies: "Next.js, TypeScript",
        github: "",
        live: "",
        featured: true,
      },
    ],
    experience: [],
    education: [],
    certifications: [],
    settings: {
      siteTitle: `${opts.name} | ${opts.title}`,
      description: `Portfolio of ${opts.name}`,
      slug: opts.slug,
    },
  };
}

// -- seeding (first boot only) ------------------------------------------------
// Seeds run ONLY when files are missing — existing data is never overwritten.
// Old single-owner users.json (FastAPI era, no "users" array) is backed up
// to users.backup-<timestamp>.json instead of being silently replaced.
function seedIfMissing(): void {
  ensureDirs();
  let users = readJson<{ users: User[] }>(USERS_FILE);
  if (!users || !Array.isArray(users.users)) {
    if (fs.existsSync(USERS_FILE)) {
      const backup = path.join(DATA_DIR, `users.backup-${Date.now()}.json`);
      fs.renameSync(USERS_FILE, backup);
    }
    const seeds: { username: string; password: string; slug: string }[] = [
      { username: "vaishak", password: "vaishak123", slug: "vaishak" },
      { username: "anil", password: "anil123", slug: "anil" },
    ];
    users = {
      users: seeds.map((s) => ({
        username: s.username,
        // hashSync at boot: fine for 2 demo users (~200ms once).
        passwordHash: bcrypt.hashSync(s.password, 10),
        slug: s.slug,
        isDefault: true, // dashboard nags until the password changes
      })),
    };
    atomicWriteJson(USERS_FILE, users);
  }
  const portfolios: Record<string, Portfolio> = {
    vaishak: seedPortfolio({
      slug: "vaishak",
      name: "Vaishak Rajesh",
      title: "Full Stack Developer",
      tagline: "Building modern web applications",
      bio: "I build fast, accessible web apps with React, Next.js and Node.",
      email: "vaishak@example.com",
      github: "https://github.com/vaishak",
      skills: [
        { name: "React", category: "Frontend", level: "Advanced" },
        { name: "Next.js", category: "Frontend", level: "Advanced" },
        { name: "Node.js", category: "Backend", level: "Intermediate" },
      ],
      projectName: "PortfolioCMS",
      projectDesc: "Dynamic portfolio builder with themes and live preview.",
    }),
    anil: seedPortfolio({
      slug: "anil",
      name: "Anil Kumar",
      title: "UI Engineer",
      tagline: "Interfaces with motion and meaning",
      bio: "Frontend engineer obsessed with animation, design systems and DX.",
      email: "anil@example.com",
      github: "https://github.com/anil",
      skills: [
        { name: "TypeScript", category: "Language", level: "Advanced" },
        { name: "Framer Motion", category: "Animation", level: "Advanced" },
        { name: "Tailwind CSS", category: "Styling", level: "Advanced" },
      ],
      projectName: "Motion Gallery",
      projectDesc: "A showcase of production-grade web animations.",
    }),
  };
  for (const [slug, doc] of Object.entries(portfolios)) {
    const file = path.join(PORTFOLIOS_DIR, `${slug}.json`);
    if (!fs.existsSync(file)) atomicWriteJson(file, doc);
  }
}

// -- public API ------------------------------------------------------------------

export function getUsers(): User[] {
  seedIfMissing();
  return readJson<{ users: User[] }>(USERS_FILE)?.users ?? [];
}

export function findUser(username: string): User | null {
  const want = username.trim().toLowerCase();
  return getUsers().find((u) => u.username.toLowerCase() === want) ?? null;
}

export function getPortfolio(slug: string): Portfolio | null {
  seedIfMissing();
  // Slug sanitize: only safe filename chars, so /../../secrets can't escape.
  const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!clean) return null;
  return readJson<Portfolio>(path.join(PORTFOLIOS_DIR, `${clean}.json`));
}

export function portfolioExists(slug: string): boolean {
  return getPortfolio(slug) !== null;
}

// -- writes (dashboard actions; always scoped to the owner's slug) ------------

export function cleanSlug(slug: string): string {
  return slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
}

export function savePortfolio(slug: string, data: Portfolio): void {
  const clean = cleanSlug(slug);
  if (!clean) throw new Error("Invalid portfolio slug.");
  atomicWriteJson(path.join(PORTFOLIOS_DIR, `${clean}.json`), data);
}

// Rename data/portfolios/<old>.json -> <new>.json (slug change).
// Throws when the target slug is taken by someone else's portfolio.
export function renamePortfolioFile(oldSlug: string, newSlug: string): void {
  const from = cleanSlug(oldSlug);
  const to = cleanSlug(newSlug);
  if (!from || !to) throw new Error("Invalid portfolio slug.");
  if (from === to) return;
  const dest = path.join(PORTFOLIOS_DIR, `${to}.json`);
  if (fs.existsSync(dest)) throw new Error("That address (/slug) is already taken.");
  atomicWriteJson(dest, readJson<Portfolio>(path.join(PORTFOLIOS_DIR, `${from}.json`)));
  try {
    fs.unlinkSync(path.join(PORTFOLIOS_DIR, `${from}.json`));
  } catch {
    // new file is already saved; a leftover old file is harmless
  }
}

// Change username and/or password for one account. Returns updated user,
// or null when the account vanished. Also clears the isDefault flag.
export function updateUserCredentials(
  currentUsername: string,
  update: { username?: string; passwordHash?: string }
): User | null {
  seedIfMissing();
  const users = readJson<{ users: User[] }>(USERS_FILE)?.users ?? [];
  const idx = users.findIndex(
    (u) => u.username.toLowerCase() === currentUsername.trim().toLowerCase()
  );
  if (idx === -1) return null;
  if (update.username) {
    const name = update.username.trim();
    if (name.length < 3) throw new Error("Username needs at least 3 characters.");
    const taken = users.some(
      (u, i) => i !== idx && u.username.toLowerCase() === name.toLowerCase()
    );
    if (taken) throw new Error("That username is already taken.");
    users[idx].username = name;
  }
  if (update.passwordHash) users[idx].passwordHash = update.passwordHash;
  users[idx].isDefault = false;
  atomicWriteJson(USERS_FILE, { users });
  return users[idx];
}

// Point an account at a (renamed) portfolio slug.
export function setUserSlug(username: string, slug: string): void {
  seedIfMissing();
  const users = readJson<{ users: User[] }>(USERS_FILE)?.users ?? [];
  const user = users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (!user) throw new Error("Account not found.");
  user.slug = cleanSlug(slug);
  atomicWriteJson(USERS_FILE, { users });
}

// Uploads live in public/uploads/ and are served at /uploads/<file>.
export function uploadsDir(): string {
  const dir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Delete an old upload, but ONLY inside public/uploads/.
// basename() strips any ../ trickery, so project files can never be hit.
export function deletePublicUpload(urlPath: string): void {
  if (!urlPath || !urlPath.startsWith("/uploads/")) return;
  const target = path.join(uploadsDir(), path.basename(urlPath));
  try {
    if (fs.statSync(target).isFile()) fs.unlinkSync(target);
  } catch {
    // already gone -> nothing to do
  }
}
