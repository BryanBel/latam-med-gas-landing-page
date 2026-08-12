import {
  ClipboardCheck,
  Wrench,
  Ruler,
  Headphones,
  ShieldCheck,
  GraduationCap,
  Award,
  Package,
  type LucideIcon,
} from 'lucide-react';

// Keyed to the free-text "icon" field in the Sanity `service` schema (lucide name, e.g. "wrench").
const SERVICE_ICONS: Record<string, LucideIcon> = {
  'clipboard-check': ClipboardCheck,
  wrench: Wrench,
  ruler: Ruler,
  headphones: Headphones,
  'shield-check': ShieldCheck,
  'graduation-cap': GraduationCap,
  award: Award,
  package: Package,
};

export function resolveServiceIcon(name?: string): LucideIcon {
  return (name && SERVICE_ICONS[name]) || Wrench;
}

// Accent palette pulled from real medical-gas identification colors (NFPA 99 / CGA
// pipeline labeling: oxygen green, medical air amber, nitrous oxide blue, nitrogen
// charcoal, vacuum teal, instrument air orange) — on-topic variety, not arbitrary color.
export const GAS_ACCENTS = [
  '#15803d', // oxygen green
  '#b45309', // medical air amber
  '#2563eb', // nitrous oxide blue
  '#0d9488', // vacuum teal
  '#c2410c', // instrument air orange
  '#7c3aed', // WAGD violet
  '#334155', // nitrogen charcoal
] as const;

export function accentFor(index: number): string {
  return GAS_ACCENTS[index % GAS_ACCENTS.length];
}
