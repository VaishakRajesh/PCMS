import { redirect } from "next/navigation";
import { getPortfolio } from "@/lib/json-db";
import { verifySession } from "@/lib/session";
import {
  addEducation,
  addExperience,
  addProject,
  addSkill,
  deleteEducation,
  deleteExperience,
  deleteProject,
  deleteSkill,
  updateProfile,
  updateSocial,
} from "../actions";

// CONTENT editor: every form posts to a server action in ../actions.ts,
// which saves JSON and revalidates this page + the public portfolio.
// ?error=... (set by failed actions) is shown as a red banner on top.
const input =
  "w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
const label = "mb-1 block text-sm font-semibold";
const card = "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm";
const btn =
  "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500";
const danger =
  "rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await verifySession();
  if (!session) redirect("/login");
  const p = getPortfolio(session.slug);
  if (!p) redirect("/login");
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Content</h1>
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      )}

      {/* Profile + site */}
      <form action={updateProfile} className={card}>
        <h2 className="font-bold">Profile + site</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block"><span className={label}>Name</span><input name="name" defaultValue={p.profile.name} className={input} /></label>
          <label className="block"><span className={label}>Title</span><input name="title" defaultValue={p.profile.title} className={input} /></label>
          <label className="block sm:col-span-2"><span className={label}>Tagline</span><input name="tagline" defaultValue={p.profile.tagline} className={input} /></label>
          <label className="block sm:col-span-2"><span className={label}>Bio</span><textarea name="bio" rows={4} defaultValue={p.profile.bio} className={input} /></label>
          <label className="block"><span className={label}>Location</span><input name="location" defaultValue={p.profile.location} className={input} /></label>
          <label className="block"><span className={label}>Email</span><input name="email" defaultValue={p.profile.email} className={input} /></label>
          <label className="block"><span className={label}>Phone</span><input name="phone" defaultValue={p.profile.phone} className={input} /></label>
          <label className="block"><span className={label}>Site title</span><input name="siteTitle" defaultValue={p.settings.siteTitle} className={input} /></label>
          <label className="block sm:col-span-2"><span className={label}>Site description</span><input name="description" defaultValue={p.settings.description} className={input} /></label>
          <label className="block"><span className={label}>Slug — your address (/{p.settings.slug})</span><input name="slug" defaultValue={p.settings.slug} className={`${input} font-mono`} /></label>
        </div>
        <button className={`${btn} mt-4`}>Save profile</button>
      </form>

      {/* Social */}
      <form action={updateSocial} className={card}>
        <h2 className="font-bold">Social links</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block"><span className={label}>GitHub</span><input name="github" defaultValue={p.social.github} className={input} /></label>
          <label className="block"><span className={label}>LinkedIn</span><input name="linkedin" defaultValue={p.social.linkedin} className={input} /></label>
          <label className="block"><span className={label}>Twitter</span><input name="twitter" defaultValue={p.social.twitter} className={input} /></label>
          <label className="block"><span className={label}>Contact email</span><input name="contact_email" defaultValue={p.social.email} className={input} /></label>
        </div>
        <button className={`${btn} mt-4`}>Save social</button>
      </form>

      {/* Skills */}
      <div className={card}>
        <h2 className="font-bold">Skills</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {p.skills.map((s, i) => (
              <tr key={`${s.name}-${i}`} className="border-t border-gray-100">
                <td className="py-2 font-medium">{s.name}</td>
                <td className="py-2 text-gray-500">{s.category}</td>
                <td className="py-2 text-gray-500">{s.level}</td>
                <td className="py-2 text-right">
                  <form action={deleteSkill}>
                    <input type="hidden" name="index" value={i} />
                    <button className={danger}>Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action={addSkill} className="mt-3 grid gap-3 sm:grid-cols-3">
          <input name="name" required placeholder="Name" className={input} />
          <input name="category" placeholder="Category" className={input} />
          <input name="level" placeholder="Level" className={input} />
          <button className={`${btn} sm:col-span-3 sm:w-fit`}>Add skill</button>
        </form>
      </div>

      {/* Projects */}
      <div className={card}>
        <h2 className="font-bold">Projects</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {p.projects.map((pr, i) => (
              <tr key={`${pr.name}-${i}`} className="border-t border-gray-100">
                <td className="py-2 font-medium">{pr.name} {pr.featured && "⭐"}</td>
                <td className="py-2 text-right">
                  <form action={deleteProject}>
                    <input type="hidden" name="index" value={i} />
                    <button className={danger}>Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action={addProject} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder="Name" className={input} />
          <input name="technologies" placeholder="Technologies (comma separated)" className={input} />
          <textarea name="description" rows={2} placeholder="Description" className={`${input} sm:col-span-2`} />
          <input name="github" placeholder="GitHub URL" className={input} />
          <input name="live" placeholder="Live URL" className={input} />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="featured" value="1" /> Featured
          </label>
          <button className={`${btn} sm:col-span-2 sm:w-fit`}>Add project</button>
        </form>
      </div>

      {/* Experience */}
      <div className={card}>
        <h2 className="font-bold">Experience</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {p.experience.map((e, i) => (
              <tr key={`${e.company}-${e.position}-${i}`} className="border-t border-gray-100">
                <td className="py-2 font-medium">{e.position} <span className="font-normal text-gray-500">at {e.company}</span></td>
                <td className="py-2 text-right">
                  <form action={deleteExperience}>
                    <input type="hidden" name="index" value={i} />
                    <button className={danger}>Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action={addExperience} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="company" required placeholder="Company" className={input} />
          <input name="position" required placeholder="Position" className={input} />
          <input name="start" placeholder="Start" className={input} />
          <input name="end" placeholder="End" className={input} />
          <textarea name="description" rows={2} placeholder="Description" className={`${input} sm:col-span-2`} />
          <button className={`${btn} sm:col-span-2 sm:w-fit`}>Add experience</button>
        </form>
      </div>

      {/* Education */}
      <div className={card}>
        <h2 className="font-bold">Education</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {p.education.map((e, i) => (
              <tr key={`${e.institution}-${e.degree}-${i}`} className="border-t border-gray-100">
                <td className="py-2 font-medium">{e.degree} <span className="font-normal text-gray-500">· {e.institution}</span></td>
                <td className="py-2 text-right">
                  <form action={deleteEducation}>
                    <input type="hidden" name="index" value={i} />
                    <button className={danger}>Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action={addEducation} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="institution" required placeholder="Institution" className={input} />
          <input name="degree" required placeholder="Degree" className={input} />
          <input name="start" placeholder="Start" className={input} />
          <input name="end" placeholder="End" className={input} />
          <textarea name="description" rows={2} placeholder="Description" className={`${input} sm:col-span-2`} />
          <button className={`${btn} sm:col-span-2 sm:w-fit`}>Add education</button>
        </form>
      </div>
    </div>
  );
}
