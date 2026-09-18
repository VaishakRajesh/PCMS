import type { Portfolio } from "@/lib/types";

// MINIMAL template — quiet, typographic, no JavaScript motion at all.
// This is a Server Component: zero client JS ships for animation; a tiny
// CSS keyframe (`rise`) fades sections up on load. Copy this file to add
// a new server-rendered design (see lib/themes.ts).
function themeVars(p: Portfolio) {
  const t = p.theme;
  return (
    <style>{`:root{--pc-primary:${t.primaryColor};--pc-secondary:${t.secondaryColor};
      --pc-bg:${t.backgroundColor};--pc-text:${t.textColor};--pc-radius:${t.borderRadius};}`}</style>
  );
}

export default function Minimal({ p }: { p: Portfolio }) {
  const sections = [...p.sections]
    .sort((a, b) => a.order - b.order)
    .filter((s) => s.visible);
  const show = (id: string) => sections.some((s) => s.id === id);

  return (
    <div className="min-h-screen bg-[var(--pc-bg)] text-[var(--pc-text)]">
      {themeVars(p)}
      {/* Local keyframes: staggered rise on page load, pure CSS. */}
      <style>{`@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .rise{animation:rise .6s cubic-bezier(.22,1,.36,1) both}
        .rise-1{animation-delay:.05s}.rise-2{animation-delay:.15s}.rise-3{animation-delay:.25s}`}</style>

      <div className="mx-auto max-w-2xl px-6 py-16">
        {show("hero") && (
          <header className="rise rise-1 border-b border-black/10 pb-10">
            <p className="font-mono text-sm text-[var(--pc-primary)]">Hello, I&apos;m</p>
            <h1 className="mt-2 text-5xl font-black tracking-tight">{p.profile.name}</h1>
            <p className="mt-2 text-xl opacity-70">{p.profile.title}</p>
            <p className="mt-3 opacity-70">{p.profile.tagline}</p>
            {p.profile.resume && (
              <a
                href={p.profile.resume}
                download
                className="mt-6 inline-block rounded-full bg-[var(--pc-primary)] px-5 py-2 text-sm font-semibold text-white"
              >
                Download resume
              </a>
            )}
          </header>
        )}

        {show("about") && (
          <section className="rise rise-2 border-b border-black/10 py-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">About</h2>
            <p className="mt-3 leading-relaxed">{p.profile.bio}</p>
          </section>
        )}

        {show("skills") && (
          <section className="rise rise-3 border-b border-black/10 py-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">Skills</h2>
            <ul className="mt-3 space-y-1">
              {p.skills.map((s) => (
                <li key={s.name}>
                  <b>{s.name}</b>
                  <span className="opacity-60"> — {s.category || s.level}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {show("projects") && (
          <section className="border-b border-black/10 py-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">Projects</h2>
            <div className="mt-3 space-y-6">
              {p.projects.map((pr) => (
                <article key={pr.name}>
                  <h3 className="text-lg font-bold">
                    {pr.name} {pr.featured && <span>★</span>}
                  </h3>
                  <p className="opacity-75">{pr.description}</p>
                  <p className="font-mono text-xs opacity-60">{pr.technologies}</p>
                  <p className="text-sm font-semibold text-[var(--pc-primary)]">
                    {pr.github && <a href={pr.github}>GitHub → </a>}
                    {pr.live && <a href={pr.live}>Live →</a>}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {show("experience") && p.experience.length > 0 && (
          <section className="border-b border-black/10 py-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">Experience</h2>
            <div className="mt-3 space-y-4">
              {p.experience.map((e) => (
                <div key={`${e.company}-${e.position}`}>
                  <b>{e.position}</b> <span className="opacity-60">· {e.company}</span>
                  <p className="text-sm opacity-60">{e.start} – {e.end}</p>
                  <p className="opacity-80">{e.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {show("education") && p.education.length > 0 && (
          <section className="border-b border-black/10 py-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">Education</h2>
            <div className="mt-3 space-y-4">
              {p.education.map((e) => (
                <div key={`${e.institution}-${e.degree}`}>
                  <b>{e.degree}</b> <span className="opacity-60">· {e.institution}</span>
                  <p className="text-sm opacity-60">{e.start} – {e.end}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {show("contact") && (
          <section className="py-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">Contact</h2>
            <p className="mt-3 space-x-4 font-semibold text-[var(--pc-primary)]">
              {p.social.github && <a href={p.social.github}>GitHub</a>}
              {p.social.linkedin && <a href={p.social.linkedin}>LinkedIn</a>}
              {p.social.twitter && <a href={p.social.twitter}>Twitter</a>}
              {p.social.email && <a href={`mailto:${p.social.email}`}>Email</a>}
            </p>
          </section>
        )}

        <footer className="pt-6 text-sm opacity-50">
          © {new Date().getFullYear()} {p.profile.name}
        </footer>
      </div>
    </div>
  );
}
