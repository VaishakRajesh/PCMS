import { redirect } from "next/navigation";
import { getPortfolio } from "@/lib/json-db";
import { verifySession } from "@/lib/session";
import ResumeUploader from "@/components/dashboard/ResumeUploader";

// MEDIA page: resume upload lives in a small client component (file input
// + fetch need the browser); this server page just loads the current link.
export default async function MediaPage() {
  const session = await verifySession();
  if (!session) redirect("/login");
  const p = getPortfolio(session.slug);
  if (!p) redirect("/login");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Media</h1>
      <ResumeUploader initialUrl={p.profile.resume} />
      <p className="text-sm text-gray-500">
        The public portfolio shows a “Download resume” button whenever a
        resume is uploaded. Files are PDF-only, max 5MB, stored with random
        names under <code className="font-mono">public/uploads/</code>.
      </p>
    </div>
  );
}
