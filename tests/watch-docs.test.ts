import { describe, it, expect } from 'vitest';
// @ts-expect-error plain ESM script without types
import { extractText, diffSummary, sha256, PAGES } from '../scripts/watch-docs.mjs';

describe('watch-docs helpers', () => {
  it('only watches the two OpenAI docs pages', () => {
    expect(PAGES.map((p: { url: string }) => p.url)).toEqual([
      'https://developers.openai.com/plugins/deploy/submission-errors',
      'https://developers.openai.com/plugins/plugin-guidelines',
    ]);
  });
  it('extracts main text and drops scripts/nav', () => {
    const html = '<html><nav>menu</nav><main><h1>Title</h1><script>x()</script><p>Display name &amp; 30&nbsp;chars</p></main></html>';
    expect(extractText(html)).toBe('Title\nDisplay name & 30 chars');
  });
  it('summarises changed lines and numbers', () => {
    const d = diffSummary('a\nlimit 30\nc', 'a\nlimit 40\nc');
    expect(d.addedCount).toBe(1); expect(d.removedCount).toBe(1);
    expect(d.numbersAdded).toEqual(['40']); expect(d.numbersRemoved).toEqual(['30']);
  });
  it('hashes deterministically', () => { expect(sha256('x')).toBe(sha256('x')); });
});
