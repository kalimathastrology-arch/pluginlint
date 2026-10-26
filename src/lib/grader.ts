import { LIMITS } from './rules-data';
import {
  type Check, charLen, isOneLine, hasUnsupportedChars, isBlank, normalizePrompt, isSixDigitHex, contrastRatio,
  checkHttpsUrl, parseScreenshotSizes, screenshotSizeOk, nameHasForbiddenSuffix, isGenericName,
  findPricingTerms, findComparisonTerms, findEndorsementTerms, isKnownCategory,
} from './rules';

export interface ListingInput {
  submissionType: 'mcp' | 'skills';
  displayName: string;
  subtitle: string;
  longDescription: string;
  developerName: string;
  category: string;
  starterPrompts: string[];
  capabilities: string[];
  websiteUrl: string;
  supportUrl: string;
  privacyUrl: string;
  termsUrl: string;
  brandColor: string;
  brandColorDark: string;
  hasCustomUi: boolean;
  screenshots: string; // "706x500" per line
}

export interface GradeResult {
  score: number;
  counts: { pass: number; warn: number; fail: number };
  checks: Check[];
}

function textField(checks: Check[], id: string, field: string, value: string, max: number, opts: { oneLine: boolean; allowBreaks?: boolean }) {
  if (isBlank(value)) {
    checks.push({ id: `${id}.required`, field, status: 'fail', message: `${field} is required and cannot be empty or only spaces.`, fix: `Fill in the ${field.toLowerCase()}.` });
    return;
  }
  const n = charLen(value);
  checks.push(n <= max
    ? { id: `${id}.length`, field, status: 'pass', message: `${n}/${max} characters.` }
    : { id: `${id}.length`, field, status: 'fail', message: `${n} characters — limit is ${max}.`, fix: `Cut ${n - max} character${n - max === 1 ? '' : 's'}.` });
  if (opts.oneLine && !isOneLine(value)) {
    checks.push({ id: `${id}.oneline`, field, status: 'fail', message: 'Contains a line break; must be one line.', fix: 'Remove the line break(s).' });
  }
  if (hasUnsupportedChars(value, !!opts.allowBreaks)) {
    checks.push({ id: `${id}.chars`, field, status: 'fail', message: 'Contains unsupported characters (tabs, control or invisible formatting characters).', fix: 'Retype the text or paste it as plain text to strip hidden characters.' });
  }
}

