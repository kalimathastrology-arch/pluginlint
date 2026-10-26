# Day-by-day launch status

Legend: ✅ done (on the box, committed locally) · 👤 needs the user · ⏳ later

## Day 1 — Build (2026-10-26)
- ✅ Astro static site: grader, privacy audit, test-case linter, rules + changelog, 6 guides, about/privacy/submit, RSS, sitemap, robots, JSON-LD.
- ✅ 64 unit tests pass; build green on Node 20.
- ✅ Docs watcher run once; baseline history seeded.
- ✅ Workflows: deploy (Pages), daily watcher with monthly keepalive.
- ✅ Launch drafts in `launch/`.
- 👤 **GitHub:** run `gh auth login`, then `gh repo create pluginlint --public --source . --push`. Set Settings → Pages → Source: GitHub Actions, and Actions → Workflow permissions: Read and write. *Nothing has been pushed.*

## Day 2 — Go live
- 👤 Confirm the deploy succeeded, then open the live URL and smoke-test the three tools.
- 👤 Optional domain: buy one, add `public/CNAME`, set repo vars `SITE_URL` and `BASE_PATH=/`. It’s needed for AdSense and makes robots.txt effective.
- 👤 Add the site to Google Search Console and submit the sitemap.
- 👤 Run “Watch OpenAI plugin docs” once via workflow_dispatch to confirm it can commit.

## Day 3 — Capture
- 👤 Create a beehiiv account (free tier), make a subscribe form, and paste its embed URL into `BEEHIIV_EMBED_URL`.
- 👤 Create a Google Form for feedback and paste the link into `GOOGLE_FORM_URL`.
- ✅ Placeholders are already in place, and `/privacy` adjusts automatically once these are set.

## Day 4 — First posts (each needs explicit approval)
- 👤 Approve and post `openai-forum-post.md`.
- 👤 Approve and post the r/mcp draft. Re-read the live rules and rewrite it in your own words.
- 👤 Approve the PR to Awesome-ChatGPT-Plugins (`directory-submissions.md`).

## Day 5 — Show HN / socials
- 👤 Approve and post `show-hn.md` (weekday morning, US time). Be around to answer comments.
- 👤 Approve and post `linkedin-x-posts.md` #1 on each platform.

## Day 6 — Directories
- 👤 Submit the AlternativeTo entry. Approve the Product Hunt launch (schedule it) and the Indie Hackers post.
- 👤 r/ChatGPTPro: optional, one value-first post. Skip r/OpenAI unless the account already participates there.

## Day 7 — Newsletter + review
- 👤 Approve and send `newsletter-issue-1.md` (beehiiv).
- 👤 Review the feedback and fix any rules people reported.
- ⏳ AdSense: apply only after the checklist is met (custom domain, more original guides). See `adsense-checklist.md`.
