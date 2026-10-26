// Tool-Output Privacy Auditor — pure functions, runs in the browser. Nothing is sent anywhere.
// Heuristic: flags fields by key name and value pattern; it cannot know your intent.

export type Severity = 'red' | 'amber';
export type Category =
  | 'Email address' | 'Phone number' | 'Personal name' | 'Postal address' | 'Location / coordinates'
  | 'Internal identifier (session/trace/request)' | 'Internal account / user ID' | 'Timestamp'
  | 'Auth secret (token/key/password)' | 'Debug / logs / stack trace' | 'Promotional / upsell text'
  | 'Internal model / system text' | 'IP address' | 'Payment card number' | 'Date of birth' | 'Government ID';

export interface Finding {
  blob: number;
  path: string;
  key: string;
  category: Category;
  severity: Severity;
  reason: string;
  sample: string;
  action: 'Remove' | 'Remove or disclose';
  disclosed?: boolean | null; // null = no policy text supplied
}

const MAX_SAMPLE = 60;
export function redact(v: string): string {
  const s = v.length > MAX_SAMPLE ? v.slice(0, MAX_SAMPLE) + '…' : v;
  if (s.length <= 8) return s.replace(/./g, '•');
  return s.slice(0, 4) + '•'.repeat(Math.min(s.length - 6, 20)) + s.slice(-2);
}

// ---- key-name rules (checked against the last path segment, case-insensitive, separators ignored) ----
const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
interface KeyRule { re: RegExp; category: Category; severity: Severity; action: Finding['action'] }
const KEY_RULES: KeyRule[] = [
  { re: /^(password|passwd|pwd|secret|clientsecret|apikey|apisecret|accesstoken|refreshtoken|idtoken|token|authtoken|bearer|authorization|privatekey|sessiontoken|cookie|setcookie)$/, category: 'Auth secret (token/key/password)', severity: 'red', action: 'Remove' },
  { re: /^(session|trace|request|correlation|span|req|traceparent|tracestate|xrequestid|xamzntraceid)(id|uuid|key)?$|(session|trace|request|correlation)id$/, category: 'Internal identifier (session/trace/request)', severity: 'red', action: 'Remove' },
  { re: /^(stack|stacktrace|traceback|debug|debuginfo|exception|errorstack|logs?|logmessages|internalerror|diagnostics|telemetry)$/, category: 'Debug / logs / stack trace', severity: 'red', action: 'Remove' },
  { re: /^(systemprompt|systemmessage|prompttemplate|internalnote|internalnotes|modelinstructions|instructionsformodel|developermessage|hiddenprompt)$/, category: 'Internal model / system text', severity: 'red', action: 'Remove' },
  { re: /^(internal(account|user|customer|tenant|org)?id|accountid|userid|customerid|tenantid|orgid|organizationid|uid|ownerid|createdby|updatedby)$/, category: 'Internal account / user ID', severity: 'amber', action: 'Remove or disclose' },
  { re: /^(createdat|updatedat|modifiedat|timestamp|ts|servertime|generatedat|lastlogin|lastloginat|lastseen|processedat|fetchedat|requestedat)$/, category: 'Timestamp', severity: 'amber', action: 'Remove or disclose' },
  { re: /(email|emailaddress)$|^mail$/, category: 'Email address', severity: 'amber', action: 'Remove or disclose' },
  { re: /(phone|mobile|telephone|tel|phonenumber|msisdn)$/, category: 'Phone number', severity: 'amber', action: 'Remove or disclose' },
  { re: /^(name|fullname|firstname|lastname|givenname|familyname|surname|displayname|username|customername|contactname|ownername|assignee)$/, category: 'Personal name', severity: 'amber', action: 'Remove or disclose' },
  { re: /^(address|streetaddress|street|addressline1|addressline2|postalcode|zip|zipcode|pincode|homeaddress|billingaddress|shippingaddress)$/, category: 'Postal address', severity: 'amber', action: 'Remove or disclose' },
  { re: /^(lat|lng|lon|latitude|longitude|geo|coordinates|gps|location)$/, category: 'Location / coordinates', severity: 'amber', action: 'Remove or disclose' },
  { re: /^(ip|ipaddress|clientip|remoteaddr|xforwardedfor)$/, category: 'IP address', severity: 'red', action: 'Remove' },
  { re: /^(dob|dateofbirth|birthdate|birthday)$/, category: 'Date of birth', severity: 'amber', action: 'Remove or disclose' },
  { re: /^(ssn|socialsecuritynumber|aadhaar|aadhar|pan|pannumber|passport|passportnumber|nationalid|taxid)$/, category: 'Government ID', severity: 'red', action: 'Remove' },
  { re: /^(cardnumber|ccnumber|creditcard|pan_number|cvv|cvc)$/, category: 'Payment card number', severity: 'red', action: 'Remove' },
  { re: /^(upsell|promo|promotion|upgrade|upgradeurl|upgrademessage|cta|marketing|ad|advert|advertisement|offer)$/, category: 'Promotional / upsell text', severity: 'amber', action: 'Remove' },
];

