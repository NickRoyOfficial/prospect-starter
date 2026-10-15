import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { messageFromEntries, buildDraftURL, endpointURL } from '../src/lib/form-utils.js';
import { createPreviewServer } from '../scripts/preview.mjs';

test('drafts encode user content without injecting recipients or message headers', () => {
  const message = 'Name: A&B\nNotes: 50% + more?';
  const url = buildDraftURL('mailto', 'hello@example.com', message);
  assert.equal(new URL(url).searchParams.get('body'), message);
  assert.throws(() => buildDraftURL('mailto', 'hello@example.com?bcc=other@example.com', message));
  assert.throws(() => buildDraftURL('mailto', 'hello@example.com\r\nBcc: other@example.com', message));
  assert.throws(() => buildDraftURL('sms', '+12075550123?body=injected', message));
  assert.match(buildDraftURL('sms', '+1 (207) 555-0123', message), /^sms:\+12075550123\?body=/);
  assert.match(buildDraftURL('sms', '+12075550123', message, { ios: true }), /&body=/);
});
test('message drafts preserve repeated fields and reject file objects', () => {
  assert.equal(messageFromEntries([['Name', ' Nick '], ['Service', 'One'], ['Service', 'Two'], ['_internal', 'hidden']]), 'Name: Nick\nService: One\nService: Two');
  assert.throws(() => messageFromEntries([['Photo', new Blob(['test'])]]));
});
test('endpoint forms require an explicit secure action', () => {
  assert.equal(endpointURL('/api/contact', 'https://example.com/'), 'https://example.com/api/contact');
  assert.equal(endpointURL('/api/contact', 'http://localhost:8000/'), 'http://localhost:8000/api/contact');
  for (const value of ['', '#', 'http://example.com/contact', 'javascript:alert(1)', 'https://user:password@example.com']) assert.throws(() => endpointURL(value, 'https://example.com/'));
});
test('preview serves public assets and refuses secrets, symlinks, and write methods', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'prospect-test-'));
  const root = join(directory, 'public');
  await mkdir(root);
  await writeFile(join(root, 'index.html'), '<main>Preview</main>');
  await writeFile(join(directory, 'private.txt'), 'private');
  await writeFile(join(root, '.env'), 'private');
  let symlinkAvailable = true;
  try { await symlink(join(directory, 'private.txt'), join(root, 'leak.txt')); }
  catch (error) {
    if (!['EPERM', 'EACCES', 'ENOSYS'].includes(error.code)) throw error;
    symlinkAvailable = false;
    t.diagnostic('Symlink assertion unavailable on this platform; other server boundaries remain tested.');
  }
  const server = createPreviewServer(root).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '<main>Preview</main>');
    for (const path of ['/private.txt', '/.env', ...(symlinkAvailable ? ['/leak.txt'] : []), '/%2e%2e%2fprivate.txt', '/missing']) assert.equal((await fetch(base + path)).status, 404);
    assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  } finally { await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
});
