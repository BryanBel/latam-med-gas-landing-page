import { sanityClient } from 'sanity:client';

export interface SiteSettings {
  siteName: string;
  tagline?: string;
  logo?: unknown;
  phone?: string;
  email?: string;
  address?: string;
  socialLinks?: { platform: string; url: string }[];
}

export interface HeroSection {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  ctaLabel?: string;
  ctaLink?: string;
  backgroundImage?: unknown;
}

export interface Service {
  _id: string;
  title: string;
  description?: string;
  icon?: string;
  order?: number;
}

export interface Certification {
  _id: string;
  name: string;
  description?: string;
  badge?: unknown;
  order?: number;
}

export interface Project {
  _id: string;
  clientName: string;
  location?: string;
  description?: string;
  image?: unknown;
  order?: number;
}

export interface Testimonial {
  _id: string;
  quote: string;
  authorName?: string;
  authorRole?: string;
  company?: string;
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return sanityClient.fetch('*[_type == "siteSettings"][0]');
}

export async function getHeroSection(): Promise<HeroSection | null> {
  return sanityClient.fetch('*[_type == "heroSection"][0]');
}

export async function getServices(): Promise<Service[]> {
  return sanityClient.fetch('*[_type == "service"] | order(order asc)');
}

export async function getCertifications(): Promise<Certification[]> {
  return sanityClient.fetch('*[_type == "certification"] | order(order asc)');
}

export async function getProjects(): Promise<Project[]> {
  return sanityClient.fetch('*[_type == "project"] | order(order asc)');
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return sanityClient.fetch('*[_type == "testimonial"]');
}
