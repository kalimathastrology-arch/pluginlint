import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { fullTitle, canonicalPath, breadcrumbLd, faqLd, softwareAppLd, ldJson, TITLE_MAX, DESCRIPTION_MAX } from '../src/lib/seo';
import { llmsTxt, robotsTxt, AI_CRAWLERS } from '../src/lib/llms';
import { FAQS } from '../src/lib/faqs';
import { GUIDES } from '../src/lib/guides';
import { LIMITS } from '../src/lib/rules-data';
// @ts-expect-error plain JS module
import { checkHtml } from '../scripts/check-dist.mjs';

const abs = (p: string) => `https://example.test/pluginlint${p}`;

describe('seo helpers', () => {
  it('builds titles without doubling the site name', () => {
    expect(fullTitle('Guides', 'PluginLint')).toBe('Guides | PluginLint');
    expect(fullTitle('About PluginLint', 'PluginLint')).toBe('About PluginLint');
  });
  it('normalises canonical paths to a trailing slash except files', () => {
    expect(canonicalPath('/pluginlint/rules')).toBe('/pluginlint/rules/');
    expect(canonicalPath('/pluginlint/rules/')).toBe('/pluginlint/rules/');
    expect(canonicalPath('/pluginlint/rss.xml')).toBe('/pluginlint/rss.xml');
  });
  it('numbers breadcrumb positions from 1', () => {
    const ld = breadcrumbLd([{ name: 'Home', url: abs('/') }, { name: 'Guides', url: abs('/guides/') }]) as any;
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement.map((i: any) => i.position)).toEqual([1, 2]);
  });
  it('refuses an empty FAQPage and maps Q&As', () => {
    expect(() => faqLd([])).toThrow();
    const ld = faqLd([{ q: 'Q?', a: 'A.' }]) as any;
    expect(ld.mainEntity[0]).toEqual({ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } });
  });
  it('marks tools as free SoftwareApplication', () => {
    const ld = softwareAppLd({ name: 'x', description: 'y', url: abs('/grader/') }) as any;
    expect(ld['@type']).toBe('SoftwareApplication');
    expect(ld.offers.price).toBe('0');
  });
  it('escapes < in JSON-LD so a </script> can never break out', () => {
    const s = ldJson({ a: '</script><b>' });
    expect(s).not.toContain('<');
    expect(JSON.parse(s).a).toBe('</script><b>');
  });
});

describe('FAQs', () => {
  it('has a FAQ for the home page and every guide, each 3–5 items', () => {
    for (const key of ['home', ...GUIDES.map((g) => g.slug)]) {
      expect(FAQS[key], key).toBeDefined();
      expect(FAQS[key].length).toBeGreaterThanOrEqual(3);
      expect(FAQS[key].length).toBeLessThanOrEqual(5);
    }
  });
  it('only has FAQs for pages that exist', () => {
    for (const key of Object.keys(FAQS)) if (key !== 'home') expect(GUIDES.some((g) => g.slug === key), key).toBe(true);
  });
  it('uses the verified limits', () => {
    const all = Object.values(FAQS).flat().map((f) => f.a).join(' ');
    expect(all).toContain(`at most ${LIMITS.displayName} characters`);
    expect(all).toContain(`${LIMITS.starterPrompt} characters`);
    expect(all).toContain(`exactly ${LIMITS.screenshotWidth} pixels wide`);
  });
});

describe('guides list', () => {
  it('every guide has a page file', () => {
    for (const g of GUIDES) expect(existsSync(`src/pages/guides/${g.slug}.astro`), g.slug).toBe(true);
  });
});

describe('llms.txt and robots.txt', () => {
  it('lists every guide and the verified limits', () => {
    const t = llmsTxt(abs);
    expect(t.startsWith('# PluginLint\n')).toBe(true);
    expect(t).toContain('not affiliated with');
    for (const g of GUIDES) expect(t).toContain(abs(`/guides/${g.slug}/`));
    expect(t).toContain(`at most ${LIMITS.displayName} characters`);
      });
  it('full version includes FAQs and rules', () => {
    const t = llmsTxt(abs, true);
    expect(t).toContain(FAQS.home[0].q);
    expect(t).toContain('Error codes: submission_display_name_required');
  });
  it('robots allows everyone, named AI crawlers, and lists the sitemap', () => {
    const r = robotsTxt(abs('/sitemap-index.xml'));
    expect(r).toContain('User-agent: *\nAllow: /');
    for (const ua of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot']) expect(AI_CRAWLERS).toContain(ua);
    for (const ua of AI_CRAWLERS) expect(r).toContain(`User-agent: ${ua}\nAllow: /`);
    expect(r).not.toMatch(/Disallow/);
    expect(r).toContain(`Sitemap: ${abs('/sitemap-index.xml')}`);
  });
});

describe('dist checker', () => {
  const good = `<!doctype html><html lang="en"><head><title>T | PluginLint</title><meta name="description" content="D">
    <link rel="canonical" href="https://x/"><meta property="og:title" content="t"><meta property="og:description" content="d">
    <meta property="og:image" content="https://x/og.png"><meta property="og:url" content="https://x/"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://x/og.png">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Why?","acceptedAnswer":{"@type":"Answer","text":"Because."}}]}</script>
    </head><body><h1>T</h1><h2>FAQ</h2><h3>Why?</h3><p>Because.</p><a href="/pluginlint/rules/">r</a></body></html>`;
  it('passes a well-formed page', () => {
    expect(checkHtml(good).problems).toEqual([]);
  });
  it('catches the common problems', () => {
    const bad = good.replace('<h1>T</h1>', '').replace('<h3>Why?</h3><p>Because.</p>', '').replace('lang="en"', '')
      .replace('/pluginlint/rules/', '/pluginlint/rules') + '<h1>a</h1><h1>b</h1><h4>x</h4><img src="a.png">';
    const p = checkHtml(bad, { resolveLink: () => false }).problems.join('\n');
    expect(p).toMatch(/<html lang>/);
    expect(p).toMatch(/2 <h1>/);
    expect(p).toMatch(/heading skips/);
    expect(p).toMatch(/FAQ question not visible/);
    expect(p).toMatch(/broken internal link/);
    expect(p).toMatch(/without trailing slash/);
    expect(p).toMatch(/img without alt/);
  });
  it('flags long titles and descriptions', () => {
    const long = good.replace('T | PluginLint', 'x'.repeat(TITLE_MAX + 1)).replace('content="D"', `content="${'d'.repeat(DESCRIPTION_MAX + 1)}"`);
    const p = checkHtml(long).problems.join('\n');
    expect(p).toMatch(/title 61 chars/);
    expect(p).toMatch(/description 156 chars/);
  });
  it('flags invalid JSON-LD and banned domains', () => {
    const p = checkHtml(good.replace('"@type":"FAQPage"', '"@type":FAQPage') + '<a href="https://banned.example/">x</a>', { banned: ['banned.example'] }).problems.join('\n');
    expect(p).toMatch(/invalid JSON-LD/);
    expect(p).toMatch(/banned/);
  });
});
