// The sitemap search engines read: every page in both languages.
import type { APIRoute } from 'astro';
import { data, LANGS, href, isReleased } from '../lib/data';

export const GET: APIRoute = ({ site }) => {
  const paths = ['/', '/projects/', '/commissions/', '/about/', '/about/cv/', '/support/', ...data.apps.filter(isReleased).map((a) => `/apps/${a.id}/`)];
  const url = (p: string) => new URL(p, site).href;
  const entries = paths.map((p) => {
    const alts = LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${url(href(p, l))}"/>`).join('');
    return LANGS.map((l) => `<url><loc>${url(href(p, l))}</loc>${alts}</url>`).join('\n');
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
