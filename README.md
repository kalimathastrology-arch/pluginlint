# PluginLint

Free, static, browser-only toolkit for developers preparing a ChatGPT plugin directory listing.
Independent; not affiliated with OpenAI.

- `/grader` — listing grader (name, subtitle, description, developer name, category, starter prompts, capabilities, URLs, brand colours, screenshot sizes)
- `/tools/tool-output-privacy-audit` — flags PII, session/trace/request IDs, timestamps, internal IDs, secrets, debug data and upsell text in pasted MCP tool results; checks policy disclosure (heuristic)
- `/tools/test-case-linter` — checks 5 positive + 3 negative test cases against your `tools/list` and outputs a `chatgpt-app-submission.json` validated against OpenAI's public schema
- `/rules` — limits reference + changelog generated from `data/rules-history.json`
- Guides, about, privacy, submit, RSS (`/rss.xml`), sitemap, robots.txt

Everything the user types is processed in the browser. No backend, no cookies, no paid services.

## Data sources (compliant only)

Only OpenAI's public developer docs:
- https://developers.openai.com/plugins/deploy/submission-errors
- https://developers.openai.com/plugins/plugin-guidelines
- https://developers.openai.com/plugins/deploy/app-review (quoted on the auditor page)
- https://developers.openai.com/apps-sdk/schemas/chatgpt-app-submission.v1.json (copy in `src/data/`)

**Never add code that fetches chatgpt.com or the plugin directory.** OpenAI's terms forbid automated extraction from its services. `scripts/watch-docs.mjs` refuses any host other than `developers.openai.com`.

Hand-verified limits live in `src/lib/rules-data.ts` (`LAST_CHECKED`). When the watcher logs a change, re-read the page, update that file and `LAST_CHECKED`, and run the tests.

## Local development

```bash
npm ci
npm test          # vitest: rule functions, grader, auditor, linter, watcher helpers
npm run dev       # http://localhost:4321/pluginlint/
npm run build     # static output in dist/
npm run check     # SEO + link checker over dist/ (titles, descriptions, H1s, canonical, OG, JSON-LD, FAQ visibility, broken links, RSS/sitemap)
npm run watch-docs  # one request to each of the two docs pages; updates data/ if changed
```

Requires Node 20.19+ (Astro 5).

## Deploy to GitHub Pages

1. `gh auth login` (or create the repo in the web UI), then:
   ```bash
   gh repo create pluginlint --public --source . --push
   ```
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main` (or run the *Build and deploy* workflow manually). The site appears at `https://<user>.github.io/pluginlint/`.
4. **Settings → Actions → General → Workflow permissions → Read and write** so the watcher can commit.

### Site URL / base path (one place)

`site.config.mjs` holds `SITE_URL` and `BASE_PATH`. `deploy.yml` sets them automatically to
`https://<owner>.github.io` and `/<repo-name>`. To move to a custom domain later:

1. Add repository variables (Settings → Secrets and variables → Actions → Variables):
   `SITE_URL=https://yourdomain.com` and `BASE_PATH=/`.
2. Add `public/CNAME` containing `yourdomain.com`, set the domain in Settings → Pages, and point DNS at GitHub Pages.

Note: on a project site (`/pluginlint`), `robots.txt` is not at the domain root, so crawlers ignore it; submit the sitemap in Google Search Console instead. With a custom domain it works normally.

## Docs watcher

- `scripts/watch-docs.mjs` — one GET per page per run, User-Agent `PluginLint-docs-watch (contact via site)`, extracts `<main>` text, SHA-256 hash, line-diff summary, snapshots in `data/snapshots/`.
- `.github/workflows/watch-docs.yml` — daily cron (03:17 UTC) + `workflow_dispatch`; commits `data/` when the text changes.
- `deploy.yml` also runs after each successful watcher run (commits made with `GITHUB_TOKEN` don't trigger `push` workflows).

**Keepalive:** GitHub disables scheduled workflows in public repos after 60 days without repository activity. A docs change creates a commit; additionally the watcher makes an empty `chore: monthly keepalive` commit on the 1st of each month. If the schedule is ever disabled, re-enable it under Actions.

## Newsletter (beehiiv)

Set `BEEHIIV_EMBED_URL` in `site.config.mjs` to the iframe `src` from beehiiv (Subscribe forms → Embed). Until set, the home page shows a TODO box and collects nothing. Update `/privacy` wording if you change providers.

## Feedback form

Set `GOOGLE_FORM_URL` in `site.config.mjs`. Until set, `/submit` shows a TODO box.

## Analytics (optional)

Set `ANALYTICS_SCRIPT_URL` to a cookieless analytics script and name the provider on `/privacy`.

## AdSense (later)

See `launch/adsense-checklist.md`. When approved, set `ADSENSE_CLIENT`, add the AdSense script to `src/layouts/Base.astro` (it is intentionally not included yet), add `public/ads.txt`, and update `/privacy` (and a consent banner where required).

## SEO / AEO

See `launch/seo-plan.md`. Titles, descriptions, Open Graph, JSON-LD (WebSite, BreadcrumbList, SoftwareApplication, TechArticle, FAQPage) and `/llms.txt` are generated from `src/lib/` data, so they stay in sync with the rules. Regenerate the social image with `python3 scripts/make-og-image.py`.

## Launch drafts

`launch/` contains drafts only (newsletter, Show HN, forum, Reddit, Product Hunt/Indie Hackers, LinkedIn/X, directory submissions, AdSense checklist, day-by-day status). Nothing has been posted.