// ---- value-pattern rules ----
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)\d{3,4}[\s.-]?\d{3,4}/;
const ISO_TS_RE = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?\b/;
const JWT_RE = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/;
const SK_RE = /\b(sk|pk|rk)[-_](live|test|proj)?[-_]?[A-Za-z0-9]{16,}\b|\bsk-[A-Za-z0-9_-]{16,}\b/;
const BEARER_RE = /\bbearer\s+[A-Za-z0-9._~+/-]{12,}=*/i;
const AWS_KEY_RE = /\bAKIA[0-9A-Z]{16}\b/;
const GH_TOKEN_RE = /\bgh[pousr]_[A-Za-z0-9]{30,}\b/;
const STACK_RE = /(\n\s+at\s+[\w.<>$]+\s*\(.*:\d+:\d+\))|(Traceback \(most recent call last\))|(\bat [\w$.]+\([\w.]+\.java:\d+\))|(File ".*", line \d+)/;
const IPV4_RE = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/;
const CARD_RE = /\b(?:\d[ -]?){13,19}\b/;
const PROMO_RE = /\b(upgrade (to|now)|go pro|premium plan|subscribe (now|today)|free trial|\d+\s?% off|discount code|promo code|limited[- ]time offer|buy now|unlock (more|premium))\b/i;
const MODEL_RE = /\b(system prompt|you are (an?|the) (ai|assistant|model)|ignore (all |any )?previous instructions|as an ai language model|internal use only|do not (show|reveal) (this )?to (the )?user|<\|im_start\|>|\[INST\])/i;
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

function luhn(num: string): boolean {
  const d = num.replace(/\D/g, '');
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0; let alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = +d[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}

interface ValueHit { category: Category; severity: Severity; action: Finding['action']; reason: string }
export function classifyValue(v: string): ValueHit[] {
  const hits: ValueHit[] = [];
  if (JWT_RE.test(v)) hits.push({ category: 'Auth secret (token/key/password)', severity: 'red', action: 'Remove', reason: 'value looks like a JWT' });
  if (SK_RE.test(v) || AWS_KEY_RE.test(v) || GH_TOKEN_RE.test(v)) hits.push({ category: 'Auth secret (token/key/password)', severity: 'red', action: 'Remove', reason: 'value looks like an API key' });
  if (BEARER_RE.test(v)) hits.push({ category: 'Auth secret (token/key/password)', severity: 'red', action: 'Remove', reason: 'value contains a Bearer token' });
  if (STACK_RE.test(v)) hits.push({ category: 'Debug / logs / stack trace', severity: 'red', action: 'Remove', reason: 'value looks like a stack trace' });
  if (MODEL_RE.test(v)) hits.push({ category: 'Internal model / system text', severity: 'red', action: 'Remove', reason: 'value looks like internal model/system instructions' });
  if (PROMO_RE.test(v)) hits.push({ category: 'Promotional / upsell text', severity: 'amber', action: 'Remove', reason: 'value contains upgrade/promotion wording' });
  if (EMAIL_RE.test(v)) hits.push({ category: 'Email address', severity: 'amber', action: 'Remove or disclose', reason: 'value contains an email address' });
  if (ISO_TS_RE.test(v)) hits.push({ category: 'Timestamp', severity: 'amber', action: 'Remove or disclose', reason: 'value is an ISO 8601 timestamp' });
  if (IPV4_RE.test(v) && !ISO_TS_RE.test(v)) hits.push({ category: 'IP address', severity: 'red', action: 'Remove', reason: 'value looks like an IP address' });
  const card = CARD_RE.exec(v);
  if (card && luhn(card[0])) hits.push({ category: 'Payment card number', severity: 'red', action: 'Remove', reason: 'value passes the Luhn check for a card number' });
  else if (!EMAIL_RE.test(v) && !ISO_TS_RE.test(v) && !UUID_RE.test(v) && !IPV4_RE.test(v)) {
    const m = PHONE_RE.exec(v);
    if (m && m[0].replace(/\D/g, '').length >= 10 && m[0].replace(/\D/g, '').length <= 15) hits.push({ category: 'Phone number', severity: 'amber', action: 'Remove or disclose', reason: 'value looks like a phone number' });
  }
  return hits;
}

export function classifyKey(key: string): KeyRule | undefined {
  const k = norm(key);
  if (!k || /^\d+$/.test(k)) return undefined;
  return KEY_RULES.find((r) => r.re.test(k));
}

/** Walk every nested path of a JSON value. */
export function walk(value: unknown, cb: (path: string, key: string, v: unknown) => void, path = '$', key = ''): void {
  cb(path, key, value);
  if (Array.isArray(value)) value.forEach((x, i) => walk(x, cb, `${path}[${i}]`, String(i)));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, cb, /^[A-Za-z_$][\w$]*$/.test(k) ? `${path}.${k}` : `${path}[${JSON.stringify(k)}]`, k);
}

