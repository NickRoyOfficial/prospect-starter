import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const catalog = JSON.parse(await readFile('components/catalog.json', 'utf8'));
const args = process.argv.slice(2);
if (!args.length || args.includes('--list')) {
  console.log(catalog.map(item => `${item.id.padEnd(24)} ${item.category}: ${item.label}`).join('\n'));
} else {
  const selected = args.filter(arg => !arg.startsWith('--')).map(id => {
    const item = catalog.find(item => item.id === id);
    if (!item) throw new Error(`Unknown component: ${id}. Run npm run section -- --list.`);
    return item;
  });
  if (!selected.length) throw new Error('Specify at least one component ID.');
  if (args.includes('--css')) console.log(await readFile('components/base.css', 'utf8'));
  for (const item of selected) console.log(await readFile(join('components', args.includes('--css') ? item.css : item.html), 'utf8'));
}
