// Lets search engines in everywhere except the embed and the app feed, and
// points them at the sitemap.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nDisallow: /embed/\nDisallow: /ru/embed/\nDisallow: /card/\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
