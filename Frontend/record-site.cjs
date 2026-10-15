// Records a scripted walkthrough of the NEP CLOTH storefront.
// Run with: node record-site.cjs

const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const CONFIG = {
  baseUrl: 'http://localhost:5173',
  width: 1920,
  height: 1080,
  outputDir: 'video-output',
  outputName: 'website-demo',
  zoomScale: 1.6,
  steps: [
    { name: 'Home', url: '/', wait: 4500, scroll: true },
    { name: 'Men', click: 'text=Men', wait: 3500, scroll: true },
    { name: 'Women', click: 'text=Women', wait: 3500, scroll: true },
  ],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const INIT_SCRIPT = `
  (() => {
    const setup = () => {
      if (document.getElementById('__cursor')) return;
      const cursor = document.createElement('div');
      cursor.id = '__cursor';
      cursor.style.cssText = [
        'position:fixed','top:0','left:0','width:26px','height:26px',
        'border-radius:50%','background:rgba(255,255,255,0.9)',
        'border:2px solid #111','box-shadow:0 2px 10px rgba(0,0,0,0.4)',
        'pointer-events:none','z-index:2147483647',
        'transform:translate(-100px,-100px)',
        'transition:transform 0.05s linear, width .15s, height .15s'
      ].join(';');
      document.documentElement.appendChild(cursor);
      window.addEventListener('mousemove', (event) => {
        cursor.style.transform = 'translate(' + (event.clientX - 13) + 'px,' + (event.clientY - 13) + 'px)';
      }, true);
      window.addEventListener('mousedown', () => { cursor.style.width = '18px'; cursor.style.height = '18px'; }, true);
      window.addEventListener('mouseup', () => { cursor.style.width = '26px'; cursor.style.height = '26px'; }, true);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
    else setup();
    window.__zoom = (x, y, scale, ms) => {
      const root = document.documentElement;
      root.style.transformOrigin = (x + window.scrollX) + 'px ' + (y + window.scrollY) + 'px';
      root.style.transition = 'transform ' + ms + 'ms cubic-bezier(0.22, 1, 0.36, 1)';
      root.style.transform = 'scale(' + scale + ')';
    };
  })();
`;

async function moveSmooth(page, x, y, steps = 35) {
  await page.mouse.move(x, y, { steps });
}

async function zoomTo(page, x, y, scale, ms) {
  await page.evaluate(([pointX, pointY, amount, duration]) => window.__zoom(pointX, pointY, amount, duration), [x, y, scale, ms]);
  await sleep(ms + 100);
}

async function smoothScroll(page, { distancePerTick = 90, tickMs = 30 } = {}) {
  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  if (maxScroll <= 0) return;
  for (let y = 0; y < maxScroll; y += distancePerTick) {
    await page.mouse.wheel(0, distancePerTick);
    await sleep(tickMs);
  }
  await sleep(700);
  for (let y = maxScroll; y > 0; y -= distancePerTick * 3) {
    await page.mouse.wheel(0, -distancePerTick * 3);
    await sleep(tickMs);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(800);
}

async function waitForPageSettled(page, extraMs) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 3000 });
  } catch {
    // Vite's hot-reload connection may keep the network from going idle.
  }
  await sleep(extraMs);
}

async function main() {
  const outputDirectory = path.resolve(CONFIG.outputDir);
  fs.mkdirSync(outputDirectory, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: CONFIG.width, height: CONFIG.height },
    recordVideo: { dir: outputDirectory, size: { width: CONFIG.width, height: CONFIG.height } },
  });
  await context.addInitScript(INIT_SCRIPT);
  const page = await context.newPage();

  try {
    for (const [index, step] of CONFIG.steps.entries()) {
      console.log(`Step ${index + 1}/${CONFIG.steps.length}: ${step.name}`);
      if (step.url !== undefined) {
        await page.goto(CONFIG.baseUrl + step.url, { waitUntil: 'domcontentloaded' });
        await moveSmooth(page, CONFIG.width / 2, CONFIG.height / 2, 5);
      } else if (step.click) {
        const target = page.locator(step.click).first();
        await target.waitFor({ state: 'visible', timeout: 10000 });
        await target.scrollIntoViewIfNeeded();
        const box = await target.boundingBox();
        if (!box) throw new Error(`Could not locate the ${step.name} navigation link.`);
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        await moveSmooth(page, x, y);
        await sleep(300);
        await zoomTo(page, x, y, CONFIG.zoomScale, 900);
        await sleep(300);
        await page.mouse.down();
        await sleep(80);
        await page.mouse.up();
        await sleep(400);
        await page.evaluate(() => {
          const root = document.documentElement;
          root.style.transition = 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1)';
          root.style.transform = 'scale(1)';
        });
        await moveSmooth(page, CONFIG.width / 2, CONFIG.height / 2, 20);
      }
      await waitForPageSettled(page, step.wait ?? 3000);
      if (step.scroll) await smoothScroll(page);
    }

    await sleep(1500);
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();
    if (video) {
      const tempPath = await video.path();
      const finalPath = path.join(outputDirectory, `${CONFIG.outputName}.webm`);
      fs.renameSync(tempPath, finalPath);
      console.log('\nVideo saved to:', finalPath);
      console.log('Convert to MP4 with ffmpeg if needed:');
      console.log(`ffmpeg -i "${finalPath}" -c:v libx264 -pix_fmt yuv420p -crf 18 "${path.join(outputDirectory, `${CONFIG.outputName}.mp4`)}"`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
