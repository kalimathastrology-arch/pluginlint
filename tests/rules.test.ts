import { describe, it, expect } from 'vitest';
import {
  charLen, isOneLine, hasUnsupportedChars, normalizePrompt, contrastRatio, checkHttpsUrl, parseScreenshotSizes,
  screenshotSizeOk, nameHasForbiddenSuffix, isGenericName, findPricingTerms, findComparisonTerms, isSixDigitHex,
} from '../src/lib/rules';
import { gradeListing, formatReport, type ListingInput } from '../src/lib/grader';

const base: ListingInput = {
  submissionType: 'mcp', displayName: 'Acme Ledger', subtitle: 'Track invoices in chat',
  longDescription: 'Acme Ledger lets you look up invoices and payment status from your Acme account.',
  developerName: 'Acme Labs Pvt Ltd', category: 'Finance',
  starterPrompts: ['Show unpaid invoices from last month', 'Summarise invoice INV-1042'],
  capabilities: ['Look up invoices', 'Check payment status'],
  websiteUrl: 'https://acme.example', supportUrl: 'https://acme.example/support',
  privacyUrl: 'https://acme.example/privacy', termsUrl: 'https://acme.example/terms',
  brandColor: '#1A56DB', brandColorDark: '#7FB2FF', hasCustomUi: false, screenshots: '',
};
const statusOf = (r: ReturnType<typeof gradeListing>, id: string) => r.checks.find((c) => c.id === id)?.status;

describe('text helpers', () => {
  it('counts code points', () => { expect(charLen('héllo')).toBe(5); expect(charLen('😀a')).toBe(2); });
  it('detects line breaks', () => { expect(isOneLine('a b')).toBe(true); expect(isOneLine('a\nb')).toBe(false); expect(isOneLine('a\u2028b')).toBe(false); });
  it('detects unsupported characters', () => {
    expect(hasUnsupportedChars('plain text')).toBe(false);
    expect(hasUnsupportedChars('zero\u200Bwidth')).toBe(true);
    expect(hasUnsupportedChars('tab\there')).toBe(true);
    expect(hasUnsupportedChars('line\nbreak', true)).toBe(false);
    expect(hasUnsupportedChars('line\nbreak')).toBe(true);
  });
  it('normalises prompts (NFKC + whitespace)', () => { expect(normalizePrompt('  Ｆind   flights ')).toBe('Find flights'); });
});

describe('colour contrast', () => {
  it('black/white is 21:1', () => { expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5); });
  it('same colour is 1:1', () => { expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5); });
  it('#949494 vs white ≈ 3.03', () => { expect(contrastRatio('#949494', '#FFFFFF')).toBeCloseTo(3.03, 2); });
  it('validates hex', () => { expect(isSixDigitHex('#1ABCFE')).toBe(true); expect(isSixDigitHex('#FFF')).toBe(false); expect(isSixDigitHex('1ABCFE')).toBe(false); });
});

describe('urls', () => {
  it('accepts https', () => { expect(checkHttpsUrl('https://a.example/x').ok).toBe(true); });
  it('rejects http', () => { expect(checkHttpsUrl('http://a.example').ok).toBe(false); });
  it('rejects credentials', () => { expect(checkHttpsUrl('https://u:p@a.example').ok).toBe(false); });
  it('rejects >1024 chars', () => { expect(checkHttpsUrl('https://a.example/' + 'x'.repeat(1010)).ok).toBe(false); });
  it('accepts exactly 1024 chars', () => { const u = 'https://a.example/'; expect(checkHttpsUrl(u + 'x'.repeat(1024 - u.length)).ok).toBe(true); });
});

describe('screenshots', () => {
  it('parses sizes', () => { expect(parseScreenshotSizes('706x500, 706 × 860px')).toHaveLength(2); });
  it('enforces 706 wide, 400–860 tall', () => {
    expect(screenshotSizeOk(706, 400)).toBe(true); expect(screenshotSizeOk(706, 860)).toBe(true);
    expect(screenshotSizeOk(706, 399)).toBe(false); expect(screenshotSizeOk(706, 861)).toBe(false); expect(screenshotSizeOk(705, 500)).toBe(false);
  });
});

describe('wording heuristics', () => {
  it('flags MCP / Plugin suffixes', () => { expect(nameHasForbiddenSuffix('Acme MCP')).toBe(true); expect(nameHasForbiddenSuffix('Acme MCP Server')).toBe(true); expect(nameHasForbiddenSuffix('Acme Plugin')).toBe(true); expect(nameHasForbiddenSuffix('Acme')).toBe(false); });
  it('flags generic names', () => { expect(isGenericName('Notes')).toBe(true); expect(isGenericName('Acme Notes')).toBe(false); });
  it('finds pricing terms', () => { expect(findPricingTerms('Start your free trial, 20% off')).toContain('free trial'); expect(findPricingTerms('Look up invoices')).toEqual([]); });
  it('finds comparison terms', () => { expect(findComparisonTerms('Faster than Zapier')).toContain('Faster than'); expect(findComparisonTerms('Look up invoices')).toEqual([]); });
});

