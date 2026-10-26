# Show HN (DRAFT, not posted)

> Post only after user approval, from the user’s own HN account. HN guidelines: Show HN is for things people can try. Don’t ask for upvotes, and don’t have friends upvote or comment.

**Title (≤80 chars):**
Show HN: PluginLint – open-source linter for ChatGPT app submissions

**URL:** SITE/

**First comment (by the author):**

PluginLint is an MIT-licensed, client-side linter for ChatGPT app/plugin directory submissions. Source: https://github.com/kalimathastrology-arch/pluginlint . I built it after reading OpenAI’s plugin submission-errors page. Many rejections come down to mechanical rules: name and subtitle length, duplicate starter prompts, brand-colour contrast, screenshot sizes, missing tool annotations, and test-case counts.

It is a static Astro site with three tools that run entirely client-side:

- A listing grader that scores your listing and gives a pass/warn/fail list with fixes.
- A tool-output privacy audit. You paste MCP tool results and it flags PII, trace/session IDs, timestamps, secrets and debug fields, then checks your policy text covers what you return.
- A test-case linter that builds a chatgpt-app-submission.json and validates it against OpenAI’s public JSON schema.

Notes:
- Rules come only from public developers.openai.com pages. A GitHub Action fetches the two rules pages once a day (one request each, with an identifying User-Agent) and publishes a diff changelog and RSS feed. It does not scrape chatgpt.com.
- Some checks are heuristics (generic names, pricing or comparison wording, the “invisible characters” list, policy coverage). They are labelled as such.
- The docs contradict themselves in a couple of places, such as “exactly” vs the schema’s minimums for test cases. The /rules page lists these.
- It isn’t affiliated with OpenAI, and passing does not mean approval.

It’s free, with no accounts. The code is MIT-licensed. I’d love corrections where I’ve misread a rule.
