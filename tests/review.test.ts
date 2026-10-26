import { describe, it, expect } from 'vitest';
import { REVIEW_TIERS, REVIEW_FAQS } from '../src/lib/review';
import { llmsTxt } from '../src/lib/llms';
// @ts-expect-error plain JS module
import * as cfg from '../site.config.mjs';

const abs = (p: string) => `https://example.test/pluginlint${p}`;

describe('review service', () => {
  it('has the two published tiers in USD', () => {
    expect(REVIEW_TIERS.map((t) => [t.id, t.price])).toEqual([['starter', 29], ['full', 79]]);
  });
  it('has 3–4 visible FAQs that state no guarantee and no affiliation', () => {
    expect(REVIEW_FAQS.length).toBeGreaterThanOrEqual(3);
    expect(REVIEW_FAQS.length).toBeLessThanOrEqual(4);
    const all = REVIEW_FAQS.map((f) => f.a).join(' ');
    expect(all).toMatch(/cannot promise/);
    expect(all).toMatch(/not affiliated with/);
  });
  it('payment URLs are configurable and empty or https', () => {
    for (const k of ['REVIEW_PAYMENT_URL_STARTER', 'REVIEW_PAYMENT_URL_FULL']) {
      expect(typeof cfg[k]).toBe('string');
      expect(cfg[k] === '' || /^https:\/\//.test(cfg[k])).toBe(true);
    }
  });
  it('is listed in llms.txt and its FAQs in llms-full.txt', () => {
    expect(llmsTxt(abs)).toContain(abs('/review/'));
    expect(llmsTxt(abs, true)).toContain(REVIEW_FAQS[0].q);
  });
});
