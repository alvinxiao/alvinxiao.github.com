import type { APIRoute } from 'astro';
import { site } from '../content/site';
export const GET: APIRoute = () =>
  new Response(
    site.preview
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nAllow: /\nDisallow: /thank-you/\nSitemap: ${site.siteUrl}/sitemap.xml\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
