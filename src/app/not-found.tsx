import Link from "next/link";

// Shown for unknown slugs (e.g. /someone-with-no-portfolio).
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-6xl font-black text-indigo-600">404</p>
      <h1 className="text-2xl font-bold">No portfolio here</h1>
      <p className="text-gray-500">
        Nobody has published under this address yet. Check the spelling or
        start your own.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-500"
      >
        Back home
      </Link>
    </main>
  );
}
