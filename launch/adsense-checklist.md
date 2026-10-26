# AdSense checklist (for when the site has ~15 substantial pages)

> Based on Google’s help pages read on 2026-10-26: Eligibility requirements (answer 9724), Make sure your site’s pages are ready (7299563), AdSense Program policies (48182, “Last updated: August 4, 2026”), Owning the site (91205), Add a new site (12169212), and EEA/UK/Switzerland consent requirements (13554116). Policies change, so re-read them before applying. Google publishes no minimum page count; “~15 pages” is our own threshold.

Current state: 16 indexable pages (home, grader, rules, tools index, 2 tools, guides index, 6 guides, about, privacy, submit). Several are short or utility pages, so we should add more original guides before applying.

## Before applying
- [ ] **Applicant is 18+** (eligibility).
- [ ] **Use a custom domain.** AdSense site entries are domains, not paths, so `USERNAME.github.io/pluginlint` can’t be added as its own site. `ads.txt` must also sit at the domain root. Buy a domain and add `public/CNAME`, then set the repo vars `SITE_URL` and `BASE_PATH=/` (see README).
- [ ] **Unique, original content.** Google says “Your content must be high-quality, original, and attract an audience”, and ads may not appear on sites with scraped or copyrighted content. Our guides should add our own analysis (doc contradictions, worked examples) and not just restate OpenAI’s pages. Quote briefly and link.
- [ ] **Clear navigation:** nav bar, readable text, working links. (Done.)
- [ ] **Access to the HTML `<head>`:** yes, via `src/layouts/Base.astro`.
- [ ] **Policy pages:** About, Privacy and a contact route (/submit with a Google Form). Make sure the form is live first.
- [ ] **No pages that exist only for ads.** Don’t put ads on thin pages such as 404, /submit or the tools index.

## When adding the code
- [ ] Verify the site via the AdSense code snippet, an `ads.txt` line, or the `google-adsense-account` meta tag. Then click Request review. Google says review usually takes a few days and sometimes 2–4 weeks.
- [ ] Set `ADSENSE_CLIENT` in `site.config.mjs`, add the script to `Base.astro`, and add `public/ads.txt`.
- [ ] Update `/privacy` *before* ads go live: Google and its partners use cookies, plus a link to Google’s policy.
- [ ] **Consent (EEA/UK/Switzerland):** a Google-certified CMP that integrates with IAB TCF is required to serve personalised ads there. The simplest option is Google’s own CMP (Privacy & messaging → European regulations message), which you can choose right after requesting review.

## Ongoing (Program policies)
- [ ] Never click your own ads or ask anyone to. No “support us by clicking” wording, and no arrows pointing at ads.
- [ ] Ads must be clearly distinguishable from the tools. Never put them next to Copy/Download buttons or in places meant for navigation.
- [ ] No floating or pop-up ad placements.
- [ ] No paid-to-click traffic, auto-surf traffic, or unsolicited mass email promotion.
- [ ] Keep ad scripts away from the textareas. Users paste tool output there, and that text must stay local.
