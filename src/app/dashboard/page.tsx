import Link from "next/link";
import { redirect } from "next/navigation";
import { findUser, getPortfolio } from "@/lib/json-db";
import { verifySession } from "@/lib/session";

// Dashboard OVERVIEW: status at a glance + shortcuts into each editor.
// The yellow banner shows until the owner changes the seeded password.
export default async function DashboardOverview() {
  const session = await verifySession();
  if (!session) redirect("/login");
  const p = getPortfolio(session.slug);
  if (!p) redirect("/login");
  const user = findUser(session.username);

  const stats = [
    { label: "Skills", value: p.skills.length, href: "/dashboard/content" },
    { label: "Projects", value: p.projects.length, href: "/dashboard/content" },
    { label: "Experience", value: p.experience.length, href: "/dashboard/content" },
    {
      label: "Sections visible",
      value: p.sections.filter((s) => s.visible).length,
      href: "/dashboard/design",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-black">Overview</h1>
      <p className="mt-1 text-gray-500">
        Public address:{" "}
        <Link href={`/${p.settings.slug}`} className="font-mono font-semibold text-indigo-600 hover:underline">
          /{p.settings.slug}
        </Link>
      </p>

      {user?.isDefault && (
        <div className="mt-4 rounded-xl border border-amber-400 bg-amber-50 px-4 py-3 text-amber-800">
          You&apos;re using the default password.{" "}
          <Link href="/dashboard/settings" className="font-bold underline">
            Change it in Settings
          </Link>
          .
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <p className="text-3xl font-black text-indigo-600">{s.value}</p>
            <p className="mt-1 text-sm text-gray-500">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          { href: "/dashboard/content", t: "Edit content", d: "Profile, skills, projects, experience, education." },
          { href: "/dashboard/design", t: "Change design", d: "Template, colors, sections on/off and order." },
          { href: "/dashboard/media", t: "Manage resume", d: "Upload or remove your PDF resume." },
          { href: "/dashboard/settings", t: "Settings", d: "Change your username and password." },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <p className="font-bold">{c.t}</p>
            <p className="mt-1 text-sm text-gray-500">{c.d}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
