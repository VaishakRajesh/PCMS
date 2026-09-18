import Link from "next/link";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { logoutAction } from "@/app/login/actions";

// Dashboard shell: dark sidebar nav shared by every /dashboard* page.
// Middleware already blocks logged-out users; we re-check here to show
// the owner's name and build their public-site link.
const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/content", label: "Content" },
  { href: "/dashboard/design", label: "Design" },
  { href: "/dashboard/media", label: "Media" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  if (!session) redirect("/login");
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 lg:flex">
      <aside className="bg-gray-900 p-6 text-white lg:min-h-screen lg:w-60 lg:shrink-0">
        <p className="text-lg font-black">
          Portfolio<span className="text-indigo-400">CMS</span>
        </p>
        <p className="mt-1 truncate text-sm text-gray-400">
          Signed in as <b className="text-gray-200">{session.username}</b>
        </p>
        <nav className="mt-6 flex gap-2 overflow-x-auto lg:flex-col">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 flex gap-2 lg:flex-col">
          <Link
            href={`/${session.slug}`}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold hover:bg-indigo-500"
          >
            View my site
          </Link>
          <form action={logoutAction}>
            <button className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-800">
              Logout
            </button>
          </form>
        </div>
      </aside>
      <div className="flex-1 p-6 lg:p-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