export function gradeListing(input: ListingInput): GradeResult {
  const c: Check[] = [];

  textField(c, 'displayName', 'Display name', input.displayName, LIMITS.displayName, { oneLine: true });
  textField(c, 'subtitle', 'Subtitle (short description)', input.subtitle, LIMITS.subtitle, { oneLine: true });
  textField(c, 'longDescription', 'Long description', input.longDescription, LIMITS.longDescription, { oneLine: false, allowBreaks: true });
  textField(c, 'developerName', 'Developer name', input.developerName, LIMITS.developerName, { oneLine: true });

  // Category
  if (isBlank(input.category)) c.push({ id: 'category', field: 'Category', status: 'fail', message: 'Category is required for final submission.', fix: 'Pick one of the 13 supported categories.' });
  else if (!isKnownCategory(input.category)) c.push({ id: 'category', field: 'Category', status: 'fail', message: `“${input.category}” is not a supported category.`, fix: 'Pick one of the 13 supported categories.' });
  else c.push({ id: 'category', field: 'Category', status: 'pass', message: `${input.category} is a supported category.` });

  // Starter prompts
  const prompts = input.starterPrompts.filter((p) => !isBlank(p));
  if (input.starterPrompts.some((p) => p.length > 0 && isBlank(p))) {
    c.push({ id: 'prompts.empty', field: 'Starter prompts', status: 'fail', message: 'A starter prompt contains only whitespace.', fix: 'Delete the empty prompt or write text in it.' });
  }
  if (prompts.length === 0) c.push({ id: 'prompts.none', field: 'Starter prompts', status: 'warn', message: 'No starter prompts. They are optional in the error list, but the guidelines say to provide example prompts.', fix: 'Add 1–3 prompts that show your main use cases.' });
  if (prompts.length > LIMITS.starterPromptsMax) c.push({ id: 'prompts.count', field: 'Starter prompts', status: 'fail', message: `${prompts.length} prompts — at most ${LIMITS.starterPromptsMax} allowed.`, fix: `Keep your best ${LIMITS.starterPromptsMax}.` });
  else if (prompts.length) c.push({ id: 'prompts.count', field: 'Starter prompts', status: 'pass', message: `${prompts.length}/${LIMITS.starterPromptsMax} prompts.` });
  const seen = new Map<string, number>();
  const seenCi = new Map<string, number>();
  prompts.forEach((p, i) => {
    const label = `Starter prompt ${i + 1}`;
    const n = charLen(p);
    if (n > LIMITS.starterPrompt) c.push({ id: `prompt${i}.length`, field: label, status: 'fail', message: `${n} characters — limit is ${LIMITS.starterPrompt}.`, fix: `Shorten by ${n - LIMITS.starterPrompt} characters.` });
    else c.push({ id: `prompt${i}.length`, field: label, status: 'pass', message: `${n}/${LIMITS.starterPrompt} characters.` });
    if (!isOneLine(p)) c.push({ id: `prompt${i}.oneline`, field: label, status: 'fail', message: 'Contains a line break.', fix: 'Make it a single line.' });
    if (hasUnsupportedChars(p)) c.push({ id: `prompt${i}.chars`, field: label, status: 'fail', message: 'Contains unsupported/invisible characters.', fix: 'Paste as plain text.' });
    if (/(^|\s)@[\w-]+/u.test(p)) c.push({ id: `prompt${i}.mention`, field: label, status: 'fail', message: 'Contains an @mention. MCP server @mentions are not allowed.', fix: 'Remove the @name; describe the task in plain words.' });
    const key = normalizePrompt(p);
    if (seen.has(key)) c.push({ id: `prompt${i}.dup`, field: label, status: 'fail', message: `Duplicate of prompt ${seen.get(key)! + 1} after Unicode/whitespace normalisation.`, fix: 'Replace it with a prompt for a different use case.' });
    else {
      seen.set(key, i);
      const ci = key.toLowerCase();
      if (seenCi.has(ci)) c.push({ id: `prompt${i}.dupci`, field: label, status: 'warn', heuristic: true, message: `Only differs from prompt ${seenCi.get(ci)! + 1} by letter case.`, fix: 'Make each prompt show a different use case.' });
      else seenCi.set(ci, i);
    }
  });

  // Capabilities
  const caps = input.capabilities.filter((x) => !isBlank(x));
  if (caps.length > LIMITS.capabilitiesMax) c.push({ id: 'caps.count', field: 'Capabilities', status: 'fail', message: `${caps.length} capabilities — at most ${LIMITS.capabilitiesMax}.`, fix: 'Merge or drop the weakest ones.' });
  else c.push({ id: 'caps.count', field: 'Capabilities', status: 'pass', message: `${caps.length}/${LIMITS.capabilitiesMax} capabilities.` });
  caps.forEach((cap, i) => {
    const n = charLen(cap);
    if (n > LIMITS.capability) c.push({ id: `cap${i}.length`, field: `Capability ${i + 1}`, status: 'fail', message: `${n} characters — limit is ${LIMITS.capability}.`, fix: `Shorten by ${n - LIMITS.capability} characters.` });
    if (hasUnsupportedChars(cap)) c.push({ id: `cap${i}.chars`, field: `Capability ${i + 1}`, status: 'fail', message: 'Contains unsupported/invisible characters.', fix: 'Paste as plain text.' });
  });

  // URLs
  const urls: [string, string, string][] = [
    ['websiteUrl', 'Website URL', input.websiteUrl], ['supportUrl', 'Support URL', input.supportUrl],
    ['privacyUrl', 'Privacy policy URL', input.privacyUrl], ['termsUrl', 'Terms URL', input.termsUrl],
  ];
  for (const [id, field, v] of urls) {
    if (isBlank(v)) {
      c.push(input.submissionType === 'mcp'
        ? { id, field, status: 'fail', message: `${field} is required for remote MCP submissions.`, fix: `Add an https:// ${field.toLowerCase()}.` }
        : { id, field, status: 'warn', message: `${field} is optional for skills-only ZIP uploads, but recommended.`, fix: `Add an https:// ${field.toLowerCase()} if you have one.` });
      continue;
    }
    const r = checkHttpsUrl(v);
    c.push(r.ok ? { id, field, status: 'pass', message: 'HTTPS, valid, within 1,024 characters.' }
      : { id, field, status: 'fail', message: `${field} ${r.reason}.`, fix: 'Use a full https:// URL without credentials, at most 1,024 characters.' });
  }

  // Brand colours
  const colour = (id: string, field: string, v: string, bg: string, bgLabel: string) => {
    if (isBlank(v)) { c.push({ id, field, status: 'pass', message: 'Not set (optional).' }); return; }
    if (!isSixDigitHex(v)) { c.push({ id, field, status: 'fail', message: `“${v}” is not a six-digit hex colour.`, fix: 'Use the form #1ABCFE.' }); return; }
    const r = contrastRatio(v, bg);
    const rs = r.toFixed(2);
    c.push(r >= LIMITS.brandContrastMin
      ? { id, field, status: 'pass', message: `Contrast ${rs}:1 against ${bgLabel} (min 2:1).` }
      : { id, field, status: 'fail', message: `Contrast only ${rs}:1 against ${bgLabel} (min 2:1).`, fix: bg === '#FFFFFF' ? 'Use a darker shade.' : 'Use a lighter shade.' });
  };
  colour('brandColor', 'Brand colour (light)', input.brandColor, LIMITS.brandLightBackground, 'white #FFFFFF');
  colour('brandColorDark', 'Brand colour (dark)', input.brandColorDark, LIMITS.brandDarkBackground, '#212121');

  // Screenshots
  const shots = parseScreenshotSizes(input.screenshots || '');
  if (shots.length) {
    if (input.submissionType !== 'mcp' || !input.hasCustomUi) {
      c.push({ id: 'shots.allowed', field: 'Screenshots', status: 'fail', message: input.submissionType === 'skills' ? 'Skills-only ZIP uploads must not include screenshots.' : 'Screenshots are only allowed when your MCP server provides custom UI (a UI output template).', fix: 'Remove the screenshots, or add them only for an MCP plugin with custom UI.' });
    }
    if (prompts.length && shots.length !== prompts.length) c.push({ id: 'shots.count', field: 'Screenshots', status: 'fail', message: `${shots.length} screenshot(s) for ${prompts.length} starter prompt(s). If you add screenshots, provide one per starter prompt.`, fix: 'Match the number of screenshots to the number of starter prompts.' });
    shots.forEach((s, i) => {
      const field = `Screenshot ${i + 1}`;
      if (Number.isNaN(s.w)) c.push({ id: `shot${i}`, field, status: 'fail', message: `Could not read “${s.raw}”. Use WIDTHxHEIGHT, e.g. 706x500.`, fix: 'Enter sizes like 706x500.' });
      else if (screenshotSizeOk(s.w, s.h)) c.push({ id: `shot${i}`, field, status: 'pass', message: `${s.w}×${s.h} px is within spec.` });
      else c.push({ id: `shot${i}`, field, status: 'fail', message: `${s.w}×${s.h} px — must be exactly 706 px wide and 400–860 px tall.`, fix: s.w !== 706 ? 'Resize/crop to exactly 706 px wide.' : 'Crop or pad the height into the 400–860 px range.' });
    });
    c.push({ id: 'shots.note', field: 'Screenshots', status: 'warn', heuristic: true, message: 'The guidelines say screenshots are no longer shown in the Directory; starter prompts matter more.', fix: 'Spend your effort on clear starter prompts.' });
  }

  // Heuristic wording checks (warnings only)
  const name = input.displayName || '';
  if (name && nameHasForbiddenSuffix(name)) c.push({ id: 'name.suffix', field: 'Display name', status: 'warn', heuristic: true, message: 'Name contains “MCP”, “MCP Server” or “Plugin”. Guidelines say not to append these to a company or product name.', fix: 'Drop the suffix — use just your brand/product name.' });
  if (name && isGenericName(name)) c.push({ id: 'name.generic', field: 'Display name', status: 'warn', heuristic: true, message: 'Manual review: the name looks like a generic dictionary word. Guidelines say to avoid generic names not tied to your brand.', fix: 'Use your brand name, or brand + function (e.g. “Acme Notes”).' });
  const copy = [input.subtitle, input.longDescription, ...caps].join('\n');
  const pricing = findPricingTerms(copy);
  if (pricing.length) c.push({ id: 'copy.pricing', field: 'Subtitle/description', status: 'warn', heuristic: true, message: `Possible pricing/promotion wording: ${pricing.map((t) => `“${t}”`).join(', ')}.`, fix: 'Remove prices, plans, trials, discounts and promotions; describe what the plugin does.' });
  const cmp = findComparisonTerms(copy);
  if (cmp.length) c.push({ id: 'copy.comparison', field: 'Subtitle/description', status: 'warn', heuristic: true, message: `Possible comparison or unverifiable claim: ${cmp.map((t) => `“${t}”`).join(', ')}.`, fix: 'State what your plugin does without comparing it to others or claiming to be the best.' });
  const end = findEndorsementTerms([name, copy].join('\n'));
  if (end.length) c.push({ id: 'copy.endorsement', field: 'Name/description', status: 'warn', heuristic: true, message: `Wording may imply official status or OpenAI endorsement: ${end.map((t) => `“${t}”`).join(', ')}.`, fix: 'Do not imply the plugin is made or endorsed by OpenAI.' });

  const counts = { pass: 0, warn: 0, fail: 0 };
  for (const x of c) counts[x.status]++;
  const total = c.length || 1;
  // Score: share of checks passed (warnings count 60%). Any hard failure caps the score at 69.
  const raw = Math.round(((counts.pass + counts.warn * 0.6) / total) * 100);
  return { score: counts.fail ? Math.min(raw, 69) : raw, counts, checks: c };
}

export function formatReport(r: GradeResult, name: string): string {
  const icon = { pass: 'PASS', warn: 'WARN', fail: 'FAIL' } as const;
  const lines = [
    `PluginLint report for "${name || '(no name)'}" — score ${r.score}/100`,
    `${r.counts.fail} fail · ${r.counts.warn} warn · ${r.counts.pass} pass`,
    '',
    ...r.checks.map((x) => `[${icon[x.status]}] ${x.field}: ${x.message}${x.fix && x.status !== 'pass' ? ` → Fix: ${x.fix}` : ''}${x.heuristic ? ' (heuristic)' : ''}`),
    '',
    'Checked locally in the browser. Not affiliated with OpenAI. Verify against the official docs before submitting.',
  ];
  return lines.join('\n');
}
