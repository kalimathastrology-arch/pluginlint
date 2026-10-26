// Test-case linter for remote MCP plugin submissions. Pure functions; runs in the browser.
import schema from '../data/chatgpt-app-submission.v1.schema.json';
import { validate, type SchemaError } from './mini-schema';

export const SCHEMA_URL = 'https://developers.openai.com/plugins/schemas/chatgpt-app-submission.v1.json';
export const SCHEMA_SOURCE = 'https://developers.openai.com/apps-sdk/schemas/chatgpt-app-submission.v1.json';
export const REQUIRED_POSITIVE = 5;
export const REQUIRED_NEGATIVE = 3;

export interface McpTool { name: string; description?: string; annotations?: { readOnlyHint?: boolean; openWorldHint?: boolean; destructiveHint?: boolean; [k: string]: unknown } }
export interface TestCase { description?: string; user_prompt?: string; tools_triggered?: string | null; expected_output?: string | null; expected_output_url?: string | null; file_attachment_urls?: string[] | null; [k: string]: unknown }
export interface Justification { read_only_justification?: string; open_world_justification?: string; destructive_justification?: string }
export interface DraftInput { test_cases?: TestCase[]; negative_test_cases?: TestCase[]; justifications?: Record<string, Justification>; app_info?: Record<string, unknown> }

export type LStatus = 'pass' | 'warn' | 'fail';
export interface LintItem { status: LStatus; where: string; message: string; fix?: string }

/** Accepts a raw JSON-RPC tools/list response, its `result`, a `{tools:[...]}` object or a bare array. */
export function parseToolsList(text: string): McpTool[] {
  const j = JSON.parse(text);
  const arr = Array.isArray(j) ? j : j?.result?.tools ?? j?.tools;
  if (!Array.isArray(arr)) throw new Error('Could not find a tools array (expected tools/list result with "tools": [...]).');
  return arr.filter((t) => t && typeof t.name === 'string');
}

export const splitTools = (s: string | null | undefined): string[] => (s ?? '').split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);

const VAGUE_RE = /^(test|testing|hello|hi|hey|help|try it|do (it|something)|use (the )?(app|plugin|tool)|run|go|demo)[.!?]*$/i;
export function isVaguePrompt(p: string): boolean {
  const t = p.trim();
  if (VAGUE_RE.test(t)) return true;
  return t.split(/\s+/).filter(Boolean).length < 4;
}
export const hasMention = (p: string): boolean => /(^|\s)@[\w-]+/u.test(p);

export function isStateChanging(t: McpTool | undefined): boolean {
  if (!t) return false;
  const a = t.annotations ?? {};
  return a.readOnlyHint !== true || a.destructiveHint === true;
}

