// Single place for deployment + integration settings.
// GitHub Actions can override SITE_URL / BASE_PATH via repository variables (see README).
//
//   GitHub Pages project site : SITE_URL=https://<user>.github.io   BASE_PATH=/pluginlint
//   Custom domain (later)     : SITE_URL=https://pluginlint.example  BASE_PATH=/
export const SITE_URL = process.env.SITE_URL || 'https://USERNAME.github.io';
export const BASE_PATH = process.env.BASE_PATH || '/pluginlint';

export const SITE_NAME = 'PluginLint';
export const SITE_TAGLINE = 'Free, private tools for preparing a ChatGPT plugin directory listing';

// TODO(beehiiv): paste your beehiiv embed URL here (Settings → Subscribe forms → Embed → the iframe src),
// e.g. 'https://embeds.beehiiv.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx?slim=true'. Empty = placeholder shown.
export const BEEHIIV_EMBED_URL = '';

// TODO(google-form): paste the public Google Form URL for /submit. Empty = placeholder shown.
export const GOOGLE_FORM_URL = '';

// TODO(analytics): optional cookieless analytics script URL (e.g. a self-hosted/free tier cookieless tool).
// Empty = no analytics loaded at all.
export const ANALYTICS_SCRIPT_URL = '';

// TODO(adsense): AdSense publisher id (ca-pub-XXXXXXXXXXXXXXXX) once approved. Empty = no ads loaded.
export const ADSENSE_CLIENT = '';
