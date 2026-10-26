import { describe, it, expect } from 'vitest';
import { lint, parseToolsList, isVaguePrompt, hasMention, splitTools } from '../src/lib/test-case-linter';
import { validate } from '../src/lib/mini-schema';
import schema from '../src/data/chatgpt-app-submission.v1.schema.json';

const toolsList = JSON.stringify({ jsonrpc: '2.0', id: 1, result: { tools: [
  { name: 'search_invoices', description: 'Search invoices', annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false } },
  { name: 'send_reminder', description: 'Email a payment reminder', annotations: { readOnlyHint: false, openWorldHint: true, destructiveHint: true } },
] } });
const p = (i: number, tool = 'search_invoices') => ({ description: `Case ${i}`, user_prompt: `Show unpaid invoices for customer number ${i} this month`, tools_triggered: tool, expected_output: 'A list of invoices' });
const n = (i: number) => ({ description: `Neg ${i}`, user_prompt: `What is the weather in Pune on day ${i}?` });
const good = { test_cases: [1, 2, 3, 4, 5].map((i) => p(i)), negative_test_cases: [1, 2, 3].map(n),
  justifications: {
    search_invoices: { read_only_justification: 'Only reads.', open_world_justification: 'Private account only.', destructive_justification: 'Nothing changes.' },
    send_reminder: { read_only_justification: 'Sends email.', open_world_justification: 'External recipient.', destructive_justification: 'Emails cannot be unsent.' },
  } };

describe('helpers', () => {
  it('parses tools/list in several shapes', () => {
    expect(parseToolsList(toolsList)).toHaveLength(2);
    expect(parseToolsList('{"tools":[{"name":"a"}]}')).toHaveLength(1);
    expect(parseToolsList('[{"name":"a"}]')).toHaveLength(1);
    expect(() => parseToolsList('{"x":1}')).toThrow();
  });
  it('vague prompts and mentions', () => {
    expect(isVaguePrompt('test')).toBe(true); expect(isVaguePrompt('Show invoices')).toBe(true);
    expect(isVaguePrompt('Show unpaid invoices from last month')).toBe(false);
    expect(hasMention('ask @acme')).toBe(true); expect(hasMention('mail a@b.com')).toBe(false);
  });
  it('splits tools_triggered', () => { expect(splitTools('a, b')).toEqual(['a', 'b']); expect(splitTools(null)).toEqual([]); });
});

describe('lint', () => {
  it('valid draft passes and output validates against the schema', () => {
    const r = lint(parseToolsList(toolsList), good);
    expect(r.items.filter((i) => i.status === 'fail')).toEqual([]);
    expect(r.schemaErrors).toEqual([]);
    expect(validate(schema as any, r.output)).toEqual([]);
  });
  it('requires exactly 5 positive and 3 negative', () => {
    const r = lint(parseToolsList(toolsList), { ...good, test_cases: good.test_cases.slice(0, 4), negative_test_cases: [...good.negative_test_cases, n(4)] });
    expect(r.items.find((i) => i.where === 'Positive test cases')?.status).toBe('fail');
    expect(r.items.find((i) => i.where === 'Negative test cases')?.status).toBe('fail');
    expect(r.schemaErrors.some((e) => /at least 5/.test(e.message))).toBe(true);
  });
  it('flags unknown tools, state-changing tools, vague prompts and @mentions', () => {
    const cases = [p(1, 'nope'), p(2, 'send_reminder'), { ...p(3), user_prompt: 'test' }, { ...p(4), user_prompt: 'Ask @acme for my unpaid invoices please' }, p(5)];
    const r = lint(parseToolsList(toolsList), { ...good, test_cases: cases });
    expect(r.items.some((i) => i.status === 'fail' && /not in tools\/list/.test(i.message))).toBe(true);
    expect(r.items.some((i) => i.status === 'warn' && /state-changing/.test(i.message))).toBe(true);
    expect(r.items.some((i) => /vague/.test(i.message))).toBe(true);
    expect(r.items.some((i) => /@mention/.test(i.message))).toBe(true);
  });
  it('flags missing annotations and fills justification placeholders', () => {
    const r = lint([{ name: 'x', description: 'd' }], { test_cases: [], negative_test_cases: [] });
    expect(r.items.some((i) => /Missing explicit boolean annotation/.test(i.message))).toBe(true);
    expect(JSON.stringify(r.output)).toMatch(/TODO: explain/);
  });
  it('missing required fields fail', () => {
    const r = lint(parseToolsList(toolsList), { ...good, test_cases: [{ description: '', user_prompt: '', tools_triggered: '' }, ...good.test_cases.slice(1)] });
    expect(r.items.filter((i) => i.where === 'Positive case 1' && i.status === 'fail').length).toBeGreaterThanOrEqual(3);
    expect(r.schemaErrors.length).toBeGreaterThan(0);
  });
});
