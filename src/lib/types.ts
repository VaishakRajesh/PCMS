// Shared TypeScript shapes — one definition of the JSON data model used
// by pages, templates, and server actions. Matches data/*.json on disk.

export interface Theme {
  template: string; // e.g. "modern" — must exist in lib/themes.ts registry
  mode: "light" | "dark";
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  animations: boolean;
}

export interface PortfolioSection {
  id: string;
  type: string;
  title: string;
  visible: boolean;
  order: number;
}

export interface Skill {
  name: string;
  category: string;
  level: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string;
  github: string;
  live: string;
  featured: boolean;
}

export interface ExperienceItem {
  company: string;
  position: string;
  start: string;
  end: string;
  description: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  start: string;
  end: string;
  description: string;
}

export interface Profile {
  name: string;
  title: string;
  tagline: string;
  bio: string;
  profileImage: string;
  resume: string; // e.g. "/uploads/resume-abc.pdf"
  location: string;
  email: string;
  phone: string;
}

export interface SocialLinks {
  github: string;
  linkedin: string;
  twitter: string;
  email: string;
}

export interface SiteSettings {
  siteTitle: string;
  description: string;
  slug: string; // public URL becomes /<slug>, file is data/portfolios/<slug>.json
}

export interface Portfolio {
  profile: Profile;
  social: SocialLinks;
  theme: Theme;
  sections: PortfolioSection[];
  skills: Skill[];
  projects: Project[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: unknown[];
  settings: SiteSettings;
}

// One login account. Each user owns exactly one portfolio (by slug).
export interface User {
  username: string;
  passwordHash: string; // bcrypt hash — NEVER a plain password
  slug: string; // links account -> data/portfolios/<slug>.json
  isDefault: boolean; // true until the owner changes the password
}
