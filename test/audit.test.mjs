// Proves the audit catches what it claims and stays quiet on a clean page.
// Needs an installed Chromium (or PLAYWRIGHT_CHROMIUM_EXECUTABLE); skips otherwise.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const executable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || chromium.executablePath();
const hasBrowser = await access(executable).then(() => true, () => false);

async function audit(fixture, extra = []) {
  const out = await mkdtemp(join(tmpdir(), 'audit-test-'));
  const url = pathToFileURL(resolve('test/fixtures', fixture)).href;
  const result = spawnSync(process.execPath, ['scripts/audit.mjs', '--url', url, '--output', out, '--json', '--viewports', 'desktop,mobile', ...extra], { encoding: 'utf8', env: { ...process.env, PLAYWRIGHT_CHROMIUM_EXECUTABLE: executable } });
  await rm(out, { recursive: true, force: true });
  assert.ok(result.stdout.trim().startsWith('{'), `audit did not return JSON:\n${result.stderr}\n${result.stdout}`);
  return { report: JSON.parse(result.stdout), status: result.status };
}
const ids = report => new Set(Object.values(report.viewports).flatMap(v => v.findings.map(f => f.id)));

test('audit fails on the defect fixture and names each planted defect', { skip: !hasBrowser && 'No Chromium installed' }, async () => {
  const { report, status } = await audit('defects.html');
  assert.equal(status, 1);
  const found = ids(report);
  const expected = [
    'h1-count', 'heading-skip', 'overflow-page', 'runtime-error',
    'img-broken', 'img-alt-missing', 'img-distorted', 'link-dead', 'link-anchor-missing', 'placeholder-text',
    'control-cramped', 'touch-target', 'contrast', 'text-tiny', 'text-small-body', 'focus-invisible', 'input-zoom',
    'overlap-text', 'overlap-control', 'control-obscured', 'clipped-content', 'containing-block-trap', 'anchor-offset', 'hero-overflow',
    'tell-hero-stack', 'tell-gradient-text', 'tell-uppercase-heading', 'tell-thin-display', 'tell-eyebrow', 'tell-question-headline', 'tell-tracked-body',
    'tell-emoji', 'tell-dot-strip', 'tell-accent-bar', 'tell-glass', 'tell-glow', 'tell-radius-systems', 'tell-pure-ground', 'tell-all-centered', 'tell-icon-cliche', 'tell-four-column-footer', 'tell-zigzag',
    'copy-banned-phrase', 'copy-negation-pivot', 'copy-em-dash', 'copy-scarcity', 'copy-unsourced-proof', 'copy-ai-vocabulary', 'copy-trailing-participle', 'copy-closing-ritual', 'copy-filler-verb', 'copy-question-headline', 'copy-staccato', 'copy-adverb', 'copy-generic-cta',
  ];
  const missing = expected.filter(id => !found.has(id));
  assert.deepEqual(missing, [], `audit missed: ${missing.join(', ')}`);
  const mobile = report.viewports.mobile;
  assert.ok(mobile.states.some(s => s.opened && s.findings > 0), 'opening the details menu should surface the unpadded menu items');
  assert.ok(Object.values(report.viewports).every(v => v.findings.every(f => f.level !== 'fail' || f.message)), 'every failure carries a message');
});

test('audit passes a clean page with no failures and no warnings', { skip: !hasBrowser && 'No Chromium installed' }, async () => {
  const { report, status } = await audit('clean.html');
  const noise = Object.values(report.viewports).flatMap(v => v.findings.filter(f => f.level !== 'note'));
  assert.deepEqual(noise.map(f => `${f.viewport}:${f.id}:${f.message}`), [], 'clean page produced findings');
  assert.equal(status, 0);
  assert.equal(report.summary.fail, 0);
});

test('audit flags are honoured', { skip: !hasBrowser && 'No Chromium installed' }, async () => {
  const { report } = await audit('defects.html', ['--no-tells', '--no-copy', '--no-states']);
  const found = ids(report);
  assert.ok(![...found].some(id => id.startsWith('tell-') || id.startsWith('copy-')), 'tells and copy checks should be off');
  assert.ok(found.has('control-cramped'));
  assert.ok(Object.values(report.viewports).every(v => v.states.length === 0));
});
