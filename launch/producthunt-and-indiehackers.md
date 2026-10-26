# Product Hunt + Indie Hackers (DRAFTS, not posted)

> Both need the user’s own account. Don’t ask for upvotes; both communities penalise vote solicitation.

## Product Hunt

- **Name:** PluginLint
- **Tagline (≤60 chars):** Lint your ChatGPT plugin submission before review
- **Topics:** Developer Tools, Artificial Intelligence, Open Source
- **Pricing:** Free
- **Links:** SITE/ · GitHub repo URL (after pushing)
- **Description:**
  Free, browser-only checks against OpenAI’s public plugin submission docs: a listing grader (name, subtitle, prompts, colours, screenshots), a tool-output privacy audit (PII, trace IDs, secrets, debug data) and a test-case linter that outputs schema-validated submission JSON. It also has a rules reference with a daily docs-change log. Independent and not affiliated with OpenAI.
- **Maker comment:**
  Hi PH! The plugin docs list a lot of small mechanical rules, and a missed one costs a review cycle. PluginLint turns them into checks you can run in a few seconds. Nothing you paste leaves your browser. Some checks are heuristics and are labelled that way. The rules page shows where the docs contradict each other. Corrections are very welcome.
- **Gallery:** take 3–5 screenshots of the grader, privacy audit, linter and rules page. Use honest UI captures and no fabricated numbers.

## Indie Hackers (post in a relevant group, e.g. “Developers” / “AI”)

**Title:** Building a zero-cost niche tool site for ChatGPT plugin developers
**Body:**
> I’m building PluginLint, free static tools that check a ChatGPT plugin submission against OpenAI’s public docs. The setup:
> - Astro static site on GitHub Pages, so hosting costs $0.
> - Every tool runs client-side, so there’s no backend and no data handling.
> - A daily GitHub Action re-reads two docs pages (one request each) and commits a changelog. This drives RSS and the newsletter.
> - Plan: a newsletter (beehiiv) first, and AdSense only once there’s enough original content.
> I have no traffic or revenue numbers yet, and will share real ones later. I’d love feedback on what to check next.
