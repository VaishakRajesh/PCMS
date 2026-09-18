"use client";

import Link from "next/link";
import { useActionState } from "react";
import { motion } from "framer-motion";
import { loginAction } from "./actions";

// Owner login. No registration page by design: accounts are seeded in
// data/users.json (demo: vaishak / anil) and managed by the site owner.
// useActionState wires the form to the loginAction server action and
// carries the { error } result back without any manual fetch code.
export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, { error: "" });

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
      >
        <h1 className="text-2xl font-black">Owner login</h1>
        <p className="mt-1 text-sm text-gray-500">
          Demo accounts: <code className="font-mono">vaishak / vaishak123</code>
          {" · "}
          <code className="font-mono">anil / anil123</code>
        </p>
        <form action={formAction} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Username</span>
            <input
              name="username"
              required
              autoComplete="username"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {pending ? "Logging in…" : "Login"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-indigo-600 hover:underline">
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
