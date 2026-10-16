import { access, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
const args = process.argv.slice(2);
function option(name) { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; }
let server, browser;
try {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || chromium.executablePath();
  try { await access(executablePath); } catch { throw new Error('No installed Chromium. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE or review the hosted preview. This command does not download browsers.'); }
  let origin = option('--url');
  if (!origin) {
    const { createServer } = await import('vite');
    server = await createServer({ server: { host: '127.0.0.1', port: 4179, strictPort: true }, logLevel: 'error' });
    await server.listen(); origin = 'http://127.0.0.1:4179';
  }
  const directory = resolve(option('--output') || 'test-results/review'); await mkdir(directory, { recursive: true });
  browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const results = [];
  for (const [name, width, height] of [['desktop',1440,900],['mobile',390,844],['short',375,667]]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 600, hasTouch: width < 600, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(new URL(option('--path') || '/', origin).href, { waitUntil: 'load', timeout: 20000 });
    await page.locator('h1').first().waitFor({ state: 'attached', timeout: 10000 });
    await Promise.race([page.evaluate(() => document.fonts.ready), new Promise(done => setTimeout(done, 3000))]);
    const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, headings: document.querySelectorAll('h1').length, brokenImages: [...document.images].filter(image => image.getBoundingClientRect().top < innerHeight && image.complete && image.naturalWidth === 0).map(image => image.getAttribute('src')), heroHeight: document.querySelector('.p-hero,[data-hero],.hero')?.getBoundingClientRect().height, viewportHeight: innerHeight }));
    const screenshot = resolve(directory, `${name}.png`); await page.screenshot({ path: screenshot });
    results.push({ viewport: name, ...layout, errors, screenshot }); await page.close();
  }
  console.log(JSON.stringify({ results, note: 'Viewport and asset smoke checks only. Inspect the screenshots and relevant interactions; this is not proof of design quality.' }, null, 2));
  if (results.some(result => result.overflow || result.headings !== 1 || result.brokenImages.length || result.errors.length)) process.exitCode = 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await browser?.close(); await server?.close(); }
