// Builds /llms.txt and /llms-full.txt (https://llmstxt.org format) from the same data the pages use.
import { LIMITS, CATEGORIES, LAST_CHECKED, SOURCES, RULES_TABLE } from './rules-data';
import { GUIDES } from './guides';
import { FAQS } from './faqs';

const n = (x: number) => x.toLocaleString('en-US');

export function llmsTxt(abs: (path: string) => string, full = false): string {
  const L: string[] = [];
  L.push('# PluginLint', '');
  L.push('> Free, private, browser-only tools and sourced guides for preparing a ChatGPT plugin directory submission (OpenAI’s universal plugin directory shared by ChatGPT and Codex). Independent project; not affiliated with, endorsed by, or sponsored by OpenAI.', '');
  L.push(`All rules on this site come from OpenAI’s public developer documentation and were last checked by hand on ${LAST_CHECKED}. Limits can change; the OpenAI pages are the source of truth. Nothing pasted into the tools leaves the user’s browser.`, '');
  L.push('## Verified final-submission limits', '');
  L.push(
    `- Display name: required, one line, at most ${LIMITS.displayName} characters (package/upload validation allows ${LIMITS.pkgDisplayName}).`,
    `- Short description (subtitle): required, one line, at most ${LIMITS.subtitle} characters (upload validation allows ${LIMITS.pkgShortDescription}).`,
    `- Long description: required, at most ${n(LIMITS.longDescription)} characters; line breaks allowed.`,
    `- Developer name: required, one line, at most ${LIMITS.developerName} characters (upload validation allows ${LIMITS.pkgDeveloperName}).`,
    `- Package name: at most ${LIMITS.packageName} characters; starts with an ASCII letter or digit; only ASCII letters, digits, _ and -.`,
    `- Category: one of ${CATEGORIES.length}: ${CATEGORIES.join(', ')}.`,
    `- Starter prompts: at most ${LIMITS.starterPromptsMax}; each non-empty, one line, at most ${LIMITS.starterPrompt} characters (upload validation allows ${LIMITS.pkgStarterPrompt}), unique after Unicode and whitespace normalization, no MCP server @mention.`,
    `- Capabilities: at most ${LIMITS.capabilitiesMax}; each non-empty, one line, at most ${LIMITS.capability} characters.`,
    `- Website, support, privacy policy and terms URLs: HTTPS, at most ${n(LIMITS.url)} characters (upload validation allows ${n(LIMITS.pkgUrl)}); required for remote MCP submissions, optional for skills-only ZIP uploads.`,
    `- Brand colors: optional six-digit hex; light color at least ${LIMITS.brandContrastMin}:1 contrast against ${LIMITS.brandLightBackground}, dark color at least ${LIMITS.brandContrastMin}:1 against ${LIMITS.brandDarkBackground}.`,
    `- Screenshots: only when the remote MCP server provides custom UI; one PNG or JPEG per starter prompt; exactly ${LIMITS.screenshotWidth} px wide and ${LIMITS.screenshotMinHeight}–${LIMITS.screenshotMaxHeight} px tall.`,
    '- Remote MCP plugins also need: exactly five positive and three negative test cases plus release notes; a demo-recording URL; a production HTTPS MCP server URL with domain verification and a current tool scan; explicit readOnlyHint, openWorldHint and destructiveHint on every tool; reviewer-ready demo credentials when the server uses OAuth.',
    '- Every submission needs passing safety and security scans for bundled skills (up to 2 hours) and a verified developer or business identity with policy attestations.',
    '',
  );
  L.push('## Tools', '');
  L.push(
    `- [Listing grader](${abs('/grader/')}): checks listing fields against the limits above; runs in the browser.`,
    `- [Tool-output privacy auditor](${abs('/tools/tool-output-privacy-audit/')}): flags PII, session/trace/request IDs, timestamps, internal IDs, secrets and upsell text in MCP tool output.`,
    `- [Test-case linter](${abs('/tools/test-case-linter/')}): checks the 5 positive + 3 negative test cases and tool annotations, outputs a schema-valid chatgpt-app-submission.json.`,
    `- [Rules and limits reference](${abs('/rules/')}): every limit with its OpenAI source and a changelog of the source pages.`,
    '',
  );
  L.push('## Guides', '');
  for (const g of GUIDES) L.push(`- [${g.title}](${abs(`/guides/${g.slug}/`)}): ${g.blurb}`);
  L.push('');
  L.push('## Sources (OpenAI developer docs)', '');
  for (const s of Object.values(SOURCES)) L.push(`- [${s.title}](${s.url})`);
  L.push('');
  if (full) {
    L.push('## All rules (from /rules)', '');
    for (const r of RULES_TABLE) L.push(`- ${r.field} (${r.kind === 'error' ? 'blocks submission' : 'review guideline'}): ${r.rule}${r.errorCodes ? ` Error codes: ${r.errorCodes.join(', ')}.` : ''}`);
    L.push('');
    L.push('## Frequently asked questions', '');
    const seen = new Set<string>();
    for (const list of Object.values(FAQS)) for (const f of list) {
      if (seen.has(f.q)) continue; seen.add(f.q);
      L.push(`### ${f.q}`, '', f.a, '');
    }
  }
  L.push('## Optional', '');
  L.push(
    `- [About PluginLint](${abs('/about/')}): who runs it, how rules are sourced, independence from OpenAI.`,
    `- [Privacy](${abs('/privacy/')})`,
    `- [Rules changes RSS feed](${abs('/rss.xml')})`,
    full ? `- [Short version](${abs('/llms.txt')})` : `- [Full version with all rules and FAQs](${abs('/llms-full.txt')})`,
  );
  return L.join('\n') + '\n';
}

export const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot'];

export function robotsTxt(sitemapUrl: string): string {
  return [
    '# PluginLint welcomes search engines and AI assistants; please cite pages you use.',
    'User-agent: *',
    'Allow: /',
    '',
    ...AI_CRAWLERS.flatMap((ua) => [`User-agent: ${ua}`, 'Allow: /', '']),
    `Sitemap: ${sitemapUrl}`,
    '',
  ].join('\n');
}
