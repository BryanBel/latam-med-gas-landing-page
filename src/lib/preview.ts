/**
 * True only in the preview deployment, which is a second Cloudflare Worker built from this same
 * repository with `PUBLIC_SANITY_PREVIEW=true`. Production never sets it.
 *
 * Preview differs from production in three ways, all switched on this one flag:
 *
 *   - it renders on the server, so a draft appears the moment it is saved rather than after a
 *     publish and a rebuild;
 *   - the Sanity client reads with a token and the `drafts` perspective;
 *   - responses carry stega — invisible Unicode markers inside every string that tell the
 *     Presentation tool which field produced which text on screen.
 *
 * That last one is why preview has to be a separate deployment rather than a route on the live
 * site. Those markers sit inside the text itself, so they would end up in the meta description,
 * the JSON-LD and the `tel:` links of the public pages.
 */
export const IS_PREVIEW = import.meta.env.PUBLIC_SANITY_PREVIEW === 'true';
