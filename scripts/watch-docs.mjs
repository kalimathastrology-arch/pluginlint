#!/usr/bin/env node
// PluginLint docs watcher.
// Fetches ONLY the two public OpenAI developer docs pages below (one request per page per run),
// extracts readable text, hashes it, and when the text changes appends a dated entry with a
// line-level diff summary to data/rules-history.json. It never fetches chatgpt.com or any other site.
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HISTORY = join(ROOT, 'data', 'rules-history.json');
const SNAP_DIR = join(ROOT, 'data', 'snapshots');
const USER_AGENT = 'PluginLint-docs-watch (contact via site)';

export const PAGES = [
  { id: 'submission-errors', title: 'Plugin submission errors', url: 'https://developers.openai.com/plugins/deploy/submission-errors' },
  { id: 'plugin-guidelines', title: 'Plugin guidelines', url: 'https://developers.openai.com/plugins/plugin-guidelines' },
];
const ALLOWED_HOST = 'developers.openai.com';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', times: '×' };
function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

/** Extract the main readable text from a docs HTML page (no dependencies). */
export function extractText(html) {
  let h = html;
  const main = /<main[\s>][\s\S]*?<\/main>/i.exec(h) || /<article[\s>][\s\S]*?<\/article>/i.exec(h);
  if (main) h = main[0];
  h = h
    .replace(/<(script|style|noscript|svg|template|nav|header|footer|aside|button)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6]|\/pre|\/table|\/thead|\/tbody|\/ul|\/ol)\b[^>]*>/gi, '\n')
    .replace(/<\/t[dh]>/gi, ' | ')
    .replace(/<li\b[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '');
  return decode(h)
    .split('\n')
    .map((l) => l.replace(/[ \t\u00a0]+/g, ' ').trim())
    .filter((l) => l && l !== '|')
    .join('\n');
}

export const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

/** Line-set diff summary: lines present in only one version (order-insensitive, cheap, readable). */
export function diffSummary(oldText, newText, maxLines = 25) {
  const a = oldText.split('\n');
  const b = newText.split('\n');
  const setA = new Set(a);
  const setB = new Set(b);
  const added = b.filter((l) => !setA.has(l));
  const removed = a.filter((l) => !setB.has(l));
  const nums = (arr) => [...new Set(arr.join(' ').match(/\b\d[\d,]*(\.\d+)?\b/g) || [])];
  return {
    addedCount: added.length,
    removedCount: removed.length,
    added: added.slice(0, maxLines),
    removed: removed.slice(0, maxLines),
    numbersAdded: nums(added).filter((n) => !nums(removed).includes(n)).slice(0, 30),
    numbersRemoved: nums(removed).filter((n) => !nums(added).includes(n)).slice(0, 30),
  };
}

async function fetchOnce(url) {
  if (new URL(url).host !== ALLOWED_HOST) throw new Error(`Refusing to fetch non-allowlisted host: ${url}`);
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' }, redirect: 'manual' });
  // Redirects are not followed, so each page gets exactly one request per run and never leaves the allowlisted host.
  // If a page moves, update PAGES by hand.
  if (res.status >= 300 && res.status < 400) throw new Error(`${url} → HTTP ${res.status} redirect to ${res.headers.get('location')}; update PAGES`);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const history = existsSync(HISTORY)
    ? JSON.parse(await readFile(HISTORY, 'utf8'))
    : { description: 'Changes detected in the OpenAI plugin docs pages tracked by PluginLint.', pages: {}, entries: [] };
  await mkdir(SNAP_DIR, { recursive: true });
  let changed = false;
  let failures = 0;

  for (const page of PAGES) {
    let text;
    try {
      text = extractText(await fetchOnce(page.url)); // exactly one request per page per run
    } catch (e) {
      failures++;
      console.error(`! ${page.id}: ${e.message}`);
      continue;
    }
    if (text.length < 500) { failures++; console.error(`! ${page.id}: extracted text suspiciously short (${text.length} chars); skipping`); continue; }
    const hash = sha256(text);
    const snapPath = join(SNAP_DIR, `${page.id}.txt`);
    const prev = history.pages[page.id];
    const prevText = existsSync(snapPath) ? await readFile(snapPath, 'utf8') : '';

    if (!prev) {
      history.entries.unshift({
        date: today, page: page.id, title: page.title, url: page.url, type: 'baseline', hash,
        summary: `Started tracking “${page.title}” (${text.split('\n').length} lines of text).`,
      });
      changed = true;
      console.log(`+ ${page.id}: baseline ${hash.slice(0, 12)}`);
    } else if (prev.hash !== hash) {
      const d = diffSummary(prevText, text);
      const parts = [`${d.addedCount} line(s) added, ${d.removedCount} removed`];
      if (d.numbersAdded.length || d.numbersRemoved.length) parts.push(`numbers added: ${d.numbersAdded.join(', ') || '—'}; numbers removed: ${d.numbersRemoved.join(', ') || '—'}`);
      history.entries.unshift({
        date: today, page: page.id, title: page.title, url: page.url, type: 'change', hash, prevHash: prev.hash,
        summary: `“${page.title}” changed: ${parts.join('; ')}. Review the limits on PluginLint’s rules page.`,
        diff: d,
      });
      changed = true;
      console.log(`* ${page.id}: changed ${prev.hash.slice(0, 12)} → ${hash.slice(0, 12)}`);
    } else {
      console.log(`= ${page.id}: unchanged`);
    }
    if (!prev || prev.hash !== hash) {
      history.pages[page.id] = { title: page.title, url: page.url, hash, lastChanged: today };
      await writeFile(snapPath, text + '\n');
    }
  }

  if (changed) {
    history.updated = today;
    await writeFile(HISTORY, JSON.stringify(history, null, 2) + '\n');
    console.log('rules-history.json updated');
  }
  if (failures === PAGES.length) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