/** MCP tool results often wrap JSON inside content[].text strings — unwrap them so nested fields are audited too. */
function maybeParseJsonString(v: string): unknown {
  const t = v.trim();
  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
    try { return JSON.parse(t); } catch { return undefined; }
  }
  return undefined;
}

export function auditValue(root: unknown, blob = 0): Finding[] {
  const out: Finding[] = [];
  const seen = new Set<string>();
  const add = (f: Finding) => { const id = `${f.blob}|${f.path}|${f.category}`; if (!seen.has(id)) { seen.add(id); out.push(f); } };
  const visit = (val: unknown, basePath: string) => walk(val, (path, key, v) => {
    const kr = classifyKey(key);
    const sample = v === null || v === undefined ? String(v) : typeof v === 'object' ? (Array.isArray(v) ? `[${v.length} items]` : '{…}') : String(v);
    const primitive = v !== null && v !== undefined && typeof v !== 'object' && v !== '';
    const objectOk = kr && ['Debug / logs / stack trace', 'Internal model / system text', 'Promotional / upsell text'].includes(kr.category) && v !== null && typeof v === 'object';
    const nameNeedsPerson = kr?.category === 'Personal name' && /^(name|displayname)$/.test(norm(key));
    const personLike = typeof v === 'string' && /^[A-Z][a-z'’.-]+( [A-Z][a-z'’.-]+){1,3}$/.test(v.trim());
    if (kr && (primitive || objectOk) && (!nameNeedsPerson || personLike)) add({ blob, path, key, category: kr.category, severity: kr.severity, action: kr.action, reason: `key name “${key}”`, sample: redact(sample) });
    if (typeof v === 'string') {
      const inner = maybeParseJsonString(v);
      if (inner !== undefined) { visit(inner, `${path}⟨json⟩`); return; }
      for (const h of classifyValue(v)) add({ blob, path, key, category: h.category, severity: h.severity, action: h.action, reason: h.reason, sample: redact(v) });
    }
  }, basePath);
  visit(root, '$');
  return out;
}

