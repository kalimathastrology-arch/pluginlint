import type { APIContext } from 'astro';
import { robotsTxt } from '../lib/llms';
export function GET(context: APIContext) {
  const sitemap = new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sitemap-index.xml`, context.site).toString();
  return new Response(robotsTxt(sitemap), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
