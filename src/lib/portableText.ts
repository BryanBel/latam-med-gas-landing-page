/**
 * Minimal Portable Text renderer for the `blockText` section.
 *
 * A general renderer (`@portabletext/to-html`) handles every style, mark and custom type a
 * dataset might contain. This one does not need to: the schema in `src/sanity/schemaTypes/
 * blocks.ts` offers exactly three block styles, two list types, two decorators and one
 * annotation, so a closed schema gets a closed renderer — no dependency, and anything outside
 * the catalogue degrades to a paragraph rather than disappearing.
 *
 * Every string goes through `escape` before it reaches the output. Portable Text is content an
 * editor typed, so `set:html` on the result would otherwise be an injection path.
 */

export interface PortableTextSpan {
  _type?: string;
  _key?: string;
  text?: string;
  marks?: string[];
}

export interface PortableTextMarkDef {
  _key?: string;
  _type?: string;
  href?: string;
}

export interface PortableTextBlock {
  _type?: string;
  _key?: string;
  style?: string;
  listItem?: string;
  level?: number;
  children?: PortableTextSpan[];
  markDefs?: PortableTextMarkDef[];
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Only http(s), mailto and tel. An editor pasting a `javascript:` URL into the link field would
// otherwise become a script that runs for every visitor.
const safeHref = (href?: string) => {
  if (!href) return null;
  const trimmed = href.trim();
  return /^(https?:|mailto:|tel:|\/|#)/i.test(trimmed) ? escape(trimmed) : null;
};

interface Classes {
  paragraph: string;
  subheading: string;
  quote: string;
  bulletList: string;
  numberList: string;
  link: string;
}

function renderSpans(block: PortableTextBlock, classes: Classes): string {
  return (block.children ?? [])
    .map((span) => {
      let html = escape(span.text ?? '');
      for (const mark of span.marks ?? []) {
        if (mark === 'strong') {
          html = `<strong>${html}</strong>`;
          continue;
        }
        if (mark === 'em') {
          html = `<em>${html}</em>`;
          continue;
        }
        // Anything else is an annotation key pointing into markDefs.
        const def = block.markDefs?.find((d) => d._key === mark);
        const href = safeHref(def?.href);
        if (href) html = `<a href="${href}" class="${classes.link}">${html}</a>`;
      }
      return html;
    })
    .join('');
}

export function renderPortableText(blocks: unknown, classes: Classes): string {
  if (!Array.isArray(blocks)) return '';
  const input = blocks as PortableTextBlock[];
  const out: string[] = [];

  for (let i = 0; i < input.length; i += 1) {
    const block = input[i];
    if (block?._type !== 'block') continue;

    // List items arrive as consecutive sibling blocks, not as a nested structure, so a run of
    // them has to be gathered before the wrapping <ul>/<ol> can be written.
    if (block.listItem === 'bullet' || block.listItem === 'number') {
      const kind = block.listItem;
      const items: string[] = [];
      while (i < input.length && input[i]?.listItem === kind) {
        items.push(`<li>${renderSpans(input[i], classes)}</li>`);
        i += 1;
      }
      i -= 1;
      const tag = kind === 'bullet' ? 'ul' : 'ol';
      const cls = kind === 'bullet' ? classes.bulletList : classes.numberList;
      out.push(`<${tag} class="${cls}">${items.join('')}</${tag}>`);
      continue;
    }

    const content = renderSpans(block, classes);
    if (!content) continue;
    if (block.style === 'h3') out.push(`<h3 class="${classes.subheading}">${content}</h3>`);
    else if (block.style === 'blockquote') out.push(`<blockquote class="${classes.quote}">${content}</blockquote>`);
    else out.push(`<p class="${classes.paragraph}">${content}</p>`);
  }

  return out.join('');
}
