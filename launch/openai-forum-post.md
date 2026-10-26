# OpenAI Developer Community post (DRAFT, not posted)

> Target: community.openai.com, the category for Apps SDK / plugins (check which category fits; community guidelines discourage pure promotion, so lead with the doc findings). Post only with user approval.

**Title:** Pre-submission checklist + free in-browser linter for plugin listings, tool output and test cases

Hi all,

I’ve been going through the plugin submission docs and made notes on the mechanical rules that cause rejections. I turned them into a free, independent tool (not affiliated with OpenAI): SITE/

Some things I noticed in the docs that might save someone a rejection:

1. **Brand colour contrast:** the light colour is checked against white, and the dark colour against **#212121**, not black. The minimum ratio is 2:1.
2. **Starter prompts:** at most 3, each up to 128 characters, and they must be distinct after Unicode/whitespace normalisation. @mentions aren’t allowed.
3. **Screenshots:** 706 px wide and 400–860 px tall, but only relevant if the plugin has a custom UI.
4. **Test cases:** the submission page says 5 positive and 3 negative, while the JSON schema enforces them as *minimums*. I treat it as exactly 5 and 3 to be safe.
5. **Tool output:** the app-review page says not to return data the user didn’t ask for, such as internal IDs, session/trace/request IDs, timestamps, auth secrets and debug info. It also says your privacy policy must disclose what is returned.

The tools:
- Listing grader: SITE/grader/
- Tool-output privacy audit: SITE/tools/tool-output-privacy-audit/
- Test-case linter (validates against the public submission schema): SITE/tools/test-case-linter/

Everything runs in the browser and nothing is uploaded. Some checks are heuristics and are labelled that way. If anyone from the team or community can confirm how characters are counted (code points vs UTF-16 units), or which invisible characters count as “unsupported”, I’ll update the tool.
