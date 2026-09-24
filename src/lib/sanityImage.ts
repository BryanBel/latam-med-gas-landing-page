import { sanityClient } from 'sanity:client';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageRef } from './sanityQueries';

const builder = createImageUrlBuilder(sanityClient);

export function sanityImageUrl(image: SanityImageRef | undefined, width: number): string | null {
  if (!image?.asset) return null;
  return builder.image(image).width(width).auto('format').url();
}

/**
 * A srcset for a Sanity image, so the browser can pick a width instead of always taking the
 * largest.
 *
 * This existed for the local seed photos, through `astro:assets`, and not for Sanity ones — a
 * Sanity image got a single URL at the full width. Nobody noticed because the only images the
 * client had uploaded were small. The moment the real project photographs arrive, every card
 * would ship a 1200px file to a phone rendering it at 400, quietly undoing the image work the
 * README is proud of.
 *
 * Widths are capped at `width` so Sanity is never asked to upscale, and duplicates are dropped
 * for the narrow case where the cap collapses two steps into one.
 */
export function sanityImageSrcSet(image: SanityImageRef | undefined, width: number): string | null {
  if (!image?.asset) return null;
  const widths = [...new Set([480, 800, width].filter((w) => w <= width))];
  if (widths.length < 2) return null;
  return widths.map((w) => `${builder.image(image).width(w).auto('format').url()} ${w}w`).join(', ');
}
