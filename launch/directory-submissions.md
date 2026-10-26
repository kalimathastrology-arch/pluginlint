# Directory submissions (DRAFTS, nothing submitted)

## AlternativeTo (needs the user’s account; submit only after approval)

- **Name:** PluginLint
- **Website:** SITE/
- **Short description:** Free in-browser checks for ChatGPT plugin submissions: listing grader, tool-output privacy audit and test-case linter.
- **Description:**
  PluginLint checks a ChatGPT plugin submission against OpenAI’s public developer docs before you submit:
  - The listing grader covers name and subtitle length, starter prompts, capabilities, URLs, brand-colour contrast and screenshot sizes.
  - The tool-output privacy audit flags PII, session/trace IDs, timestamps, secrets and debug data in MCP tool results.
  - The test-case linter builds submission JSON validated against the public schema.
  Everything runs locally in the browser. It’s free, open source, and not affiliated with OpenAI.
- **License / platform:** Free, Open Source (MIT) · Web
- **Tags:** chatgpt, mcp, developer-tools, linter, privacy
- **Possible “alternative to” entries (only if they exist on AlternativeTo):** MCP Inspector, MCPJam Inspector. Don’t claim feature parity; they do different things.

## PR to Asdivyansh/Awesome-ChatGPT-Plugins (DRAFT — do not open without approval)

**Repo check (2026-10-26):**
- Active and not archived.
- Created mid-October 2026; the last commit was a merged community PR (#2) on 2026-10-25 (UTC). 16 stars.
- Has CONTRIBUTING.md and a PR template.

**Contribution rules (from CONTRIBUTING.md):**
- Edit README.md only; don’t touch the generated `catalog/` and `data/`.
- Resources (tools) use the same entry format and link to the canonical source.
- Write a one-line factual description (aim for <100 characters) that ends with a period and doesn’t start with the name.
- No hype words (“best”, “powerful”, “seamless”, “revolutionary”). If the source is public, append ` · [source](repo-url)`.
- Paywalled content and SEO listicles are declined.

**Note:** that repo’s catalog is generated from a browser snapshot of chatgpt.com. PluginLint does not use or link that data; the PR only adds a link.

**Target section:** `### 🧪 Testing & debugging`, appended at the end of the list.

**Diff:**
```markdown
- [PluginLint](SITE/) - Browser-only checks for listings, tool-output privacy, and submission test cases. · [source](https://github.com/USERNAME/pluginlint)
```

**PR title:** Add PluginLint to Testing & debugging

**PR body (follows the template):**
```
## What does this PR add or change?

Adds PluginLint to 🧪 Testing & debugging. It is a free, open-source, client-side tool that checks a plugin submission against OpenAI's public docs: a listing grader, a tool-output privacy audit, and a test-case linter that validates against the public submission schema. Disclosure: I maintain it.

## Checklist

- [x] I read CONTRIBUTING.md
- [x] The plugin is live in the ChatGPT Plugin Directory (or is open source and installable) — n/a: this is a builder resource, open source
- [x] The link points to the official `chatgpt.com/plugins/...` page or source repo — links to the tool and its source repo
- [x] The description is one line, factual, and ends with a period
- [x] I did not edit generated files (`catalog/`, `data/`) by hand
```
