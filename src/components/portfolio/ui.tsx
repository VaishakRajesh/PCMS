"use client";

import { motion } from "framer-motion";
import type { Portfolio, PortfolioSection, Theme } from "@/lib/types";

// Small shared building blocks for ALL templates (client module because
// Reveal uses framer-motion; plain helpers ride along for simplicity).

// Push saved JSON theme colors into CSS variables (--pc-*) so globals.css
// and Tailwind arbitrary values can use them: bg-[var(--pc-primary)].
export function ThemeStyle({ theme }: { theme: Theme }) {
  return (
    <style>{`:root{
      --pc-primary:${theme.primaryColor};--pc-secondary:${theme.secondaryColor};
      --pc-bg:${theme.backgroundColor};--pc-text:${theme.textColor};
      --pc-radius:${theme.borderRadius};
    }`}</style>
  );
}

// Scroll-triggered reveal wrapper: fades + rises once when scrolled into view.
// Wrap any section content with <Reveal> for free production-feel motion.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({
  children,
  accent = "var(--pc-primary)",
}: {
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <h2 className="mb-6 flex items-center gap-3 text-2xl font-black tracking-tight">
      <span
        className="inline-block h-7 w-1.5 rounded-full"
        style={{ background: accent }}
      />
      {children}
    </h2>
  );
}

// Saved section order, visible ones only. Templates map over this list so
// dashboard reordering (Phase 2) is honored without template changes.
export function visibleSections(p: Portfolio): PortfolioSection[] {
  return [...p.sections]
    .sort((a, b) => a.order - b.order)
    .filter((s) => s.visible);
}
