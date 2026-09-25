import type { MiddlewareHandler } from 'astro';
import { IS_PREVIEW } from './lib/preview';

/**
 * The preview deployment serves the whole site from its own public URL, which a crawler would
 * happily index as a second copy competing with latammedgas.com. `robots.txt` cannot fix it —
 * that file is served from `public/` and is the same on both deployments.
 *
 * `X-Robots-Tag` is the header form of a noindex meta tag and applies to every response the
 * Worker renders, `/studio` included. Static assets (CSS, images, robots.txt) are answered by
 * the asset layer before this runs, so they do not carry it — nor need to. Production is static, so this middleware
 * never runs there; the guard is belt and braces.
 */
export const onRequest: MiddlewareHandler = async (_context, next) => {
  const response = await next();
  if (IS_PREVIEW) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    // `public/_headers` only reaches the preview's static assets; its SSR pages leave the
    // Worker without any of those headers. These are the ones that cannot break anything.
    // `frame-ancestors` lists exactly who frames the preview: the Studio's Presentation tool,
    // on this same Worker, on the live domain, and under `npx sanity dev`.
    response.headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'self' https://latammedgas.com https://www.latammedgas.com http://localhost:3333",
    );
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  return response;
};
