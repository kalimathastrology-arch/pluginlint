// Facts for the paid human review on /review/. One source for the page, its JSON-LD, the FAQ and llms.txt.
// Keep this honest: no ratings, counts, testimonials or urgency. Prices are real list prices in USD.
import type { Faq } from './seo';

export const REVIEW_TURNAROUND_HOURS = 24;
export const REVIEW_REFUND_HOURS = 48;

export interface ReviewTier { id: 'starter' | 'full'; name: string; price: number; summary: string; includes: string[] }

export const REVIEW_TIERS: ReviewTier[] = [
  {
    id: 'starter', name: 'Starter', price: 29,
    summary: 'Listing text and test cases.',
    includes: [
      'Listing fields: display name, short and long description, starter prompts, capabilities, category, URLs, brand colours',
      'The five positive and three negative test cases and release notes',
      'Screenshot sizes, if you send screenshots',
      'Written report with likely rejection causes and concrete fixes',
    ],
  },
  {
    id: 'full', name: 'Full', price: 79,
    summary: 'Everything in Starter, plus tools and privacy.',
    includes: [
      'Everything in Starter',
      'Tool list and readOnlyHint / destructiveHint / openWorldHint annotations checked against what each tool does',
      'Privacy review of sample tool output against your privacy policy text',
      'One free re-check after you apply the fixes',
    ],
  },
];

export const REVIEW_FAQS: Faq[] = [
  { q: 'Does a PluginLint review guarantee my plugin will be approved?', a: 'No. Only OpenAI’s reviewers decide. The review checks your materials against OpenAI’s public documentation and points out likely rejection causes, but it cannot promise an outcome.' },
  { q: 'Is the review service connected to OpenAI?', a: 'No. PluginLint is an independent one-person project and is not affiliated with, endorsed by, or sponsored by OpenAI. The rules used come from OpenAI’s public developer docs, as listed on the rules page.' },
  { q: 'How fast do I get the report, and what if it is late?', a: `The written report is due within ${REVIEW_TURNAROUND_HOURS} hours of receiving your payment and materials. If it is not delivered within ${REVIEW_REFUND_HOURS} hours, you get a full refund.` },
  { q: 'Should I send real user data?', a: 'No. Send sample tool output with fake or redacted values. Your materials are used only to write your report and are not published.' },
];
