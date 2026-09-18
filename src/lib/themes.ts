// Template registry — the menu of designs for the theme picker.
// ADDING A DESIGN = 2 steps, zero plumbing:
//   1. Create src/components/templates/<Name>.tsx (copy Minimal.tsx).
//   2. Add one line to TEMPLATES below + one case in [slug]/page.tsx.
export const TEMPLATES = {
  modern: {
    label: "Modern",
    blurb: "Clean hero, rounded cards, rich motion.",
  },
  minimal: {
    label: "Minimal",
    blurb: "Quiet typography, flat sections, calm CSS motion.",
  },
} as const;

export type TemplateId = keyof typeof TEMPLATES;
export const DEFAULT_TEMPLATE: TemplateId = "modern";

export function availableTemplates(): TemplateId[] {
  return Object.keys(TEMPLATES) as TemplateId[];
}

// Type guard: narrows any string to a valid TemplateId.
// Used by the dashboard save action to reject unknown template names.
export function isTemplate(id: string): id is TemplateId {
  return (Object.keys(TEMPLATES) as string[]).includes(id);
}

// Saved JSON may name a template that no longer exists (file deleted by
// hand) — resolveTemplate() guarantees a safe fallback instead of a crash.
export function resolveTemplate(id: string): TemplateId {
  return (Object.keys(TEMPLATES) as string[]).includes(id)
    ? (id as TemplateId)
    : DEFAULT_TEMPLATE;
}
