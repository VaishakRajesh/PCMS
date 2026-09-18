"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

// Resume upload box (client component: file input + fetch need the browser).
// POSTs the PDF to /api/resume, then refreshes so the server page shows
// the new download link. All safety checks live server-side in the route.
export default function ResumeUploader({ initialUrl }: { initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setStatus("Choose a PDF file first.");
      return;
    }
    setBusy(true);
    setStatus("Uploading…");
    try {
      const form = new FormData();
      form.append("resume", file);
      const res = await fetch("/api/resume", { method: "POST", body: form });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setStatus(data.error ?? "Upload failed.");
      } else {
        setUrl(data.url);
        setStatus("Resume uploaded.");
        router.refresh(); // re-render the server page (fresh link/state)
      }
    } catch {
      setStatus("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setStatus("Removing…");
    try {
      const res = await fetch("/api/resume", { method: "DELETE" });
      if (!res.ok) {
        setStatus("Remove failed.");
      } else {
        setUrl("");
        setStatus("Resume removed.");
        router.refresh();
      }
    } catch {
      setStatus("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-bold">Resume (PDF, max 5MB)</h3>
      {url ? (
        <p className="mt-2 text-sm">
          Current:{" "}
          <a href={url} download className="font-semibold text-indigo-600 hover:underline">
            {url}
          </a>
        </p>
      ) : (
        <p className="mt-2 text-sm text-gray-500">No resume uploaded yet.</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          className="text-sm"
        />
        <button
          onClick={upload}
          disabled={busy}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          Upload resume
        </button>
        {url && (
          <button
            onClick={remove}
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
          >
            Remove
          </button>
        )}
      </div>
      {status && <p className="mt-2 text-sm text-gray-600">{status}</p>}
    </div>
  );
}
