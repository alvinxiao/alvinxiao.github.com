import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../content/site';
export const GET: APIRoute = async () => {
  const paths = [
    '/',
    '/services/',
    '/about/',
    '/resources/',
    '/contact/',
    '/privacy/',
    ...(await getCollection('resources')).map((article) => `/resources/${article.id}/`),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${new URL(path, site.siteUrl).href}</loc></url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
