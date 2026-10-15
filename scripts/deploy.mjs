import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const config = JSON.parse(await readFile('wrangler.jsonc', 'utf8'));
if (!config.name || config.name === 'prospect-starter') {
  console.error('Set the approved prospect Worker name in wrangler.jsonc before deploying. The reusable starter is not a live business site.');
  process.exit(1);
}
const build = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' });
if (build.status !== 0) process.exit(build.status ?? 1);
const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['wrangler@4', 'deploy'], { stdio: 'inherit', shell: process.platform === 'win32' });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
