import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve('public');
let errors = 0;
function fail(message) { console.error(message); errors++; }
async function walk(dir) { const entries = await readdir(dir, { withFileTypes: true }); const nested = await Promise.all(entries.map(e => e.isDirectory() ? walk(resolve(dir, e.name)) : resolve(dir, e.name))); return nested.flat(); }
const files = [resolve('index.html'), ...await walk(resolve('src')), ...await walk(root), ...await walk(resolve('scripts')), ...await walk(resolve('test'))];
for (const file of files) {
  if (['.js', '.mjs'].includes(extname(file))) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) fail(result.stderr);
  }
  if (['.tsx', '.jsx'].includes(extname(file))) {
    const component = await readFile(file, 'utf8');
    if (/\{\{[a-zA-Z_][a-zA-Z_0-9]*\}\}/.test(component) || /data-media-placeholder\b/.test(component)) fail(`Unresolved component placeholder: ${file}`);
  }
  if (extname(file) !== '.html') continue;
  const source = await readFile(file, 'utf8');
  if (/\{\{[^}]+\}\}/.test(source)) fail(`Unresolved component tokens: ${file}`);
  if (/data-media-placeholder\b/.test(source)) fail(`Replace component media slots before publishing: ${file}`);
  const ids = [...source.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)].map(m => m[1]);
  if (new Set(ids).size !== ids.length) fail(`Duplicate IDs: ${file}`);
  for (const match of source.matchAll(/\s(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
    const value = match[1];
    if (!value || value.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(value)) continue;
    if (value.startsWith('#')) { if (value.length > 1 && !ids.includes(value.slice(1))) fail(`Missing anchor ${value}: ${file}`); continue; }
    try {
      const clean = decodeURIComponent(value.split(/[?#]/)[0]);
      const resourceRoot = file === resolve('index.html') && !clean.startsWith('/assets/') ? resolve('.') : root;
      let target = clean.startsWith('/') ? resolve(resourceRoot, '.' + clean) : resolve(dirname(file), clean);
      if (target !== resourceRoot && !target.startsWith(resourceRoot + sep)) throw new Error('Outside source root');
      if ((await stat(target)).isDirectory()) target = resolve(target, 'index.html');
      await stat(target);
    } catch { fail(`Missing local resource ${value}: ${file}`); }
  }
  for (const select of source.matchAll(/<select\b[^>]*>([\s\S]*?)<\/select>/gi)) {
    const options = select[1].match(/<option\b/gi) || [];
    const closes = select[1].match(/<\/option\s*>/gi) || [];
    if (!options.length || options.length !== closes.length) fail(`Check select option markup: ${file}`);
  }
}
for (const file of ['package.json', 'wrangler.jsonc']) {
  try { JSON.parse(await readFile(file, 'utf8')); } catch { fail(`Invalid JSON: ${file}. Keep starter configuration as plain JSON.`); }
}
if (errors) process.exitCode = 1;
else console.log('Checks passed: JavaScript syntax, local HTML resources, IDs, anchors, select markup, and configuration JSON.');
