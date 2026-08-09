import { sanityClient } from 'sanity:client';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageRef } from './sanityQueries';

const builder = createImageUrlBuilder(sanityClient);

export function sanityImageUrl(image: SanityImageRef | undefined, width: number): string | null {
  if (!image?.asset) return null;
  return builder.image(image).width(width).auto('format').url();
}