export interface BlobParse { index: number; ok: boolean; error?: string; value?: unknown }
/** Split pasted text into one or more JSON blobs: a JSON array of results, NDJSON, or blobs separated by blank lines / '---'. */
export function parseBlobs(text: string): BlobParse[] {
  const t = text.trim();
  if (!t) return [];
  try { return [{ index: 0, ok: true, value: JSON.parse(t) }]; } catch { /* fall through */ }
  const chunks = t.split(/\n\s*(?:---+)?\s*\n(?=\s*[{[])/).map((c) => c.trim()).filter(Boolean);
  return chunks.map((c, index) => { try { return { index, ok: true, value: JSON.parse(c) }; } catch (e) { return { index, ok: false, error: (e as Error).message }; } });
}

// ---- policy disclosure heuristics ----
export const POLICY_KEYWORDS: Record<Category, RegExp[]> = {
  'Email address': [/e-?mail/i],
  'Phone number': [/phone|mobile number|telephone/i],
  'Personal name': [/\bnames?\b/i],
  'Postal address': [/postal|mailing address|street address|shipping address|billing address|\baddress(es)?\b/i],
  'Location / coordinates': [/location|geolocation|gps|coordinates/i],
  'Internal identifier (session/trace/request)': [/session (id|identifier)|request id|trace id|log data|diagnostic/i],
  'Internal account / user ID': [/account (id|identifier|number)|user id|unique identifier|identifiers?/i],
  'Timestamp': [/timestamp|date and time|time of (access|use)|log data|usage data/i],
  'Auth secret (token/key/password)': [/(?!)/], // never acceptable to return, disclosure does not help
  'Debug / logs / stack trace': [/log (data|files)|diagnostic|crash/i],
  'Promotional / upsell text': [/(?!)/],
  'Internal model / system text': [/(?!)/],
  'IP address': [/ip address|internet protocol/i],
  'Payment card number': [/(?!)/],
  'Date of birth': [/date of birth|birth ?date|\bage\b/i],
  'Government ID': [/(?!)/],
};
export function isDisclosed(category: Category, policy: string): boolean {
  return POLICY_KEYWORDS[category].some((re) => re.test(policy));
}

export interface AuditReport {
  blobs: BlobParse[];
  findings: Finding[];
  categories: { category: Category; severity: Severity; action: Finding['action']; count: number; paths: string[]; disclosed: boolean | null }[];
}

export function audit(text: string, policyText = ''): AuditReport {
  const blobs = parseBlobs(text);
  const policy = policyText.trim();
  const findings = blobs.filter((b) => b.ok).flatMap((b) => auditValue(b.value, b.index));
  for (const f of findings) f.disclosed = policy ? (f.action === 'Remove' ? false : isDisclosed(f.category, policy)) : null;
  const byCat = new Map<Category, AuditReport['categories'][number]>();
  for (const f of findings) {
    const c = byCat.get(f.category) ?? { category: f.category, severity: f.severity, action: f.action, count: 0, paths: [], disclosed: f.disclosed ?? null };
    c.count++; if (c.paths.length < 8) c.paths.push(blobs.length > 1 ? `#${f.blob + 1} ${f.path}` : f.path);
    if (f.severity === 'red') c.severity = 'red';
    if (f.action === 'Remove') c.action = 'Remove';
    byCat.set(f.category, c);
  }
  const categories = [...byCat.values()].sort((a, b) => (a.severity === b.severity ? b.count - a.count : a.severity === 'red' ? -1 : 1));
  return { blobs, findings, categories };
}

const PURPOSE: Partial<Record<Category, string>> = {
  'Email address': 'to identify the contact the user asked about and to display it in the response',
  'Phone number': 'to show contact details the user explicitly requested',
  'Personal name': 'to show the people or contacts relevant to the user’s request',
  'Postal address': 'to show or use the address the user asked for (for example, a delivery location)',
  'Location / coordinates': 'to return location-relevant results the user asked for',
  'Internal account / user ID': 'to reference the specific record the user asked to view or change',
  'Timestamp': 'to show when a record the user asked about was created or updated',
  'Date of birth': 'only where the user’s request requires it',
};

/** Draft a plain-language disclosure paragraph for the categories that can be disclosed. */
export function draftDisclosure(report: AuditReport, product = '[Your product]'): string {
  const cats = report.categories.filter((c) => c.action === 'Remove or disclose').map((c) => c.category);
  if (!cats.length) return 'No disclosable personal-data categories were detected. Remove any red items before submitting.';
  const lines = cats.map((c) => `- ${c}: ${PURPOSE[c] ?? 'to fulfil the user’s request'}.`);
  return [
    `Data returned to ChatGPT. When you use ${product} in ChatGPT, our tools may return the following categories of information to ChatGPT in order to answer your request:`,
    ...lines,
    `We return only the fields needed for the request you made. [Describe retention: e.g. “We do not store tool responses after they are sent” / “We keep … for … days”.] [Describe recipients: e.g. “This data is shared with OpenAI to display the response to you.”] [Describe controls: how users can access, correct or delete their data, and how to contact you.]`,
  ].join('\n');
}
