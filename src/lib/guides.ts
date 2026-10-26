// Single list of guides: used by the guides index, home page, "More guides" links and llms.txt.
export interface GuideInfo { slug: string; title: string; short: string; blurb: string }

export const GUIDES: GuideInfo[] = [
  { slug: 'why-chatgpt-plugin-submissions-get-rejected', title: 'Why ChatGPT plugin submissions get rejected: the mechanical causes', short: 'Why submissions get rejected', blurb: 'The four common rejection reasons on OpenAI’s review page, the identity and demo-account rules, and how each maps to a fix.' },
  { slug: 'submission-errors-explained', title: 'ChatGPT plugin submission errors explained', short: 'Submission errors explained', blurb: 'The listing-field error codes from OpenAI’s submission-errors page, grouped and translated into fixes.' },
  { slug: 'mcp-tool-annotations', title: 'MCP tool annotations: readOnlyHint, openWorldHint and destructiveHint explained', short: 'MCP tool annotations', blurb: 'How to set the three required annotation booleans for each tool, with the edge cases OpenAI’s guidelines call out.' },
  { slug: 'mcp-test-cases', title: 'Writing the 5 positive + 3 negative test cases', short: 'Test cases (5 + 3)', blurb: 'Required fields per OpenAI’s submission schema and how to write cases reviewers can verify.' },
  { slug: 'undisclosed-data-types-rejection', title: 'Fixing the “undisclosed data types” rejection (MCP tool output privacy)', short: 'Undisclosed data types', blurb: 'What to remove from tool outputs (session/trace/request IDs, timestamps, internal IDs, logs, secrets) and when to disclose instead.' },
  { slug: 'plugin-name-character-limit', title: 'Plugin name character limit (and naming rules)', short: 'Name character limit', blurb: 'The 30-character display-name limit, the separate 64-character package name, and the naming guidelines reviewers apply.' },
  { slug: 'starter-prompts-rules', title: 'Starter prompt rules', short: 'Starter prompt rules', blurb: 'How many starter prompts you can add, the 128-character limit, uniqueness, @mentions, and how to write good ones.' },
  { slug: 'screenshot-size-requirements', title: 'Screenshot size requirements', short: 'Screenshot sizes', blurb: 'When screenshots are allowed, the 706 px width and 400–860 px height rule, and how to resize.' },
];
