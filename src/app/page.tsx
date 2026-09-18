"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";

// Landing page: the product pitch. Client component because the hero
// uses framer-motion entrance choreography (staggered fade + rise).
// Typed as Variants so the easing tuple type-checks under `next build`.
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const FEATURES = [
  { title: "No-code editor", text: "Fill forms in a dashboard — never touch source code." },
  { title: "5 switchable designs", text: "Change the whole look; your content stays intact." },
  { title: "Live preview", text: "Every edit renders instantly before you publish." },
  { title: "JSON powered", text: "One document per portfolio. Portable, hackable, clear." },
  { title: "Your own link", text: "Every portfolio gets a clean address like /vaishak." },
  { title: "Resume + SEO", text: "PDF resume uploads and per-site titles included." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between p-6">
        <span className="text-xl font-black tracking-tight">
          Portfolio<span className="text-indigo-600">CMS</span>
        </span>
        <Link
          href="/login"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          Login
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center">
        <motion.h1
          variants={fadeUp} initial="hidden" animate="show" custom={0}
          className="text-4xl font-black tracking-tight sm:text-6xl"
        >
          Build your portfolio
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
            without writing code
          </span>
        </motion.h1>
        <motion.p
          variants={fadeUp} initial="hidden" animate="show" custom={1}
          className="mx-auto mt-5 max-w-2xl text-lg text-gray-600"
        >
          Create a professional developer portfolio, pick a design, customize
          it, and publish it — all from a simple dashboard.
        </motion.p>
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={2}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <Link
            href="/login"
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:bg-indigo-500"
          >
            Create portfolio
          </Link>
          <Link
            href="/vaishak"
            className="rounded-xl border border-gray-300 px-6 py-3 font-semibold transition hover:-translate-y-0.5 hover:border-indigo-400"
          >
            See live example
          </Link>
        </motion.div>

        {/* Live demo links */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" custom={3}
          className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm"
        >
          <span className="text-gray-500">Try the demos:</span>
          {["vaishak", "anil"].map((slug) => (
            <Link
              key={slug}
              href={`/${slug}`}
              className="rounded-full bg-gray-100 px-4 py-1.5 font-mono font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              /{slug}
            </Link>
          ))}
        </motion.div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h3 className="font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
