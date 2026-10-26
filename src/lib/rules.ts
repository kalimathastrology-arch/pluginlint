// Pure rule functions. No DOM, no network. Used by the in-browser grader and the unit tests.
import { LIMITS, CATEGORIES } from './rules-data';

export type Status = 'pass' | 'warn' | 'fail';
export interface Check {
  id: string;
  field: string;
  status: Status;
  message: string;
  fix?: string;
  heuristic?: boolean;
}

/** Character count in Unicode code points (the docs say "characters" without defining them). */
export const charLen = (s: string): number => Array.from(s).length;

export const isOneLine = (s: string): boolean => !/[\r\n\u2028\u2029]/.test(s);

/** Characters the docs exclude from "supported text": control chars, Unicode line/paragraph
 * separators, and invisible formatting characters (our best-effort list). */
const UNSUPPORTED_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u2028\u2029\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/u;
export function hasUnsupportedChars(s: string, allowLineBreaks = false): boolean {
  if (UNSUPPORTED_RE.test(s)) return true;
  if (/\t/.test(s)) return true;
  if (!allowLineBreaks && /[\r\n]/.test(s)) return true;
  return false;
}

export const isBlank = (s: string | undefined | null): boolean => !s || s.trim() === '';

/** Normalise for duplicate detection: Unicode NFKC + collapse whitespace + trim. */
export const normalizePrompt = (s: string): string => s.normalize('NFKC').replace(/\s+/gu, ' ').trim();

// ---------- colour ----------
export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const isSixDigitHex = (hex: string): boolean => /^#[0-9a-fA-F]{6}$/.test(hex.trim());

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) throw new Error(`Invalid hex colour: ${hex}`);
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}
/** WCAG 2.x contrast ratio between two colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// ---------- URLs ----------
export function checkHttpsUrl(raw: string): { ok: boolean; reason?: string } {
  const s = raw.trim();
  if (s !== raw) return { ok: false, reason: 'has leading or trailing spaces' };
  if (charLen(s) > LIMITS.url) return { ok: false, reason: `is ${charLen(s)} characters (max ${LIMITS.url})` };
  let u: URL;
  try { u = new URL(s); } catch { return { ok: false, reason: 'is not a valid URL' }; }
  if (u.protocol !== 'https:') return { ok: false, reason: 'does not use https://' };
  if (!u.hostname) return { ok: false, reason: 'has no host' };
  if (u.username || u.password) return { ok: false, reason: 'contains embedded credentials (user:pass@)' };
  if (/\s/.test(s)) return { ok: false, reason: 'contains spaces' };
  return { ok: true };
}

// ---------- screenshots ----------
export function parseScreenshotSizes(text: string): { w: number; h: number; raw: string }[] {
  return text
    .split(/[\n,;]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((raw) => {
      const m = /^(\d+)\s*[x×*]\s*(\d+)$/i.exec(raw.replace(/px/gi, ''));
      return m ? { w: +m[1], h: +m[2], raw } : { w: NaN, h: NaN, raw };
    });
}
export const screenshotSizeOk = (w: number, h: number): boolean =>
  w === LIMITS.screenshotWidth && h >= LIMITS.screenshotMinHeight && h <= LIMITS.screenshotMaxHeight;

// ---------- wording heuristics ----------
const NAME_SUFFIX_RE = /\b(mcp(\s+server)?|plug-?in)\b/i;
export const nameHasForbiddenSuffix = (name: string): boolean => NAME_SUFFIX_RE.test(name);

// A small list of common English words that would make a generic single-word name.
export const GENERIC_WORDS = new Set(
  ('ai agent analytics app apps assistant atlas audio book books budget calendar chat clean cloud code coder ' +
   'compass connect convert data design docs document draft editor email files finance fit fitness flow focus ' +
   'forms genius health helper home hub image images insight insights invoice journal learn list maps market ' +
   'math media mind money music news notes office pay photo photos pilot planner plan plus point pro quiz recipe ' +
   'recipes research resume scan schedule search shop shopping sign sketch slides smart social sort spark ' +
   'sports stocks storage study summary task tasks teacher team text timer todo tools translate translator ' +
   'travel trip tutor video videos voice weather wiki work writer writing').split(' '),
);
export function isGenericName(name: string): boolean {
  const words = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 1) return GENERIC_WORDS.has(words[0].replace(/[^a-z]/g, ''));
  return words.length === 2 && words.every((w) => GENERIC_WORDS.has(w.replace(/[^a-z]/g, '')));
}

const PRICING_TERMS = [
  /\bfree\s+trial\b/i, /\bfree\b/i, /\bdiscount(s|ed)?\b/i, /\bpromo(tion|tions|tional)?\b/i, /\bcoupon\b/i,
  /\bsubscri(be|ption|ptions)\b/i, /\bpric(e|es|ing)\b/i, /\b\d+\s?%\s?off\b/i, /[$€£₹]\s?\d/, /\bper\s+month\b/i,
  /\/\s?mo(nth)?\b/i, /\bupgrade\b/i, /\bpremium\b/i, /\blimited[-\s]time\b/i, /\bsale\b/i, /\bdeal(s)?\b/i,
];
const COMPARISON_TERMS = [
  /\bbetter\s+than\b/i, /\bfaster\s+than\b/i, /\bcheaper\s+than\b/i, /\bvs\.?\b/i, /\bversus\b/i,
  /\bcompared?\s+(to|with)\b/i, /\bunlike\b/i, /\balternative\s+to\b/i, /\boutperform(s)?\b/i, /#\s?1\b/,
  /\bnumber\s+one\b/i, /\bthe\s+best\b/i, /\bbest\b/i, /\bthe\s+only\b/i, /\breplaces?\b/i, /\bworld'?s\b/i,
];
const ENDORSEMENT_TERMS = [/\bofficial\b/i, /\bendorsed\b/i, /\bby\s+openai\b/i, /\bopenai['’]?s?\s+(official|partner)\b/i];

export function findTerms(text: string, terms: RegExp[]): string[] {
  const hits = new Set<string>();
  for (const re of terms) {
    const m = re.exec(text);
    if (m) hits.add(m[0].trim());
  }
  return [...hits];
}
export const findPricingTerms = (t: string) => findTerms(t, PRICING_TERMS);
export const findComparisonTerms = (t: string) => findTerms(t, COMPARISON_TERMS);
export const findEndorsementTerms = (t: string) => findTerms(t, ENDORSEMENT_TERMS);

export const isKnownCategory = (c: string): boolean => (CATEGORIES as readonly string[]).includes(c);
