import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPortfolio } from "@/lib/json-db";
import { resolveTemplate } from "@/lib/themes";
import Modern from "@/components/templates/Modern";
import Minimal from "@/components/templates/Minimal";

// PUBLIC portfolio page: /vaishak, /anil, ... — one JSON file each.
// Server Component: data is read on the server, SEO tags are real HTML,
// and only the chosen template's JS ships to the browser.

// Per-user SEO straight from their JSON settings (title + description).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getPortfolio(slug);
  if (!p) return { title: "Not found" };
  return {
    title: p.settings.siteTitle,
    description: p.settings.description,
  };
}

export default async function PublicPortfolioPage({
  params,
}: {
  // Next 15: route params arrive as a Promise — must be awaited.
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getPortfolio(slug);
  // Strict match: the file AND its saved slug must agree with the URL.
  if (!p || p.settings.slug !== slug.toLowerCase()) notFound();

  // Template switch: same content, different design. Adding a design =
  // one file in components/templates + one registry line (lib/themes.ts).
  const template = resolveTemplate(p.theme.template);
  if (template === "minimal") return <Minimal p={p} />;
  return <Modern p={p} />;
}
