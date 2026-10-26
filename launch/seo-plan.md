# SEO + AEO plan (updated 2026-10-26)

White-hat only: no keyword stuffing, no hidden text, no fake reviews or ratings, no invented numbers. Every fact on the site comes from the OpenAI developer docs listed on /rules (last checked 2026-10-26). PluginLint is independent and not affiliated with OpenAI, and says so on every page.

## What was done (2026-10-26)

**Every page**
- A unique `<title>` (60 characters or fewer) and meta description (155 or fewer), written for what people search, e.g. "ChatGPT plugin submission checklist", "MCP tool output privacy" and "ChatGPT plugin review test cases".
- One H1 per page, headings in order (no skipped levels), `lang="en"`, and a canonical URL with a trailing slash.
- Open Graph and Twitter tags (`summary_large_image`) with a 1200×630 image at `public/og.png` (made by `scripts/make-og-image.py`).
- A visible breadcrumb on inner pages, matched by `BreadcrumbList` JSON-LD.
- `WebSite` and `Organization` JSON-LD on every page.
- The 404 page is `noindex` and kept out of the sitemap.
- JSON-LD escapes `<` so a `</script>` can't break out of it.

**Structured data**
- Grader, test-case linter and privacy auditor (plus the /tools index): `SoftwareApplication` with a free offer (price 0).
- Guides: `TechArticle`. `datePublished` and `dateModified` come from real git commit dates; CI now checks out with `fetch-depth: 0` so those dates are right.
- Home and all 8 guides: a visible FAQ (3–5 Q&As restating the verified rules) marked up as `FAQPage`. The same text feeds both the page and the JSON-LD (`src/lib/faqs.ts`), and the checker fails the build if any FAQ text isn't visible on the page.
- Guides index: `ItemList`.

**AEO**
- Each guide opens with an answer-first "In short: …" paragraph. The home page has one too.
- The home page has a new, sourced "ChatGPT plugin submission checklist" section.
- `/llms.txt` and `/llms-full.txt` (the full version adds every rule and FAQ). They are generated from `rules-data.ts`, so they can't drift from the pages.
- `robots.txt` allows `*` plus named groups for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended and CCBot, and lists the sitemap.
- Each sitemap entry gets a `lastmod` from the last git commit that touched that page or the rules/FAQ data it shows.

**Technical**
- CSS is inlined and the only scripts are deferred module scripts on the tool pages. Nothing is preloaded; the newsletter iframe is `loading="lazy"`.
- RSS now has `atom:link rel=self` and `language`. RSS and sitemap XML parse cleanly.
- `scripts/check-dist.mjs` (`npm run check`, also run in CI after the build) checks for:
  - broken internal links and internal links without a trailing slash;
  - title and description length and uniqueness;
  - H1 count and heading order;
  - canonical, OG and Twitter tags;
  - `img` alt text and `iframe` titles;
  - JSON-LD that doesn't parse, and FAQ text that isn't visible;
  - RSS and sitemap problems;
  - any domain listed in the `BANNED_DOMAINS` env var.
- New tests in `tests/seo.test.ts`.

**New guides** (both based only on the OpenAI pages already cited in the repo)
- `/guides/why-chatgpt-plugin-submissions-get-rejected/`: the four common rejection reasons on the review page, plus the other documented causes (unverified publisher name, demo accounts with MFA, unclear tool descriptions, trial/demo plugins, iframes).
- `/guides/mcp-tool-annotations/`: readOnlyHint, destructiveHint and openWorldHint, the edge cases, and the disagreement between the docs over justifications.

**Internal links:** every guide links to all the others ("More guides") and to the three tools. /rules links to the guides, and the guides link to each other in context.

## Known limitation: robots.txt and llms.txt live under /pluginlint/

Crawlers only read `robots.txt` at the host root, `https://kalimathastrology-arch.github.io/robots.txt`. That URL returns 404 today, which crawlers treat as "allow everything", so nothing is blocked. But the sitemap line in `/pluginlint/robots.txt` won't be discovered that way, so submit the sitemap by hand in Search Console and Bing (below). The same goes for `/llms.txt`: tools that look at the host root won't find it. Both problems go away with a custom domain (or with a `kalimathastrology-arch.github.io` user-site repo serving a root robots.txt, but a custom domain is the better fix).

