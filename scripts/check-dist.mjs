#!/usr/bin/env node
// Post-build SEO + link checker for dist/. No dependencies. Usage: node scripts/check-dist.mjs [distDir]
// Fails (exit 1) on: broken internal links, missing/duplicate/too-long titles and descriptions, H1 count != 1,
// heading-level skips, missing canonical/og:image/lang, images without alt, invalid JSON-LD, FAQPage text that
// isn't visible on the page, invalid RSS/sitemap XML, and any mention of banned domains.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;
// Domains the site must never mention or link to: comma-separated in BANNED_DOMAINS (kept out of the repo).
export const BANNED = (process.env.BANNED_DOMAINS ?? '').split(',').map((d) => d.trim()).filter(Boolean);

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, ' ');
const attr = (tag, name) => { const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag); return m ? decode(m[2] ?? m[3]) : null; };
const meta = (html, key, val) => { for (const m of html.matchAll(/<meta\b[^>]*>/gi)) if (attr(m[0], key) === val) return attr(m[0], 'content'); return null; };
export const textOf = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** Check one HTML document. `resolveLink(href)` returns true if an internal target exists. Returns {problems, info}. */
export function checkHtml(html, { resolveLink = () => true, banned = BANNED } = {}) {
  const p = [];
  const noindex = /<meta[^>]+name="robots"[^>]+noindex/i.test(html);
  const title = decode((/<title>([\s\S]*?)<\/title>/i.exec(html) || [])[1] ?? '').trim();
  const desc = meta(html, 'name', 'description') ?? '';
  if (!title) p.push('missing <title>'); else if ([...title].length > TITLE_MAX) p.push(`title ${[...title].length} chars > ${TITLE_MAX}: "${title}"`);
  if (!desc) p.push('missing meta description'); else if ([...desc].length > DESCRIPTION_MAX) p.push(`description ${[...desc].length} chars > ${DESCRIPTION_MAX}`);
  if (!/<html[^>]*\slang="[a-z]/i.test(html)) p.push('missing <html lang>');
  const h1 = (html.match(/<h1[\s>]/gi) || []).length; if (h1 !== 1) p.push(`${h1} <h1> elements`);
  let prev = 1;
  for (const m of html.matchAll(/<h([1-6])[\s>]/gi)) { const lvl = +m[1]; if (lvl > prev + 1) p.push(`heading skips from h${prev} to h${lvl}`); prev = lvl; }
  if (!noindex && !/<link[^>]+rel="canonical"/i.test(html)) p.push('missing canonical');
  for (const k of ['og:title', 'og:description', 'og:image', 'og:url']) if (!meta(html, 'property', k)) p.push(`missing ${k}`);
  for (const k of ['twitter:card', 'twitter:image']) if (!meta(html, 'name', k)) p.push(`missing ${k}`);
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) if (attr(m[0], 'alt') === null) p.push(`img without alt: ${m[0].slice(0, 80)}`);
  for (const m of html.matchAll(/<iframe\b[^>]*>/gi)) if (!attr(m[0], 'title')) p.push('iframe without title');
  // JSON-LD
  const types = [];
  const visible = textOf(html);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    let data;
    try { data = JSON.parse(m[1]); } catch (e) { p.push(`invalid JSON-LD: ${e.message}`); continue; }
    for (const d of Array.isArray(data) ? data : [data]) {
      types.push(d['@type']);
      if (!d['@context']) p.push(`JSON-LD ${d['@type']} without @context`);
      if (d['@type'] === 'FAQPage') for (const q of d.mainEntity ?? []) {
        if (!visible.includes(q.name)) p.push(`FAQ question not visible: ${q.name}`);
        if (!visible.includes(q.acceptedAnswer?.text)) p.push(`FAQ answer not visible: ${q.name}`);
      }
    }
  }
  // links
  const links = [];
  for (const m of html.matchAll(/<(a|link)\b[^>]*>/gi)) { const h = attr(m[0], 'href'); if (h) links.push(h); }
  for (const h of links) {
    if (banned.some((b) => h.includes(b))) p.push(`banned link: ${h}`);
    if (/^(https?:|mailto:|#|data:)/i.test(h) || h.startsWith('//')) continue;
    if (!resolveLink(h)) p.push(`broken internal link: ${h}`);
    const path = h.split('#')[0].split('?')[0];
    if (path && !path.endsWith('/') && !/\.[a-z0-9]+$/i.test(path)) p.push(`internal link without trailing slash: ${h}`);
  }
  if (banned.some((b) => html.includes(b))) p.push('mentions a banned domain');
  return { problems: p, info: { title, desc, noindex, types, h1 } };
}

function walk(dir) { return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; }); }

export function checkDist(dist, basePath) {
  const files = walk(dist);
  const report = []; const titles = new Map(); const descs = new Map();
  const base = basePath.replace(/\/$/, '');
  const resolveFrom = (file) => (href) => {
    let path = href.split('#')[0].split('?')[0];
    if (!path) return true;
    let target;
    if (path.startsWith('/')) { if (!path.startsWith(base + '/') && path !== base) return false; target = join(dist, path.slice(base.length)); }
    else target = resolve(dirname(file), path);
    return existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html')));
  };
  for (const f of files.filter((f) => f.endsWith('.html'))) {
    const rel = relative(dist, f);
    const { problems, info } = checkHtml(readFileSync(f, 'utf8'), { resolveLink: resolveFrom(f) });
    if (!info.noindex) {
      if (titles.has(info.title)) problems.push(`duplicate title with ${titles.get(info.title)}`); else titles.set(info.title, rel);
      if (descs.has(info.desc)) problems.push(`duplicate description with ${descs.get(info.desc)}`); else descs.set(info.desc, rel);
    }
    report.push({ file: rel, problems, info });
  }
  const xml = files.filter((f) => f.endsWith('.xml'));
  for (const f of xml) {
    const s = readFileSync(f, 'utf8');
    const problems = [];
    if (!s.startsWith('<?xml')) problems.push('no XML declaration');
    // light well-formedness: balanced tags
    const stack = [];
    for (const m of s.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '').matchAll(/<(\/?)([A-Za-z][\w:.-]*)[^>]*?(\/?)>/g)) {
      if (m[3]) continue; if (!m[1]) stack.push(m[2]); else if (stack.pop() !== m[2]) { problems.push(`unbalanced </${m[2]}>`); break; }
    }
    if (stack.length) problems.push(`unclosed <${stack.pop()}>`);
    for (const loc of s.matchAll(/<(?:loc|link)>([^<]+)<\/(?:loc|link)>/g)) if (!/^https:\/\//.test(loc[1])) problems.push(`non-absolute URL ${loc[1]}`);
    report.push({ file: relative(dist, f), problems, info: {} });
  }
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const dist = resolve(process.argv[2] ?? join(root, 'dist'));
  const { BASE_PATH } = await import('../site.config.mjs');
  const report = checkDist(dist, BASE_PATH);
  let bad = 0;
  for (const r of report) {
    const t = r.info.title ? ` [${[...r.info.title].length}] ${r.info.title} | desc ${[...(r.info.desc ?? '')].length} | ld: ${(r.info.types ?? []).join(',')}` : '';
    console.log(`${r.problems.length ? '✗' : '✓'} ${r.file}${t}`);
    for (const p of r.problems) { console.log(`    - ${p}`); bad++; }
  }
  console.log(`\n${report.length} files checked, ${bad} problem(s).`);
  process.exit(bad ? 1 : 0);
}
