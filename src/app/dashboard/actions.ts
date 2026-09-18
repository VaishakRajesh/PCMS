"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, verifySession } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import {
  cleanSlug,
  findUser,
  getPortfolio,
  portfolioExists,
  renamePortfolioFile,
  savePortfolio,
  setUserSlug,
  updateUserCredentials,
} from "@/lib/json-db";
import { DEFAULT_TEMPLATE, isTemplate } from "@/lib/themes";

// Every CMS action starts here: logged out -> /login, missing data -> /login.
// Scope rule: you can ONLY touch the portfolio in YOUR session (session.slug);
// the URL/body never decides whose data changes, so IDOR is impossible.
async function owner() {
  const session = await verifySession();
  if (!session) redirect("/login");
  const p = getPortfolio(session.slug);
  if (!p) redirect("/login");
  return { session, p };
}

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();

// Send the user back to the form with a message (?error=... shown by the page).
function fail(dashPath: string, err: unknown): never {
  const msg = err instanceof Error ? err.message : "Something went wrong.";
  redirect(`${dashPath}?error=${encodeURIComponent(msg)}`);
}

// Refresh the edited dashboard page AND the public portfolio page.
function done(sessionSlug: string, dashPath: string): void {
  revalidatePath(dashPath);
  revalidatePath(`/${sessionSlug}`);
}

// -- profile + site ------------------------------------------------------------
export async function updateProfile(formData: FormData): Promise<void> {
  const { session, p } = await owner();
  let slug = session.slug;
  // Slug rename = new address (/old -> /new): move the JSON file + account.
  const wanted = cleanSlug(str(formData.get("slug")));
  if (wanted && wanted !== session.slug) {
    if (!/^[a-z0-9-]+$/.test(wanted)) fail("/dashboard/content", "Slug: letters, numbers and dashes only.");
    if (portfolioExists(wanted)) fail("/dashboard/content", "That address (/slug) is already taken.");
    try {
      renamePortfolioFile(session.slug, wanted);
      setUserSlug(session.username, wanted);
    } catch (e) {
      fail("/dashboard/content", e);
    }
    await createSession({ username: session.username, slug: wanted });
    slug = wanted;
  }
  p.settings.slug = slug; // keep URL, file, and saved slug in agreement
  p.profile.name = str(formData.get("name"));
  p.profile.title = str(formData.get("title"));
  p.profile.tagline = str(formData.get("tagline"));
  p.profile.bio = str(formData.get("bio"));
  p.profile.location = str(formData.get("location"));
  p.profile.email = str(formData.get("email"));
  p.profile.phone = str(formData.get("phone"));
  const siteTitle = str(formData.get("siteTitle"));
  if (siteTitle) p.settings.siteTitle = siteTitle;
  p.settings.description = str(formData.get("description"));
  try {
    savePortfolio(slug, p);
  } catch (e) {
    fail("/dashboard/content", e);
  }
  done(slug, "/dashboard/content");
}

// -- social ---------------------------------------------------------------------
export async function updateSocial(formData: FormData): Promise<void> {
  const { session, p } = await owner();
  p.social = {
    github: str(formData.get("github")),
    linkedin: str(formData.get("linkedin")),
    twitter: str(formData.get("twitter")),
    email: str(formData.get("contact_email")),
  };
  savePortfolio(session.slug, p);
  done(session.slug, "/dashboard/content");
}

// -- skills ----------------------------------------------------------------------
export async function addSkill(formData: FormData): Promise<void> {
  const { session, p } = await owner();
  const name = str(formData.get("name"));
  if (!name) fail("/dashboard/content", "Skill needs a name.");
  p.skills.push({ name, category: str(formData.get("category")), level: str(formData.get("level")) });
  savePortfolio(session.slug, p);
  done(session.slug, "/dashboard/content");
}

export async function deleteSkill(formData: FormData): Promise<void> {
  const { session, p } = await owner();
  const index = Number(formData.get("index"));
  if (Number.isInteger(index) && index >= 0 && index < p.skills.length) {
    p.skills.splice(index, 1);
    savePortfolio(session.slug, p);
  }
  done(session.slug, "/dashboard/content");
}

// -- projects ----------------------------------------------------------------------
export async function addProject(formData: FormData): Promise<void> {
  const { session, p } = await owner();
  const name = str(formData.get("name"));
  if (!name) fail("/dashboard/content", "Project needs a name.");
  p.projects.push({
    name,
    description: str(formData.get("description")),
    technologies: str(formData.get("technologies")),
    github: str(formData.get("github")),
    live: str(formData.get("live")),
    featured: formData.get("featured") === "1", // checkbox: "1" if ticked
  });
  savePortfolio(session.slug, p);
  done(session.slug, "/dashboard/content");
}

