# LinkedIn + X posts (DRAFTS, not posted)

> Post from the user’s own accounts after approval. Replace SITE.

## LinkedIn

1. If you’re submitting a ChatGPT plugin, many rejections come from small mechanical rules: names and subtitles of 30 characters or less, distinct starter prompts, brand-colour contrast and test-case counts. I put them into a free in-browser checker: SITE/grader/ (independent, not affiliated with OpenAI)

2. OpenAI’s app review says MCP tool results shouldn’t include trace or session IDs, timestamps, internal IDs or debug data, and your privacy policy must disclose what you return. I built a free tool that audits pasted tool output for this, locally in your browser: SITE/tools/tool-output-privacy-audit/

3. Plugin submissions need 5 positive and 3 negative test cases plus tool annotations. This free linter checks them against your tools/list and outputs submission JSON validated against OpenAI’s public schema: SITE/tools/test-case-linter/

## X

1. ChatGPT plugin submission checklist in one page: 30-char name/subtitle, ≤3 distinct prompts, 2:1 colour contrast (dark vs #212121), 706px screenshots. Free browser grader → SITE/grader/

2. Your MCP tool output can get your ChatGPT app rejected: trace IDs, timestamps, internal IDs, debug fields. Paste it here and nothing is uploaded → SITE/tools/tool-output-privacy-audit/

3. 5 positive + 3 negative test cases, annotations and justifications, validated against OpenAI’s public schema. Free linter → SITE/tools/test-case-linter/