export function lint(tools: McpTool[], draft: DraftInput): { items: LintItem[]; output: Record<string, unknown>; schemaErrors: SchemaError[] } {
  const items: LintItem[] = [];
  const byName = new Map(tools.map((t) => [t.name, t]));
  const pos = draft.test_cases ?? [];
  const neg = draft.negative_test_cases ?? [];

  // Counts (docs: "Exactly five positive test cases, three negative test cases"; schema: minItems 5 / 3)
  items.push(pos.length === REQUIRED_POSITIVE ? { status: 'pass', where: 'Positive test cases', message: `${pos.length} positive test cases.` }
    : { status: 'fail', where: 'Positive test cases', message: `${pos.length} positive test cases — exactly ${REQUIRED_POSITIVE} are required.`, fix: pos.length < REQUIRED_POSITIVE ? `Add ${REQUIRED_POSITIVE - pos.length}.` : `Remove ${pos.length - REQUIRED_POSITIVE}.` });
  items.push(neg.length === REQUIRED_NEGATIVE ? { status: 'pass', where: 'Negative test cases', message: `${neg.length} negative test cases.` }
    : { status: 'fail', where: 'Negative test cases', message: `${neg.length} negative test cases — exactly ${REQUIRED_NEGATIVE} are required.`, fix: neg.length < REQUIRED_NEGATIVE ? `Add ${REQUIRED_NEGATIVE - neg.length}.` : `Remove ${neg.length - REQUIRED_NEGATIVE}.` });

  // Tools
  if (!tools.length) items.push({ status: 'fail', where: 'Tools', message: 'No tools found in the tools/list result.', fix: 'Paste the full tools/list response.' });
  for (const t of tools) {
    const a = t.annotations ?? {};
    const missing = (['readOnlyHint', 'openWorldHint', 'destructiveHint'] as const).filter((k) => typeof a[k] !== 'boolean');
    if (missing.length) items.push({ status: 'fail', where: `Tool ${t.name}`, message: `Missing explicit boolean annotation(s): ${missing.join(', ')}.`, fix: 'Set readOnlyHint, openWorldHint and destructiveHint explicitly on the server, deploy, and rescan.' });
    if (a.readOnlyHint === true && a.destructiveHint === true) items.push({ status: 'warn', where: `Tool ${t.name}`, message: 'readOnlyHint is true but destructiveHint is also true — contradictory.', fix: 'Read-only tools should use destructiveHint: false.' });
    if (!t.description || !t.description.trim()) items.push({ status: 'fail', where: `Tool ${t.name}`, message: 'Tool has no description.', fix: 'Add a description that explains purpose, when to use it and side effects.' });
    const j = draft.justifications?.[t.name];
    const jMissing = (['read_only_justification', 'open_world_justification', 'destructive_justification'] as const).filter((k) => !j?.[k] || !String(j[k]).trim());
    if (jMissing.length) items.push({ status: 'warn', where: `Tool ${t.name}`, message: `No ${jMissing.join(', ')}. The import schema requires these fields; the generated file contains “TODO” placeholders.`, fix: 'Write one sentence per annotation explaining why the value matches the tool’s behaviour.' });
  }

  const checkCase = (c: TestCase, i: number, kind: 'positive' | 'negative') => {
    const where = `${kind === 'positive' ? 'Positive' : 'Negative'} case ${i + 1}`;
    const prompt = c.user_prompt ?? '';
    if (!c.description || !String(c.description).trim()) items.push({ status: 'fail', where, message: 'Missing description.', fix: 'Describe what the case tests.' });
    else if (Array.from(String(c.description)).length > 4000 && kind === 'positive') items.push({ status: 'fail', where, message: 'Description over 4,000 characters.', fix: 'Shorten it.' });
    if (!prompt.trim()) items.push({ status: 'fail', where, message: 'Missing user_prompt.', fix: 'Add the exact prompt a reviewer should type.' });
    else {
      if (hasMention(prompt)) items.push({ status: 'warn', where, message: 'Prompt contains an @mention.', fix: 'Write it the way a user would naturally ask, without @names.' });
      if (isVaguePrompt(prompt)) items.push({ status: 'warn', where, message: `Prompt “${prompt}” is vague or very short.`, fix: 'Use a concrete, realistic request with the details needed to get a checkable answer.' });
    }
    const names = splitTools(c.tools_triggered);
    if (kind === 'positive') {
      if (!names.length) items.push({ status: 'fail', where, message: 'Missing tools_triggered.', fix: 'Name the tool(s) this prompt should call.' });
      if (!c.expected_output && !c.expected_output_url) items.push({ status: 'warn', where, message: 'No expected_output or expected_output_url.', fix: 'Describe the exact expected result so reviewers can verify it.' });
    } else if (names.length) {
      items.push({ status: 'warn', where, message: `Negative case lists tools_triggered (${names.join(', ')}). Negative cases usually check that the plugin is NOT used.`, fix: 'Leave tools_triggered empty unless the case intentionally expects a refusal from a tool.' });
    }
    for (const n of names) {
      const t = byName.get(n);
      if (!t) items.push({ status: 'fail', where, message: `tools_triggered names “${n}”, which is not in tools/list.`, fix: `Use one of: ${[...byName.keys()].join(', ') || '(no tools)'}.` });
      else if (kind === 'positive' && isStateChanging(t)) items.push({ status: 'warn', where, message: `Triggers state-changing tool “${n}” (readOnlyHint ≠ true${t.annotations?.destructiveHint ? ', destructive' : ''}).`, fix: 'Make sure the demo account can safely run it repeatedly, and say so in the expected output.' });
    }
    if (prompt.trim() && !items.some((x) => x.where === where && x.status !== 'pass')) items.push({ status: 'pass', where, message: 'OK.' });
  };
  pos.forEach((c, i) => checkCase(c, i, 'positive'));
  neg.forEach((c, i) => checkCase(c, i, 'negative'));

  // Duplicate prompts
  const all = [...pos, ...neg].map((c) => (c.user_prompt ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase()).filter(Boolean);
  if (new Set(all).size !== all.length) items.push({ status: 'warn', where: 'Test cases', message: 'Two or more test cases use the same prompt.', fix: 'Give each case a distinct prompt.' });

  // Build schema-shaped output
  const toolsOut: Record<string, unknown> = {};
  for (const t of tools) {
    const a = t.annotations ?? {};
    const j = draft.justifications?.[t.name] ?? {};
    toolsOut[t.name] = {
      annotations: { readOnlyHint: a.readOnlyHint === true, openWorldHint: a.openWorldHint === true, destructiveHint: a.destructiveHint === true },
      justifications: {
        read_only_justification: j.read_only_justification?.trim() || 'TODO: explain why readOnlyHint matches this tool’s behaviour.',
        open_world_justification: j.open_world_justification?.trim() || 'TODO: explain why openWorldHint matches this tool’s behaviour.',
        destructive_justification: j.destructive_justification?.trim() || 'TODO: explain why destructiveHint matches this tool’s behaviour.',
      },
    };
  }
  const clean = (c: TestCase, positive: boolean) => {
    const o: Record<string, unknown> = { description: c.description ?? '', user_prompt: c.user_prompt ?? '' };
    if (positive) o.tools_triggered = c.tools_triggered ?? '';
    else if (c.tools_triggered) o.tools_triggered = c.tools_triggered;
    for (const k of ['expected_output', 'expected_output_url', 'file_attachment_urls'] as const) if (c[k] !== undefined) o[k] = c[k];
    return o;
  };
  const output: Record<string, unknown> = { $schema: SCHEMA_URL, schema_version: 1 };
  if (draft.app_info) output.app_info = draft.app_info;
  output.tools = toolsOut;
  output.test_cases = pos.map((c) => clean(c, true));
  output.negative_test_cases = neg.map((c) => clean(c, false));
  const schemaErrors = validate(schema as Record<string, unknown>, output);
  items.push(schemaErrors.length ? { status: 'fail', where: 'Generated JSON', message: `${schemaErrors.length} schema error(s): ${schemaErrors.slice(0, 5).map((e) => `${e.path} ${e.message}`).join('; ')}`, fix: 'Fix the items above and regenerate.' }
    : { status: 'pass', where: 'Generated JSON', message: 'Valid against chatgpt-app-submission.v1.json.' });
  return { items, output, schemaErrors };
}
