import { readFile, writeFile, mkdir, readdir, lstat } from 'node:fs/promises';
import { resolve, join, dirname, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
function option(name) { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; }
if (args.includes('--read')) {
  const path = resolve(option('--read') || '');
  const offset = Number(option('--offset') || 0), length = Number(option('--length') || 60000);
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(length) || length < 1 || length > 100000) throw new Error('Invalid chunk bounds.');
  const payload = await readFile(path, 'utf8');
  console.log(JSON.stringify(payload.slice(offset, offset + length)));
} else if (args.includes('--help') || !args.length) {
  console.log('node scripts/start-prospect.mjs --repo owner/prospect --name "Business name" --dir /absolute/new-checkout [--worker worker-name]\nNo dependencies or GitHub credentials required. Creates local source and one connector upload bundle; publish that bundle before design work.');
} else {
  const repository = option('--repo'), name = option('--name'), directory = option('--dir');
  if (!repository || !/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(repository)) throw new Error('Supply --repo owner/name.');
  if (repository.toLowerCase() === 'nickroyofficial/prospect-starter') throw new Error('The shared starter cannot be a prospect destination.');
  if (!name?.trim() || !directory) throw new Error('--name and --dir are required.');
  const destination = resolve(directory);
  if (destination === root || destination.startsWith(root + sep)) throw new Error('Use a separate checkout outside the starter.');
  try { if ((await readdir(destination)).length) throw new Error('Destination must be empty; existing work will not be overwritten.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const worker = option('--worker') || repository.split('/')[1].toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!/^[a-z][a-z0-9-]{0,62}$/.test(worker) || worker === 'prospect-starter') throw new Error('Invalid prospect Worker name.');
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const entries = [], binaries = [];
  await mkdir(destination, { recursive: true });
  for (const path of tracked) {
    if (/(^|\/)(node_modules|dist|test-results|playwright-report|\.git|\.wrangler)(\/|$)/.test(path) || /(^|\/)\.env(?:\.|$)/.test(path) || /(^|\/)\.dev\.vars/.test(path)) continue;
    const input = resolve(root, path);
    if (!input.startsWith(root + sep) || !(await lstat(input)).isFile()) throw new Error('Unsupported tracked path: ' + path);
    let data = await readFile(input);
    if (path === 'package.json' || path === 'package-lock.json') {
      const config = JSON.parse(data.toString()); config.name = worker;
      if (config.packages?.['']) config.packages[''].name = worker;
      data = Buffer.from(JSON.stringify(config, null, 2) + '\n');
    } else if (path === 'wrangler.jsonc') {
      const config = JSON.parse(data.toString()); config.name = worker;
      data = Buffer.from(JSON.stringify(config, null, 2) + '\n');
    } else if (path === 'BRIEF.md') {
      data = Buffer.from(`# ${name.trim()}\n\n## Project\n- Repository: https://github.com/${repository}\n- Branch: main\n- Worker: ${worker}\n- Starter commit: ${sourceCommit}\n- Status: source initialized, design not complete.\n- Cloudflare: existing default npx wrangler deploy; prepare builds during npm ci.\n\n## Verified facts and sources\n- Unknown until research.\n\n## Direction and selected sections\n- Awaiting business-specific direction. Reuse src/components/sections/layouts.tsx before creating new layout code.\n\n## Assets and conversion\n- Map supplied assets and confirm contact destination before implementation.\n\n## Validation and deployment\n- Not yet reviewed or deployed. Keep noindex and concept disclosure until authorized launch.\n`);
    }
    const output = join(destination, path); await mkdir(dirname(output), { recursive: true }); await writeFile(output, data);
    const text = data.toString('utf8');
    if (Buffer.from(text).equals(data)) entries.push({ path, mode: '100644', type: 'blob', content: text });
    else binaries.push({ path, mode: '100644', type: 'blob', content: data.toString('base64'), encoding: 'base64' });
  }
  execFileSync('git', ['init', '--initial-branch=main', '--quiet', destination]);
  execFileSync('git', ['remote', 'add', 'origin', `https://github.com/${repository}.git`], { cwd: destination });
  const payload = JSON.stringify({ repository_full_name: repository, branch: 'main', tree_elements: entries, binary_blobs: binaries });
  const bundle = join(tmpdir(), `prospect-bootstrap-${randomUUID()}.json`); await writeFile(bundle, payload, { mode: 0o600 });
  console.log(JSON.stringify({ directory: destination, repository, worker, starter_commit: sourceCommit, bundle, length: payload.length, text_files: entries.length, binary_files: binaries.length, sha256: createHash('sha256').update(payload).digest('hex'), next: 'Publish this foundation to the approved target immediately, using docs/github-bootstrap.md. Do not install dependencies or design first.' }));
}
