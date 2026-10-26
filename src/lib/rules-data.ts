// Single source of truth for the limits used by the grader, /rules and the guides.
// Every number below was checked by hand against the two OpenAI pages in SOURCES on LAST_CHECKED.

export const LAST_CHECKED = '2026-10-26';

export const SOURCES = {
  submissionErrors: {
    title: 'Plugin submission errors (OpenAI developer docs)',
    url: 'https://developers.openai.com/plugins/deploy/submission-errors',
  },
  guidelines: {
    title: 'Plugin guidelines (OpenAI developer docs)',
    url: 'https://developers.openai.com/plugins/plugin-guidelines',
  },
  appReview: {
    title: 'Remote MCP server review requirements (OpenAI developer docs)',
    url: 'https://developers.openai.com/plugins/deploy/app-review',
  },
  submissionSchema: {
    title: 'chatgpt-app-submission.v1.json (OpenAI public JSON schema)',
    url: 'https://developers.openai.com/apps-sdk/schemas/chatgpt-app-submission.v1.json',
  },
} as const;

export type SourceKey = keyof typeof SOURCES;

export const LIMITS = {
  displayName: 30,
  subtitle: 30, // "short description" in the docs; error names call it subtitle
  longDescription: 4000,
  developerName: 80,
  starterPromptsMax: 3,
  starterPrompt: 128,
  capabilitiesMax: 20,
  capability: 120,
  url: 1024, // final directory submission (package validation allows 2,048)
  brandContrastMin: 2,
  brandLightBackground: '#FFFFFF',
  brandDarkBackground: '#212121',
  screenshotWidth: 706,
  screenshotMinHeight: 400,
  screenshotMaxHeight: 860,
  packageName: 64,
  // package-validation (upload) limits, shown for reference only
  pkgDisplayName: 80,
  pkgShortDescription: 240,
  pkgDeveloperName: 120,
  pkgStarterPrompt: 512,
  pkgUrl: 2048,
} as const;

export const CATEGORIES = [
  'Productivity', 'Creativity', 'Developer Tools', 'Business & Operations', 'Data & Analytics',
  'Communication', 'Education & Research', 'Security', 'Finance', 'Healthcare', 'Travel',
  'Entertainment', 'Other',
] as const;

export interface RuleRow {
  field: string;
  rule: string;
  kind: 'error' | 'guideline';
  source: SourceKey;
  errorCodes?: string[];
}

export const RULES_TABLE: RuleRow[] = [
  { field: 'Display name', rule: 'Required; one line; at most 30 characters; supported text only.', kind: 'error', source: 'submissionErrors', errorCodes: ['submission_display_name_required', 'submission_display_name_too_long', 'submission_display_name_character_unsupported'] },
  { field: 'Short description (subtitle)', rule: 'Required; one line; at most 30 characters; supported text only.', kind: 'error', source: 'submissionErrors', errorCodes: ['submission_subtitle_required', 'submission_subtitle_too_long', 'submission_subtitle_character_unsupported'] },
  { field: 'Long description', rule: 'Required; at most 4,000 characters; line breaks allowed.', kind: 'error', source: 'submissionErrors', errorCodes: ['submission_description_required', 'submission_description_too_long'] },
  { field: 'Developer name', rule: 'Required; one line; at most 80 characters. For ZIP uploads it is set from your verified developer identity.', kind: 'error', source: 'submissionErrors', errorCodes: ['submission_developer_name_too_long', 'developer_name_defaulted'] },
  { field: 'Category', rule: 'Required; one of 13 supported categories (Productivity … Other).', kind: 'error', source: 'submissionErrors', errorCodes: ['plugin_category_unknown'] },
  { field: 'Starter prompts', rule: 'At most 3. Each non-empty, one line, at most 128 characters, unique after Unicode and whitespace normalization, and no MCP server @mention.', kind: 'error', source: 'submissionErrors', errorCodes: ['plugin_default_prompt_too_many', 'plugin_default_prompt_duplicate', 'plugin_default_prompt_mention', 'plugin_default_prompt_too_long'] },
  { field: 'Capabilities', rule: 'At most 20. Each non-empty, one line, at most 120 characters.', kind: 'error', source: 'submissionErrors', errorCodes: ['plugin_capabilities_too_many', 'plugin_capability_invalid'] },
  { field: 'Website / support / privacy / terms URLs', rule: 'HTTPS, host required, no embedded credentials, at most 1,024 characters. Required for remote MCP submissions; optional for skills-only ZIP uploads.', kind: 'error', source: 'submissionErrors', errorCodes: ['plugin_website_url_format', 'plugin_support_url_format', 'plugin_privacy_policy_url_format', 'plugin_terms_of_service_url_format'] },
  { field: 'Brand colors', rule: 'Optional six-digit hex. Light color ≥ 2:1 contrast against white (#FFFFFF); dark color ≥ 2:1 contrast against #212121.', kind: 'error', source: 'submissionErrors', errorCodes: ['plugin_brand_color_format', 'plugin_brand_color_contrast', 'plugin_brand_color_dark_contrast'] },
  { field: 'Screenshots', rule: 'Only when the MCP server provides custom UI. One PNG or JPEG per starter prompt; each exactly 706 px wide and 400–860 px tall.', kind: 'error', source: 'submissionErrors', errorCodes: ['screenshots_not_allowed', 'screenshot_configuration_excluded'] },
  { field: 'Name wording', rule: 'Avoid overly generic names, especially single-word dictionary terms not tied to your brand. Do not append “MCP”, “MCP Server” or “Plugin” to a company or product name.', kind: 'guideline', source: 'guidelines' },
  { field: 'Subtitle & description wording', rule: 'No comparisons with other products, no disparaging alternatives, no unverifiable claims, no pricing, subscriptions, free trials, discounts or promotions.', kind: 'guideline', source: 'guidelines' },
  { field: 'Endorsement', rule: 'Plugins should not imply that they are made or endorsed by OpenAI.', kind: 'guideline', source: 'guidelines' },
];
