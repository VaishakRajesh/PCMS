import { redirect } from "next/navigation";
import { getPortfolio } from "@/lib/json-db";
import { verifySession } from "@/lib/session";
import { TEMPLATES, availableTemplates } from "@/lib/themes";
import { moveSection, toggleSection, updateTheme } from "../actions";

// DESIGN editor: template picker (from the registry — new designs appear
// here automatically), theme colors, and section visibility + order.
// Switching templates never touches content, only the design.
const input =
  "w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
const card = "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm";

export default async function DesignPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await verifySession();
  if (!session) redirect("/login");
  const p = getPortfolio(session.slug);
  if (!p) redirect("/login");
  const { error } = await searchParams;
  const sections = [...p.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Design</h1>
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      )}

      <form action={updateTheme} className={card}>
        <h2 className="font-bold">Theme</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold">Template</span>
            <select name="template" defaultValue={p.theme.template} className={input}>
              {availableTemplates().map((id) => (
                <option key={id} value={id}>
                  {TEMPLATES[id].label} — {TEMPLATES[id].blurb}
                </option>
              ))}
            </select>
          </label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Primary color</span><input name="primaryColor" defaultValue={p.theme.primaryColor} className={`${input} font-mono`} /></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Background</span><input name="backgroundColor" defaultValue={p.theme.backgroundColor} className={`${input} font-mono`} /></label>
          <label className="block"><span className="mb-1 block text-sm font-semibold">Text color</span><input name="textColor" defaultValue={p.theme.textColor} className={`${input} font-mono`} /></label>
        </div>
        <button className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          Save theme
        </button>
      </form>

      <div className={card}>
        <h2 className="font-bold">Sections (visibility + order)</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {sections.map((s) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="py-2 font-medium">{s.title}</td>
                <td className="py-2 text-gray-500">{s.visible ? "visible" : "hidden"}</td>
                <td className="py-2 text-right">
                  <span className="inline-flex gap-2">
                    <form action={toggleSection}>
                      <input type="hidden" name="sid" value={s.id} />
                      <button className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold hover:border-indigo-400">
                        Toggle
                      </button>
                    </form>
                    <form action={moveSection}>
                      <input type="hidden" name="sid" value={s.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold hover:border-indigo-400">Up</button>
                    </form>
                    <form action={moveSection}>
                      <input type="hidden" name="sid" value={s.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold hover:border-indigo-400">Down</button>
                    </form>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
