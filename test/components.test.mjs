import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildCatalog } from '../scripts/catalog.mjs';

test('catalog previews resolve placeholders, preserve variant identity, and load dependencies', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'component-check-'));
  try {
    const catalog = await buildCatalog(directory);
    assert.equal(new Set(catalog.map(item => item.id)).size, catalog.length);
    assert.ok(catalog.length >= 20);
    for (const item of catalog) {
      const html = await readFile(join(directory, 'preview', item.id+'.html'), 'utf8');
      assert.ok(html.includes('<title>'+item.label+'</title>'));
      assert.ok(!/\{\{[^}]+\}\}/.test(html), item.id);
      const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
      assert.equal(ids.length, new Set(ids).size, 'Duplicate IDs: '+item.id);
      for (const [, id] of html.matchAll(/aria-labelledby="([^"]+)"/g)) assert.ok(ids.includes(id), item.id+' label target');
      for (const [, path] of html.matchAll(/(?:src|href)="(\/[^"?#]+)(?:#[^"]*)?"/g)) await readFile(join(directory, path));
    }
    const starter = await readFile('src/App.tsx', 'utf8');
    assert.ok(!/\{\{[a-zA-Z_][a-zA-Z_0-9]*\}\}/.test(starter));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