export async function deleteProject(formData: FormData): Promise<void> {
  const { session, p } = await owner();
  const index = Number(formData.get("index"));
  if (Number.isInteger(index) && index >= 0 && index < p.projects.length) {
    p.projects.splice(index, 1);
    savePortfolio(session.slug, p);
  }
  done(session.slug, "/dashboard/content");
}

// -- experience ----------------------------------------------------------------------
export async function addExperience(formData: FormData): Promise<void> {
  const { session, p } = await owner();
  const company = str(formData.get("company"));
  const position = str(formData.get("position"));
  if (!company || !position) fail("/dashboard/content", "Experience needs a company and a position.");
  p.experience.push({
    company, position,
    start: str(formData.get("start")), end: str(formData.get("end")),
    description: str(formData.get("description")),
  });
  savePortfolio(session.slug, p);
  done(session.slug, "/dashboard/content");
}

export async function deleteExperience(formData: FormData): Promise<void> {
  const { session, p } = await owner();
  const index = Number(formData.get("index"));
  if (Number.isInteger(index) && index >= 0 && index < p.experience.length) {
    p.experience.splice(index, 1);
    savePortfolio(session.slug, p);
  }
  done(session.slug, "/dashboard/content");
}

// -- education ----------------------------------------------------------------------
export async function addEducation(formData: FormData): Promise<void> {
  const { session, p } = await owner();
  const institution = str(formData.get("institution"));
  const degree = str(formData.get("degree"));
  if (!institution || !degree) fail("/dashboard/content", "Education needs an institution and a degree.");
  p.education.push({
    institution, degree,
    start: str(formData.get("start")), end: str(formData.get("end")),
    description: str(formData.get("description")),
  });
  savePortfolio(session.slug, p);
  done(session.slug, "/dashboard/content");
}

export async function deleteEducation(formData: FormData): Promise<void> {
  const { session, p } = await owner();
  const index = Number(formData.get("index"));
  if (Number.isInteger(index) && index >= 0 && index < p.education.length) {
    p.education.splice(index, 1);
    savePortfolio(session.slug, p);
  }
  done(session.slug, "/dashboard/content");
}

// -- theme + sections ----------------------------------------------------------------------
export async function updateTheme(formData: FormData): Promise<void> {
  const { session, p } = await owner();
  const template = str(formData.get("template"));
  // Unknown template names fall back instead of breaking the public page.
  p.theme.template = isTemplate(template) ? template : DEFAULT_TEMPLATE;
  p.theme.primaryColor = str(formData.get("primaryColor")) || p.theme.primaryColor;
  p.theme.backgroundColor = str(formData.get("backgroundColor")) || p.theme.backgroundColor;
  p.theme.textColor = str(formData.get("textColor")) || p.theme.textColor;
  savePortfolio(session.slug, p);
  done(session.slug, "/dashboard/design");
}

// Show/hide one section. Content is kept — only visibility flips.
export async function toggleSection(formData: FormData): Promise<void> {
  const { session, p } = await owner();
  const section = p.sections.find((s) => s.id === str(formData.get("sid")));
  if (section) {
    section.visible = !section.visible;
    savePortfolio(session.slug, p);
  }
  done(session.slug, "/dashboard/design");
}

// Move a section up/down by swapping its `order` with its neighbour.
export async function moveSection(formData: FormData): Promise<void> {
  const { session, p } = await owner();
  const sid = str(formData.get("sid"));
  const dir = str(formData.get("direction"));
  const secs = [...p.sections].sort((a, b) => a.order - b.order);
  const idx = secs.findIndex((s) => s.id === sid);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (idx !== -1 && swap >= 0 && swap < secs.length) {
    [secs[idx].order, secs[swap].order] = [secs[swap].order, secs[idx].order];
    p.sections = secs;
    savePortfolio(session.slug, p);
  }
  done(session.slug, "/dashboard/design");
}

// -- change login ----------------------------------------------------------------------
export async function changeCredentials(formData: FormData): Promise<void> {
  const { session } = await owner();
  const user = findUser(session.username);
  if (!user) redirect("/login");
  const ok = await verifyPassword(
    str(formData.get("current_password")),
    user.passwordHash
  );
  if (!ok) fail("/dashboard/settings", "Current password is wrong.");
  const newUsername = str(formData.get("new_username"));
  const newPassword = str(formData.get("new_password"));
  if (newPassword.length < 6) fail("/dashboard/settings", "New password needs at least 6 characters.");
  try {
    const updated = updateUserCredentials(session.username, {
      username: newUsername,
      passwordHash: await hashPassword(newPassword),
    });
    if (!updated) redirect("/login");
    // Stay logged in under the (possibly new) username.
    await createSession({ username: updated.username, slug: updated.slug });
  } catch (e) {
    fail("/dashboard/settings", e);
  }
  redirect("/dashboard/settings");
}
