import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import history from '../../data/rules-history.json';

export function GET(context: APIContext) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return rss({
    trailingSlash: false,
    title: 'PluginLint — OpenAI plugin docs changes',
    description: 'Dated changes detected in the OpenAI plugin submission-errors and plugin-guidelines pages.',
    site: context.site!.toString().replace(/\/$/, '') + base + '/',
    items: (history.entries as { date: string; title: string; url: string; summary: string; type: string; page: string }[]).map((e) => ({
      title: `${e.date}: ${e.title} — ${e.type === 'baseline' ? 'tracking started' : 'changed'}`,
      pubDate: new Date(`${e.date}T00:00:00Z`),
      description: e.summary,
      link: `${base}/rules/#${e.page}-${e.date}-${e.type}`,
    })),
  });
}
