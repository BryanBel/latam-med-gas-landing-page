import type { MiddlewareHandler } from 'astro';
import { IS_PREVIEW } from './lib/preview';

/**
 * The preview deployment serves the whole site from its own public URL, which a crawler would
 * happily index as a second copy competing with latammedgas.com. `robots.txt` cannot fix it —
 * that file is served from `public/` and is the same on both deployments.
 *
 * `X-Robots-Tag` is the header form of a noindex meta tag and applies to every response,
 * including the ones no crawler should reach anyway. Production is static, so this middleware
 * never runs there; the guard is belt and braces.
 */
export const onRequest: MiddlewareHandler = async (_context, next) => {
  const response = await next();
  if (IS_PREVIEW) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  return response;
};
