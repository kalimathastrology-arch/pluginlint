/** Prefix an internal path with the configured base (works at /pluginlint and at / on a custom domain). */
export function u(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}` || '/';
}
