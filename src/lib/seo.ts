// Pure SEO / structured-data helpers. No DOM, no Node APIs, so they are unit-testable.

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

export interface Faq { q: string; a: string }
export interface Crumb { name: string; url: string }

/** Build the <title>: "<page> | PluginLint", or the page title alone when it already names the site. */
export function fullTitle(title: string, siteName: string): string {
  return title.includes(siteName) ? title : `${title} | ${siteName}`;
}

/** Canonical path always ends in "/" unless it points at a file (has an extension). */
export function canonicalPath(pathname: string): string {
  if (pathname.endsWith('/')) return pathname;
  const last = pathname.split('/').pop() ?? '';
  return last.includes('.') ? pathname : `${pathname}/`;
}

/** schema.org BreadcrumbList from an ordered list of crumbs (absolute URLs). */
export function breadcrumbLd(crumbs: Crumb[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
  };
}

/** schema.org FAQPage. Only use for Q&As that are rendered visibly on the same page. */
export function faqLd(faqs: Faq[]): Record<string, unknown> {
  if (!faqs.length) throw new Error('faqLd needs at least one visible question');
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

/** schema.org SoftwareApplication for a free, browser-only tool. */
export function softwareAppLd(o: { name: string; description: string; url: string }): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: o.name,
    description: o.description,
    url: o.url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any (runs in your web browser)',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}

/** JSON for a <script type="application/ld+json"> body; escapes "<" so "</script>" can never break out. */
export function ldJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