## Needs your accounts (in priority order)

1. **Google Search Console** (free, Google account). Add a **URL-prefix** property for `https://kalimathastrology-arch.github.io/pluginlint/`. A domain property isn't possible on github.io. Choose the **HTML tag** method and copy the token. Then:
   - **Where the token goes:** `src/layouts/Base.astro`, inside `<head>`, on the line right after `<meta name="theme-color" … />`. There is a comment marking the spot: `Search Console: when Google gives an HTML-tag token…`. Add `<meta name="google-site-verification" content="TOKEN" />`, then commit and push. The deploy takes about 40 seconds; then click Verify.
   - Alternatively, use the HTML-file method: put `googleXXXX.html` in `public/`. It's served at `/pluginlint/googleXXXX.html`, which works for a URL-prefix property.
   - Submit the sitemap `https://kalimathastrology-arch.github.io/pluginlint/sitemap-index.xml`, then use URL Inspection → Request indexing for the home page and the 2 new guides.
2. **Bing Webmaster Tools** (free, Microsoft account). Use "Import from Google Search Console" once step 1 is verified. Submit the same sitemap. It's a second major search index and takes about 5 minutes once Google is verified.
3. **IndexNow** (optional, free). Once Bing is verified, a key file in `public/` lets you ping new URLs. Skip it until there's a regular publishing rhythm.
4. **Custom domain (later, about $10–15 a year; the only paid item, so your call).** Set repo variables `SITE_URL=https://yourdomain` and `BASE_PATH=/`, add a `public/CNAME` file, and point DNS at GitHub Pages. Re-verify Search Console as a Domain property and add a "change of address" if needed. That puts robots.txt and llms.txt at the root.
5. After 2–4 weeks, check Search Console → Performance for the queries you actually rank for, and adjust titles and descriptions to match. Don't add pages that just repeat existing ones.

## Free backlink / citation opportunities (legitimate; nothing submitted yet)

Always disclose "I maintain PluginLint". Only post where it genuinely answers the question, and follow each venue's rules.

| Venue | What to add | Account needed? | Status |
|---|---|---|---|
| GitHub repo itself | Description, homepage URL and topics (`chatgpt`, `mcp`, `openai-apps-sdk`, `developer-tools`, `linter`) | Already have (GitHub) | Repo exists; check that topics and homepage are set |
| [punkpeye/awesome-mcp-devtools](https://github.com/punkpeye/awesome-mcp-devtools) (about 490 stars, active) | One line under "Testing Tools" (test-case linter, privacy audit of MCP tool output) | GitHub, via PR | Not done; follow its CONTRIBUTING |
| Asdivyansh/Awesome-ChatGPT-Plugins | Already PR #3 | GitHub | Open, waiting for the owner |
| [modelcontextprotocol discussions](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions) | Only to answer a relevant question (annotations, testing) | GitHub | Not done |
| OpenAI Developer Community (community.openai.com) | Answer threads about plugin rejections and annotations, with a link to the matching guide | Forum account | Launch post waiting for moderation; replies not done |
| Stack Overflow | Answer real questions about ChatGPT plugin and MCP submission limits; link only when relevant | SO account | Not done |
| dev.to / Hashnode | Cross-post the two new guides with `canonical_url` pointing to the PluginLint page | dev.to / Hashnode account | Not done |
| Hacker News (Show HN) | Draft in `launch/show-hn.md` | HN account | Planned |
| Product Hunt, Indie Hackers | Drafts in `launch/producthunt-and-indiehackers.md` | Accounts | Planned |
| DevHunt (devhunt.org): developer-tool launch site | Listing | GitHub login | Not done |
| AlternativeTo | Already submitted | Account | In review |
| SaaSHub | Free listing (open-source developer tool) | Account | Not done |
| Reddit r/mcp, r/ChatGPTCoding | Showcase post once the account has genuine history | Reddit account | The earlier r/mcp post was auto-removed; wait |
| beehiiv newsletter | Link the new guides in issue 1 | Have | Planned |

Don't use paid link schemes, link exchanges, PBNs, comment spam, mass directory blasts, or "AI tool" directories that need a backlink or fee in return.

## Re-run checks

```
npm test && npm run build && npm run check
```
