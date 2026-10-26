// Build-time helper: real git commit dates for source files (used for dateModified and sitemap lastmod).
// Needs full history in CI (actions/checkout with fetch-depth: 0). Falls back to null if git is unavailable.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const cache = new Map();

function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

/** ISO date (YYYY-MM-DD) of the last commit touching any of the given repo-relative paths, or null. */
export function lastModified(...files) {
  const key = 'm:' + files.join('|');
  if (!cache.has(key)) {
    const out = git(['log', '-1', '--format=%cI', '--', ...files]);
    cache.set(key, out ? out.slice(0, 10) : null);
  }
  return cache.get(key);
}

/** ISO date (YYYY-MM-DD) of the first commit that added the file, or null. */
export function firstPublished(file) {
  const key = 'p:' + file;
  if (!cache.has(key)) {
    const out = git(['log', '--diff-filter=A', '--follow', '--format=%cI', '--', file]).split('\n').filter(Boolean).pop();
    cache.set(key, out ? out.slice(0, 10) : null);
  }
  return cache.get(key);
}

/** Map a site route ("/guides/foo/") to its source page file, relative to the repo root. */
export function pageFileForRoute(route) {
  const clean = route.replace(/^\/+|\/+$/g, '');
  const candidates = clean
    ? [`src/pages/${clean}.astro`, `src/pages/${clean}/index.astro`, `src/pages/${clean}.ts`]
    : ['src/pages/index.astro'];
  return candidates.find((c) => existsSync(join(ROOT, c))) ?? null;
}
