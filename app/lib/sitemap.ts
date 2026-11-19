export function routePaths(files: string[]): string[] {
  return files
    .map((file) => file.split(/[\\/]/))
    .filter((segments) => segments.at(-1) === 'index.html')
    .map((segments) => `/${segments.slice(0, -1).join('/')}`)
    .sort();
}

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export function sitemapXml(urls: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (url) =>
        `  <url><loc>${url.replace(/[&<>"']/g, (char) => XML_ESCAPES[char])}</loc></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');
}
