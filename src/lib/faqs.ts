// Visible FAQs (rendered on the page by <Faq/>) — the same text feeds FAQPage JSON-LD.
// Every answer restates a rule already on /rules or in a guide; numbers come from LIMITS.
import { LIMITS } from './rules-data';
import type { Faq } from './seo';

const n = (x: number) => x.toLocaleString('en-US');

export const FAQS: Record<string, Faq[]> = {
  home: [
    { q: 'What is the character limit for a ChatGPT plugin name?', a: `The display name must be one line and at most ${LIMITS.displayName} characters for final directory submission. Package (upload) validation accepts up to ${LIMITS.pkgDisplayName}, so a longer name can upload and still fail the final step.` },
    { q: 'How many starter prompts can a ChatGPT plugin listing have?', a: `At most ${LIMITS.starterPromptsMax}. Each must be one line, at most ${LIMITS.starterPrompt} characters, unique after Unicode and whitespace normalization, and must not contain an MCP server @mention.` },
    { q: 'How many test cases does a remote MCP plugin submission need?', a: 'OpenAI’s submission-errors page says a remote MCP plugin needs exactly five positive test cases, three negative test cases, and release notes.' },
    { q: 'Does PluginLint upload what I paste into the tools?', a: 'No. The grader, privacy auditor and test-case linter run entirely in your browser. Nothing you paste is sent, stored or logged.' },
    { q: 'Is PluginLint made by OpenAI?', a: 'No. PluginLint is an independent, free project and is not affiliated with, endorsed by, or sponsored by OpenAI. Its rules come from OpenAI’s public developer documentation.' },
  ],
  'plugin-name-character-limit': [
    { q: 'What is the maximum length of a ChatGPT plugin display name?', a: `${LIMITS.displayName} characters, on one line, at final directory submission.` },
    { q: 'Is the display name the same as the package name?', a: `No. The package name is the machine identifier in the manifest: at most ${LIMITS.packageName} characters, starting with an ASCII letter or digit and using only ASCII letters, digits, _ and -. The display name is what people see in the directory.` },
    { q: 'Why did my ZIP upload pass but final submission reject the name?', a: `Upload validation allows a display name of up to ${LIMITS.pkgDisplayName} characters, but final directory submission only allows ${LIMITS.displayName}. The error is submission_display_name_too_long.` },
    { q: 'Can I add “MCP” or “Plugin” to my plugin’s name?', a: 'The plugin guidelines say not to append “MCP”, “MCP Server” or “Plugin” to a company or product name, and to avoid overly generic names.' },
  ],
  'starter-prompts-rules': [
    { q: 'How many starter prompts can I add?', a: `At most ${LIMITS.starterPromptsMax} for final submission (error code plugin_default_prompt_too_many).` },
    { q: 'How long can a starter prompt be?', a: `At most ${LIMITS.starterPrompt} characters each for final submission. Package validation allows ${LIMITS.pkgStarterPrompt}, but the final limit is the one that counts.` },
    { q: 'Can a starter prompt @mention my MCP server?', a: 'No. Prompts containing an MCP server @mention are rejected with plugin_default_prompt_mention. Write the request the way a user would naturally ask it.' },
  ],
  'submission-errors-explained': [
    { q: 'Do warnings block a ChatGPT plugin submission?', a: 'No. OpenAI’s reference says errors block submission, while warnings don’t block submission but should be reviewed.' },
    { q: 'Why can a package pass upload validation and still fail final submission?', a: 'Final directory submission uses stricter listing limits and also checks MCP configuration, skill scans, test cases and policy attestations.' },
    { q: 'What does “subtitle” mean in the error names?', a: 'In the final metadata error names, subtitle means the short description and description means the long description.' },
    { q: 'How long do skill safety scans take?', a: 'The submission-errors reference says scans can take up to 2 hours.' },
  ],
  'undisclosed-data-types-rejection': [
    { q: 'What causes the “returns user-related data types that are not disclosed” rejection?', a: 'Tool responses that include user-related data your privacy policy doesn’t disclose. OpenAI’s review page names unnecessary PII, session, trace or request IDs, timestamps, internal account IDs, logs and auth secrets as things to remove.' },
    { q: 'Should I just add the fields to my privacy policy?', a: 'Only for fields you truly need. OpenAI’s review page says: if a field isn’t truly needed, remove it rather than disclose it.' },
    { q: 'What must a plugin privacy policy cover?', a: 'At minimum the categories of personal data collected, the purposes of use, the categories of recipients, data retention timelines, and any controls offered to users.' },
  ],
  'mcp-test-cases': [
    { q: 'How many test cases does a ChatGPT plugin submission need?', a: 'A remote MCP plugin needs exactly five positive and three negative test cases, plus release notes. The public submission schema sets minItems of 5 and 3.' },
    { q: 'Which fields does each test case need?', a: 'Per OpenAI’s chatgpt-app-submission.v1.json schema, a positive case requires description, user_prompt and tools_triggered; a negative case requires description and user_prompt.' },
    { q: 'What is a negative test case?', a: 'A prompt where your plugin should not be used, or should decline — usually a near-miss related to your domain but outside what the plugin does.' },
  ],
  'screenshot-size-requirements': [
    { q: 'Are screenshots required for a ChatGPT plugin listing?', a: 'No. Screenshots are only allowed for a remote MCP plugin whose server provides custom UI, and the plugin guidelines say screenshots are no longer shown in the Directory.' },
    { q: 'What size must plugin screenshots be?', a: `PNG or JPEG, exactly ${LIMITS.screenshotWidth} pixels wide and ${LIMITS.screenshotMinHeight}–${LIMITS.screenshotMaxHeight} pixels tall, with one screenshot for every starter prompt.` },
    { q: 'Do logos follow the same size rules as screenshots?', a: `No. Branding images (logo, composer icon) must be square, between 48×48 and ${n(4096)}×${n(4096)} pixels, up to 5 MiB, in PNG, JPEG, WebP or SVG.` },
  ],
  'why-chatgpt-plugin-submissions-get-rejected': [
    { q: 'What are the most common reasons a ChatGPT plugin with an MCP server is rejected?', a: 'OpenAI’s review page lists four: reviewers can’t connect to the MCP server with the URL and test credentials given; one or more test cases don’t produce correct results; tools return user-related data not disclosed in the privacy policy; and tool hint annotations don’t match the tool’s behavior.' },
    { q: 'Is a submission error the same as a rejection?', a: 'No. Submission errors block you in the portal before review starts. A rejection happens after review; OpenAI says you get feedback on which checks were unsuccessful and can fix and resubmit, or appeal by replying to the email.' },
    { q: 'Can I use a demo account that needs 2FA?', a: 'No. The guidelines say plugins that require extra login steps, such as a new account sign-up or 2FA through an inaccessible account, will be rejected, and the review page says credentials must not use MFA.' },
    { q: 'Can I ask OpenAI to expedite a review?', a: 'No. The review page asks developers not to contact support to request expedited review, as these requests cannot be accommodated.' },
  ],
  'mcp-tool-annotations': [
    { q: 'Which annotations does every MCP tool need for a ChatGPT plugin?', a: 'readOnlyHint, destructiveHint and openWorldHint, each set to an explicit boolean (true or false) in the tool’s annotations object. The submission error is annotations_required.' },
    { q: 'Do I still need annotation justifications?', a: 'The sources disagree. The plugin guidelines say annotation justifications are no longer required, while the submission-errors page still lists justification_required. If the portal asks for justifications, provide them.' },
    { q: 'Is a tool that calls an external API automatically open-world?', a: 'No. The guidelines say connectivity alone does not determine openWorldHint; a tool confined to a bounded private account, workspace or catalog may use false even when externally hosted.' },
    { q: 'If an action can be undone, can destructiveHint be false?', a: 'Not on that basis alone. The guidelines say being able to undo an action does not, by itself, justify setting destructiveHint to false.' },
  ],
};
