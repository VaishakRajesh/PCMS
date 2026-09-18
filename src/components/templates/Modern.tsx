"use client";

import { motion } from "framer-motion";
import type { Portfolio } from "@/lib/types";
import { Reveal, SectionTitle, ThemeStyle, visibleSections } from "@/components/portfolio/ui";

// MODERN template — the premium animated design.
// Motion recipe: staggered hero entrance, scroll reveals per section,
// springy hover lifts on cards, animated skill bars, gradient blobs.
// Same Portfolio data as every template; only this file changes the look.

// Text levels ("Advanced"…) -> bar widths for the animated skill meters.
function levelWidth(level: string): number {
  const l = level.toLowerCase();
  if (l.includes("adv") || l.includes("exp")) return 92;
  if (l.includes("inter") || l.includes("mid")) return 68;
  if (l.includes("begin") || l.includes("basic")) return 38;
  return 70;
}

export default function Modern({ p }: { p: Portfolio }) {
  const sections = visibleSections(p);
  const show = (id: string) => sections.some((s) => s.id === id);
  const initial = p.profile.name.charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen" style={{ background: "var(--pc-bg)", color: "var(--pc-text)" }}>
      <ThemeStyle theme={p.theme} />

      {/* HERO — choreographed entrance: badge, name, title, buttons stagger in */}
      {show("hero") && (
        <header className="relative overflow-hidden">
          {/* soft animated gradient blobs behind the hero */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--pc-primary)" }}
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--pc-secondary)" }}
            animate={{ x: [0, -24, 0], y: [0, 28, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 16 }}
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl text-4xl font-black text-white shadow-xl"
              style={{ background: "linear-gradient(135deg, var(--pc-primary), var(--pc-secondary))" }}
            >
              {initial}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mt-6 text-4xl font-black tracking-tight sm:text-6xl"
            >
              {p.profile.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-3 text-xl font-semibold"
              style={{ color: "var(--pc-primary)" }}
            >
              {p.profile.title}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mx-auto mt-3 max-w-2xl opacity-70"
            >
              {p.profile.tagline}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              {p.profile.resume && (
                <motion.a
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  href={p.profile.resume} download
                  className="rounded-xl px-6 py-3 font-semibold text-white shadow-lg"
                  style={{ background: "var(--pc-primary)" }}
                >
                  Download resume
                </motion.a>
              )}
              {p.social.github && (
                <motion.a
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  href={p.social.github}
                  className="rounded-xl border px-6 py-3 font-semibold"
                  style={{ borderColor: "var(--pc-primary)", color: "var(--pc-primary)" }}
                >
                  GitHub
                </motion.a>
              )}
            </motion.div>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-5xl space-y-16 px-6 pb-24">
        {/* ABOUT */}
        {show("about") && (
          <Reveal>
            <section>
              <SectionTitle>About</SectionTitle>
              <p className="max-w-3xl text-lg leading-relaxed opacity-80">{p.profile.bio}</p>
              <p className="mt-3 text-sm opacity-60">
                {[p.profile.location, p.profile.email, p.profile.phone]
                  .filter(Boolean)
                  .join("  ·  ")}
              </p>
            </section>
          </Reveal>
        )}

        {/* SKILLS — bars animate to width when scrolled into view */}
        {show("skills") && (
          <Reveal>
            <section>
              <SectionTitle>Skills</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {p.skills.map((s, i) => (
                  <motion.div
                    key={s.name}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl border border-black/10 bg-white/70 p-5 shadow-sm backdrop-blur"
                  >
                    <div className="flex items-baseline justify-between">
                      <b>{s.name}</b>
                      <span className="text-xs opacity-60">{s.level || s.category}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, var(--pc-primary), var(--pc-secondary))" }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${levelWidth(s.level)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {/* PROJECTS */}
        {show("projects") && (
          <Reveal>
            <section>
              <SectionTitle>Projects</SectionTitle>
              <div className="grid gap-5 md:grid-cols-2">
                {p.projects.map((pr) => (
                  <motion.article
                    key={pr.name}
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur ${
                      pr.featured ? "border-2" : "border-black/10"
                    }`}
                    style={pr.featured ? { borderColor: "var(--pc-primary)" } : undefined}
                  >
                    <h3 className="text-lg font-bold">
                      {pr.name} {pr.featured && <span>⭐</span>}
                    </h3>
                    <p className="mt-2 text-sm opacity-75">{pr.description}</p>
                    <p className="mt-2 font-mono text-xs opacity-60">{pr.technologies}</p>
                    <div className="mt-3 flex gap-4 text-sm font-semibold" style={{ color: "var(--pc-primary)" }}>
                      {pr.github && <a href={pr.github}>GitHub →</a>}
                      {pr.live && <a href={pr.live}>Live →</a>}
                    </div>
                  </motion.article>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {/* EXPERIENCE */}
        {show("experience") && p.experience.length > 0 && (
          <Reveal>
            <section>
              <SectionTitle>Experience</SectionTitle>
              <div className="space-y-4">
                {p.experience.map((e) => (
                  <div key={`${e.company}-${e.position}`} className="rounded-2xl border border-black/10 bg-white/70 p-5">
                    <b>{e.position}</b> <span className="opacity-60">at {e.company}</span>
                    <p className="text-xs opacity-60">{e.start} – {e.end}</p>
                    <p className="mt-1 text-sm opacity-80">{e.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {/* EDUCATION */}
        {show("education") && p.education.length > 0 && (
          <Reveal>
            <section>
              <SectionTitle>Education</SectionTitle>
              <div className="space-y-4">
                {p.education.map((e) => (
                  <div key={`${e.institution}-${e.degree}`} className="rounded-2xl border border-black/10 bg-white/70 p-5">
                    <b>{e.degree}</b> <span className="opacity-60">· {e.institution}</span>
                    <p className="text-xs opacity-60">{e.start} – {e.end}</p>
                    <p className="mt-1 text-sm opacity-80">{e.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {/* CONTACT */}
        {show("contact") && (
          <Reveal>
            <section
              className="rounded-3xl p-8 text-center text-white"
              style={{ background: "linear-gradient(135deg, var(--pc-primary), var(--pc-secondary))" }}
            >
              <h2 className="text-2xl font-black">Let&apos;s work together</h2>
              <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm font-semibold">
                {p.social.github && <a className="rounded-full bg-white/20 px-4 py-2 hover:bg-white/30" href={p.social.github}>GitHub</a>}
                {p.social.linkedin && <a className="rounded-full bg-white/20 px-4 py-2 hover:bg-white/30" href={p.social.linkedin}>LinkedIn</a>}
                {p.social.twitter && <a className="rounded-full bg-white/20 px-4 py-2 hover:bg-white/30" href={p.social.twitter}>Twitter</a>}
                {p.social.email && <a className="rounded-full bg-white/20 px-4 py-2 hover:bg-white/30" href={`mailto:${p.social.email}`}>Email</a>}
              </div>
            </section>
          </Reveal>
        )}
      </main>

      <footer className="border-t border-black/10 py-6 text-center text-sm opacity-60">
        © {new Date().getFullYear()} {p.profile.name} · Built with PortfolioCMS
      </footer>
    </div>
  );
}
