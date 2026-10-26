import type { APIContext } from 'astro';
import { llmsTxt } from '../lib/llms';
export function GET(context: APIContext) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const abs = (p: string) => new URL(`${base}${p}`, context.site).toString();
  return new Response(llmsTxt(abs, false), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
