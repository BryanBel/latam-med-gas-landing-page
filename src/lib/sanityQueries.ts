import { sanityClient } from 'sanity:client';

export interface SanityImageRef {
  _type: 'image';
  asset: { _ref: string; _type: 'reference' };
  hotspot?: { x: number; y: number; height: number; width: number };
}

export interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface SiteSettings {
  siteName: string;
  navLinks?: NavLink[];
  tagline?: string;
  slogan?: string;
  ctaTitle?: string;
  ctaText?: string;
  footerNote?: string;
  stats?: Stat[];
  metaDescription?: string;
  logo?: SanityImageRef;
  phone?: string;
  email?: string;
  address?: string;
  products?: string[];
  socialLinks?: { platform: string; url: string }[];
}

export interface HeroSection {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  ctaLink?: string;
  backgroundImage?: SanityImageRef;
}

export interface AboutSection {
  eyebrow?: string;
  heading: string;
  body?: string;
  highlights?: string[];
  image?: SanityImageRef;
  mission?: string;
  vision?: string;
}

export interface SectionHeader {
  key: string;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
}

/**
 * One entry from the section catalogue in `src/sanity/schemaTypes/blocks.ts`. The fields are a
 * union across all seven block types rather than a discriminated union per type: the renderer
 * switches on `_type` and reads only what that branch needs, and modelling it strictly would
 * mean seven interfaces and a cast at every use for no extra safety at the point that matters.
 */
export interface PageBlock {
  _key: string;
  _type: string;
  tone?: 'light' | 'soft' | 'navy';
  eyebrow?: string;
  heading?: string;
  intro?: string;
  text?: string;
  // `blockText` holds Portable Text; `blockTextImage` holds a plain string.
  body?: PortableTextBlock[] | string;
  image?: SanityImageRef;
  imageSide?: 'left' | 'right';
  images?: (SanityImageRef & { alt?: string })[];
  cards?: { _key: string; title: string; text?: string; icon?: string; link?: string }[];
  items?: { _key: string; question: string; answer: string }[];
  quote?: string;
  author?: string;
  role?: string;
  buttonLabel?: string;
  buttonHref?: string;
}

/** Portable Text, as `src/lib/portableText.ts` consumes it. Loose here; the renderer narrows. */
export type PortableTextBlock = Record<string, unknown>;

export interface Page {
  slug: string;
  blocks?: PageBlock[];
  seoTitle?: string;
  metaDescription?: string;
  heroEyebrow?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  sections?: SectionHeader[];
  contentSections?: { heading: string; body: string }[];
}

export interface Service {
  _id: string;
  title: string;
  description?: string;
  icon?: string;
  // Internal path when the service has a page of its own. The card becomes a link and grows
  // a visible affordance, so it does not turn into an invisible one.
  link?: string;
  order?: number;
}

export interface Course {
  code: string;
  title: string;
  description?: string;
  order?: number;
}

export interface Certification {
  _id: string;
  name: string;
  description?: string;
  badge?: SanityImageRef;
  order?: number;
}

export interface Project {
  _id: string;
  clientName: string;
  location?: string;
  description?: string;
  image?: SanityImageRef;
  order?: number;
  // Added for the redesign's Trayectoria timeline: a display date ("Noviembre 2024"), the
  // country, and the kind of work (Verificación / Inspección / …).
  date?: string;
  country?: string;
  serviceType?: string;
}

export interface Testimonial {
  _id: string;
  quote: string;
  authorName?: string;
  authorRole?: string;
  company?: string;
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return sanityClient.fetch('*[_type == "siteSettings" && !(_id in path("drafts.**"))][0]');
}

export async function getHeroSection(): Promise<HeroSection | null> {
  return sanityClient.fetch('*[_type == "heroSection" && !(_id in path("drafts.**"))][0]');
}

export async function getAboutSection(): Promise<AboutSection | null> {
  return sanityClient.fetch('*[_type == "aboutSection" && !(_id in path("drafts.**"))][0]');
}

export async function getPage(slug: string): Promise<Page | null> {
  return sanityClient.fetch('*[_type == "page" && slug == $slug && !(_id in path("drafts.**"))][0]', { slug });
}

export async function getServices(): Promise<Service[]> {
  return sanityClient.fetch(
    '*[_type == "service" && !(_id in path("drafts.**"))] | order(coalesce(orderRank, "0|999999:") asc, coalesce(order, 9999) asc)',
  );
}

export async function getCourses(): Promise<Course[]> {
  return sanityClient.fetch(
    '*[_type == "course" && !(_id in path("drafts.**"))] | order(coalesce(orderRank, "0|999999:") asc, coalesce(order, 9999) asc)',
  );
}

export async function getCertifications(): Promise<Certification[]> {
  return sanityClient.fetch(
    '*[_type == "certification" && !(_id in path("drafts.**"))] | order(coalesce(orderRank, "0|999999:") asc, coalesce(order, 9999) asc)',
  );
}

export async function getProjects(): Promise<Project[]> {
  return sanityClient.fetch(
    '*[_type == "project" && !(_id in path("drafts.**"))] | order(coalesce(orderRank, "0|999999:") asc, coalesce(order, 9999) asc)',
  );
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return sanityClient.fetch('*[_type == "testimonial" && !(_id in path("drafts.**"))]');
}

/**
 * Section headings are stored as a keyed list rather than as one field per section, so the
 * template asks for the one it needs. Returns an empty object rather than undefined so callers
 * can write `sectionOf(page, 'servicios').heading ?? DEFAULT` without a guard at every use.
 */
export function sectionOf(page: Page | null, key: string): Partial<SectionHeader> {
  return page?.sections?.find((s) => s.key === key) ?? {};
}
