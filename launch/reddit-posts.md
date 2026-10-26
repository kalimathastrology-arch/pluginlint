# Reddit drafts (NOT posted)

> **Rules check status:** on 2026-10-26 the box tried to fetch each subreddit’s rules page once, via `reddit.com/r/<sub>/about/rules.json`. Reddit returned “blocked by network security” for all three, and the old.reddit and browser fallbacks were blocked too. The rule summaries below come from third-party mirrors of the public rules found via web search (threadfox.vip, subriff.com, spacestationlabs.ai, threadotter.com). **The user must re-read each live sidebar before posting.**
> General: post from the user’s own account with real history, disclose that you built it, use text posts, don’t crosspost the same text, and space the posts out by days. r/mcp in particular asks for no AI-generated promotional content, so rewrite these drafts in your own words.

---

## r/OpenAI — RECOMMENDED: SKIP for now (unless the account already participates there)

**Self-promotion rules (Rule 3, “Limit Self-Promotion”, per mirrors):** use the 1/10th guideline, so self-promotion should be no more than 10% of your content there. Direct link posts to your own project are not allowed. Promotion must be a text post with context about the project’s value. “We want participation first for you to advertise.” Rule 4 forbids selling. Rule 6 removes titles that contain a link address.
**Why skip:** a new or low-activity account doing a launch post is exactly what Rule 3 targets. Build participation first, or just answer relevant questions and mention the tool with a disclosure.

**If posting later (text post):**
Title: I compiled the ChatGPT plugin submission rules into a free checker — here’s what tripped me up
Body:
> Disclosure: I made this. It’s free, has no account, isn’t affiliated with OpenAI, and runs in the browser.
> While reading OpenAI’s plugin submission docs, I noted the mechanical rejection causes: the 30-character name and subtitle, 3 distinct starter prompts of 128 characters max, brand-colour contrast against white and #212121, 706px-wide screenshots, missing tool annotations, and exactly 5 positive and 3 negative test cases. I made a grader, a tool-output privacy audit and a test-case linter: SITE/
> Questions welcome. Corrections are even more welcome.

---

## r/ChatGPTPro — RECOMMENDED: LOW PRIORITY / OPTIONAL (post only one value-first write-up)

**Self-promotion rules (per mirrors):**
- Rule 3: selling products or services is prohibited, but self-promotion is allowed “as long as it is not excessive” and follows Reddit’s self-promotion policy.
- Rule 2: posts must be high-quality and original; crossposts and duplicates are removed, and the mods suggest discussing a post with them first if in doubt.
- Sidebar: a tool must offer something ChatGPT can’t do itself.
- A karma threshold applies to new accounts (the number isn’t published).

**Title:** What I learned reading every rule in OpenAI’s plugin submission docs (plus a free checker)
**Body:**
> Disclosure: I built the checker mentioned below. It’s free, has no account, and is not affiliated with OpenAI.
> Five things that cause avoidable rejections:
> 1) The dark brand colour is checked against #212121, not black.
> 2) Starter prompts must be distinct after normalisation, with no @mentions.
> 3) Test cases: the page says exactly 5 positive and 3 negative, while the schema only sets minimums.
> 4) Tool results shouldn’t include trace/session IDs, timestamps or internal IDs, and your privacy policy must disclose what you return.
> 5) Screenshots only matter if you have a custom UI.
> The tools are a grader, a privacy audit and a test-case linter, all browser-only: SITE/

---

## r/mcp — RECOMMENDED: POST (best fit), with the Showcase flair

**Self-promotion rules (per mirrors):**
- Self-promotion is allowed if you clearly disclose your affiliation; pretending to be an unaffiliated user is banned.
- Use the “showcase” flair for things you built.
- Share only launched work, not waitlists.
- No AI-generated promotional content, so write the final post yourself.

**Title:** Free browser tool: audit your MCP tool output for data ChatGPT app review rejects
**Body:**
> I built this (free, open source, not affiliated with OpenAI).
> OpenAI’s app-review guidance says MCP tool results shouldn’t include data the user didn’t ask for: internal IDs, session/trace/request IDs, timestamps, auth secrets and debug info. Your privacy policy also has to disclose what is returned.
> Paste your tool results into SITE/tools/tool-output-privacy-audit/ and it walks the JSON, including JSON nested inside strings. It flags those fields with a path and suggested fix, checks your policy text for coverage, and drafts a disclosure. It runs entirely client-side.
> There’s also a test-case linter. It takes your `tools/list` output plus 5 positive and 3 negative cases, checks the readOnly/openWorld/destructive annotations, and validates the generated submission JSON against the public schema: SITE/tools/test-case-linter/
> The heuristics are imperfect, so false-positive reports are welcome.
