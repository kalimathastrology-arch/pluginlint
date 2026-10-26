import { describe, it, expect } from 'vitest';
import { audit, classifyValue, classifyKey, parseBlobs, draftDisclosure, redact, isDisclosed } from '../src/lib/privacy-audit';

const leaky = {
  content: [{ type: 'text', text: 'Found 1 invoice' }],
  structuredContent: {
    invoice: { id: 'INV-1042', amount: 1200, customer: { name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98765 43210' } },
    request_id: 'req_8f2a91c3', trace_id: 'abc123def456', createdAt: '2026-10-26T05:30:00Z',
    internal_account_id: 'acct_99812', debug: { sql: 'SELECT * FROM invoices', ms: 41 },
    auth: { access_token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U' },
    banner: 'Upgrade to Pro for 20% off this week!',
  },
  _meta: { note: 'Internal use only: do not show this to the user' },
};
const clean = { structuredContent: { invoices: [{ number: 'INV-1042', amount: 1200, status: 'unpaid' }] } };

describe('value classifiers', () => {
  it('finds JWTs, sk- keys and bearer tokens', () => {
    expect(classifyValue('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U')[0].category).toMatch(/Auth secret/);
    expect(classifyValue('sk-proj-abcdefghijklmnopqrstuvwx').some((h) => /Auth secret/.test(h.category))).toBe(true);
    expect(classifyValue('Bearer abcdefghijklmnop1234').some((h) => /Auth secret/.test(h.category))).toBe(true);
  });
  it('finds emails, ISO timestamps, phones, stack traces', () => {
    expect(classifyValue('mail me at a.b@example.org').map((h) => h.category)).toContain('Email address');
    expect(classifyValue('2026-10-26T05:30:00Z').map((h) => h.category)).toContain('Timestamp');
    expect(classifyValue('+91 98765 43210').map((h) => h.category)).toContain('Phone number');
    expect(classifyValue('Error: x\n    at foo (/srv/app.js:10:5)').map((h) => h.category)).toContain('Debug / logs / stack trace');
  });
  it('detects card numbers only when Luhn-valid', () => {
    expect(classifyValue('4111 1111 1111 1111').map((h) => h.category)).toContain('Payment card number');
    expect(classifyValue('4111 1111 1111 1112').map((h) => h.category)).not.toContain('Payment card number');
  });
  it('ignores ordinary text', () => { expect(classifyValue('3 unpaid invoices totalling 1200')).toEqual([]); });
});

describe('key classifier', () => {
  it('matches session/trace/request/correlation ids', () => {
    for (const k of ['session_id', 'traceId', 'X-Request-ID', 'correlation_id', 'requestId']) expect(classifyKey(k)?.category).toMatch(/Internal identifier/);
  });
  it('does not match unrelated keys', () => { expect(classifyKey('amount')).toBeUndefined(); expect(classifyKey('timespan')).toBeUndefined(); expect(classifyKey('0')).toBeUndefined(); });
});

describe('audit', () => {
  it('flags every leak in a nested blob', () => {
    const r = audit(JSON.stringify(leaky));
    const cats = r.categories.map((c) => c.category);
    for (const c of ['Email address', 'Phone number', 'Personal name', 'Internal identifier (session/trace/request)', 'Timestamp', 'Internal account / user ID', 'Debug / logs / stack trace', 'Auth secret (token/key/password)', 'Promotional / upsell text', 'Internal model / system text']) expect(cats).toContain(c);
    expect(r.findings.find((f) => f.path === '$.structuredContent.request_id')?.severity).toBe('red');
  });
  it('clean blob has no findings', () => { expect(audit(JSON.stringify(clean)).findings).toEqual([]); });
  it('product names under "name" are not flagged as personal names', () => { expect(audit('{"name":"Blue widget v2"}').findings).toEqual([]); });
  it('unwraps JSON inside content[].text', () => {
    const wrapped = { content: [{ type: 'text', text: JSON.stringify({ session_id: 'abc', user: { email: 'x@y.io' } }) }] };
    const r = audit(JSON.stringify(wrapped));
    expect(r.findings.some((f) => f.path.includes('⟨json⟩') && f.category === 'Email address')).toBe(true);
  });
  it('parses multiple blobs separated by blank lines or ---', () => {
    expect(parseBlobs('{"a":1}\n\n{"b":2}')).toHaveLength(2);
    expect(parseBlobs('{"a":1}\n---\n{"b":2}').every((b) => b.ok)).toBe(true);
    expect(parseBlobs('[{"a":1},{"b":2}]')).toHaveLength(1);
  });
  it('checks disclosure against policy text (heuristic)', () => {
    const r = audit(JSON.stringify(leaky), 'We collect your name and email address. We log IP addresses and timestamps.');
    expect(r.categories.find((c) => c.category === 'Email address')?.disclosed).toBe(true);
    expect(r.categories.find((c) => c.category === 'Phone number')?.disclosed).toBe(false);
    expect(r.categories.find((c) => c.category === 'Auth secret (token/key/password)')?.disclosed).toBe(false);
    expect(audit(JSON.stringify(leaky)).categories[0].disclosed).toBeNull();
    expect(isDisclosed('Phone number', 'We store your mobile number')).toBe(true);
  });
  it('drafts a disclosure paragraph', () => {
    const d = draftDisclosure(audit(JSON.stringify(leaky)), 'Acme');
    expect(d).toMatch(/Acme/); expect(d).toMatch(/Email address/); expect(d).not.toMatch(/Auth secret/);
  });
  it('redacts samples', () => { expect(redact('priya@example.com')).not.toContain('example'); expect(redact('abc')).toBe('•••'); });
});