describe('gradeListing', () => {
  it('clean listing has no failures', () => {
    const r = gradeListing(base);
    expect(r.counts.fail).toBe(0);
    expect(r.score).toBeGreaterThanOrEqual(90);
  });
  it('display name 30 ok, 31 fails', () => {
    expect(statusOf(gradeListing({ ...base, displayName: 'A'.repeat(30) }), 'displayName.length')).toBe('pass');
    expect(statusOf(gradeListing({ ...base, displayName: 'A'.repeat(31) }), 'displayName.length')).toBe('fail');
  });
  it('subtitle 31 fails', () => { expect(statusOf(gradeListing({ ...base, subtitle: 'x'.repeat(31) }), 'subtitle.length')).toBe('fail'); });
  it('long description 4000 ok, 4001 fails', () => {
    expect(statusOf(gradeListing({ ...base, longDescription: 'x'.repeat(4000) }), 'longDescription.length')).toBe('pass');
    expect(statusOf(gradeListing({ ...base, longDescription: 'x'.repeat(4001) }), 'longDescription.length')).toBe('fail');
  });
  it('long description allows line breaks', () => { expect(statusOf(gradeListing({ ...base, longDescription: 'a\nb' }), 'longDescription.chars')).toBeUndefined(); });
  it('developer name 81 fails', () => { expect(statusOf(gradeListing({ ...base, developerName: 'x'.repeat(81) }), 'developerName.length')).toBe('fail'); });
  it('more than 3 prompts fails', () => { expect(statusOf(gradeListing({ ...base, starterPrompts: ['a', 'b', 'c', 'd'] }), 'prompts.count')).toBe('fail'); });
  it('prompt 129 chars fails, 128 ok', () => {
    expect(statusOf(gradeListing({ ...base, starterPrompts: ['x'.repeat(128)] }), 'prompt0.length')).toBe('pass');
    expect(statusOf(gradeListing({ ...base, starterPrompts: ['x'.repeat(129)] }), 'prompt0.length')).toBe('fail');
  });
  it('duplicate prompts after normalisation fail', () => { expect(statusOf(gradeListing({ ...base, starterPrompts: ['Find flights', ' Find   flights'] }), 'prompt1.dup')).toBe('fail'); });
  it('@mention fails', () => { expect(statusOf(gradeListing({ ...base, starterPrompts: ['Ask @acme for invoices'] }), 'prompt0.mention')).toBe('fail'); });
  it('email address is not treated as @mention', () => { expect(statusOf(gradeListing({ ...base, starterPrompts: ['Email bob@acme.example the invoice'] }), 'prompt0.mention')).toBeUndefined(); });
  it('21 capabilities fail; 121-char capability fails', () => {
    expect(statusOf(gradeListing({ ...base, capabilities: Array.from({ length: 21 }, (_, i) => `cap ${i}`) }), 'caps.count')).toBe('fail');
    expect(statusOf(gradeListing({ ...base, capabilities: ['x'.repeat(121)] }), 'cap0.length')).toBe('fail');
  });
  it('missing URL fails for MCP, warns for skills-only', () => {
    expect(statusOf(gradeListing({ ...base, termsUrl: '' }), 'termsUrl')).toBe('fail');
    expect(statusOf(gradeListing({ ...base, submissionType: 'skills', termsUrl: '' }), 'termsUrl')).toBe('warn');
  });
  it('low-contrast light brand colour fails against white', () => { expect(statusOf(gradeListing({ ...base, brandColor: '#FFFF00' }), 'brandColor')).toBe('fail'); });
  it('dark brand colour checked against #212121', () => { expect(statusOf(gradeListing({ ...base, brandColorDark: '#333333' }), 'brandColorDark')).toBe('fail'); });
  it('screenshots: wrong size fails, not allowed without custom UI', () => {
    const r = gradeListing({ ...base, hasCustomUi: true, screenshots: '706x500\n800x500' });
    expect(statusOf(r, 'shot0')).toBe('pass'); expect(statusOf(r, 'shot1')).toBe('fail');
    expect(statusOf(gradeListing({ ...base, screenshots: '706x500\n706x500' }), 'shots.allowed')).toBe('fail');
  });
  it('heuristics are warnings, not failures', () => {
    const r = gradeListing({ ...base, displayName: 'Notes Plugin', subtitle: 'Best notes, free trial' });
    for (const id of ['name.suffix', 'copy.pricing', 'copy.comparison']) expect(statusOf(r, id)).toBe('warn');
    expect(statusOf(gradeListing({ ...base, displayName: 'Notes' }), 'name.generic')).toBe('warn');
  });
  it('a failure caps score at 69', () => { expect(gradeListing({ ...base, displayName: 'x'.repeat(40) }).score).toBeLessThanOrEqual(69); });
  it('formats a copyable report', () => { expect(formatReport(gradeListing(base), 'Acme Ledger')).toMatch(/score \d+\/100/); });
});
