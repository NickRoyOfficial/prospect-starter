import { mkdtemp, readFile, writeFile, cp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPreviewServer } from './preview.mjs';

export async function buildCatalog(destination) {
  const catalog = JSON.parse(await readFile('components/catalog.json', 'utf8'));
  await mkdir(join(destination, 'preview'), { recursive: true });
  await cp('components', destination, { recursive: true });
  await cp('references/vanilla/css', join(destination, 'css'), { recursive: true });
  await cp('references/vanilla/js', join(destination, 'js'), { recursive: true });
  await mkdir(join(destination, 'assets'), { recursive: true });
  await cp('components/icons.svg', join(destination, 'assets/icons.svg'));
  await cp('components/catalog.html', join(destination, 'index.html'));
  for (const item of catalog) {
    const html = await readFile(join('components', item.html), 'utf8');
    const preview = html.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      if (key.endsWith('_url')) return '#';
      const values = { headline: 'Your headline goes here.', supporting_copy: 'A concise supporting statement explaining the offer and its relevance to the customer.', section_heading: 'Your section heading goes here.', section_intro: 'Introduce this section with a short, useful statement.', primary_action: 'Primary action', secondary_action: 'Secondary action', eyebrow: 'Short context label', brand_name: 'Business name', closing_statement: 'Your closing statement.', copyright: 'Copyright information', concept_or_official_status: 'Independent concept status belongs here.' };
      if (key.startsWith('verified_quote_')) return 'Actual, verified customer quotation goes here.';
      if (key.startsWith('verified_author_')) return 'Verified customer name';
      if (key.startsWith('verified_context_')) return 'Verified context';
      return values[key] || key.replaceAll('_', ' ');
    });
    const page = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+item.label+'</title><link rel="stylesheet" href="/css/reset.css"><link rel="stylesheet" href="/css/tokens.css"><link rel="stylesheet" href="/css/utilities.css"><link rel="stylesheet" href="/base.css"><link rel="stylesheet" href="/'+item.css+'"><style>:root[data-theme="dark"]{--color-bg:#131619;--color-text:#f0f1f3;--color-muted:#aeb6c0;--color-surface:#1d232a;--color-border:#414b58;--color-accent:#d6e4ff;--color-on-accent:#142039;--color-focus:#a8caff}body{padding-block:0}body>main>.c-button,body>main>.c-social{margin:2rem}a{color:inherit}</style><script>document.documentElement.dataset.theme=new URLSearchParams(location.search).get("theme")==="dark"?"dark":"light";</script><script type="module" src="/js/main.js"></script></head><body><main>'+preview+'</main></body></html>';
    await writeFile(join(destination, 'preview', item.id+'.html'), page);
  }
  return catalog;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const directory = await mkdtemp(join(tmpdir(), 'prospect-catalog-'));
  await buildCatalog(directory);
  const port = Number(process.env.PORT || 8001);
  const server = createPreviewServer(directory).listen(port, '127.0.0.1', () => console.log(`Component library: http://127.0.0.1:${port}`));
  let closing = false;
  async function close() { if (closing) return; closing = true; server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
  process.once('SIGINT', () => close().then(() => process.exit()));
  process.once('SIGTERM', () => close().then(() => process.exit()));
}
