# Newsletter — Issue #1 (DRAFT, not sent)

> Send from beehiiv only after the account exists and the user approves. Replace `SITE` with the live URL (e.g. `https://USERNAME.github.io/pluginlint`).

**Subject:** Issue #1: the ChatGPT plugin listing limits, in one place
**Preview text:** Free in-browser tools for your listing, tool output and test cases.

---

Hi — this is the first PluginLint issue. PluginLint is a small, free, independent site that checks a ChatGPT plugin submission against OpenAI’s public docs before you hit “Submit”. It is not affiliated with OpenAI.

## What’s live

1. **Listing grader** — SITE/grader/
   Paste your name, subtitle, description, starter prompts, capabilities, URLs, brand colours and screenshot sizes. You get a score and a pass/warn/fail list, each with a fix and a copy button.
2. **Tool-output privacy audit** — SITE/tools/tool-output-privacy-audit/
   Paste real (or redacted) MCP tool results. It flags fields that the app-review guidance says not to return: PII, session/trace/request IDs, timestamps, internal account IDs, auth secrets and debug data. It also checks whether your privacy policy seems to cover what you return, and drafts a disclosure paragraph.
3. **Test-case linter** — SITE/tools/test-case-linter/
   Paste `tools/list` and your 5 positive / 3 negative test cases. You get a `chatgpt-app-submission.json` that is validated against OpenAI’s public schema.

All three run in your browser. Nothing you paste is uploaded.

## Limits worth knowing (from the docs, checked 2026-10-26)

- Display name and subtitle: 30 characters each. Long description: 4,000.
- Up to 3 starter prompts, each up to 128 characters, and they must be distinct after normalisation.
- Up to 20 capabilities, each up to 120 characters.
- Brand colours need at least 2:1 contrast: the light colour against white, the dark colour against #212121.
- Screenshots are 706 px wide and 400–860 px tall, and only apply when the plugin has a custom UI.

The full table, with error codes, is at SITE/rules/.

## Things in the docs that disagree with each other

- One page says “exactly” 5 positive and 3 negative test cases, but the JSON schema only sets minimums.
- Annotation justifications: the guidelines and the schema don’t fully agree. The linter warns and inserts placeholders rather than guessing.

## Change tracking

A script reads the two OpenAI docs pages once a day and logs any text change at SITE/rules/#changelog. There’s also an RSS feed at SITE/rss.xml. Nothing has changed yet, because tracking started on 2026-10-26.

## Also worth a look (not ours)

- reviewtimes.fyi: crowdsourced review wait times.
- mcplane: a CLI that pre-checks MCP servers.
- Plugins Radar: tracks the public directory.

Did we get a rule wrong? Reply to this email or use SITE/submit/.

— PluginLint
