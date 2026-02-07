const { spawn } = require('child_process');
const { chromium } = require('playwright');

async function main() {
  console.log('Starting Vite server...');
  const vite = spawn('npx', ['vite', '--port', '3098'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let serverReady = false;
  vite.stdout.on('data', (data) => {
    const str = data.toString();
    if (str.includes('localhost:3098')) serverReady = true;
  });
  
  for (let i = 0; i < 30; i++) {
    if (serverReady) break;
    await new Promise(r => setTimeout(r, 500));
  }
  await new Promise(r => setTimeout(r, 2000));
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage({ viewport: { width: 500, height: 850 } });
    await page.goto('http://localhost:3098/pixi.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/tmp/pixi-board-v2.png' });
    console.log('Screenshot saved to /tmp/pixi-board-v2.png');
    await page.close();
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  await browser.close();
  vite.kill();
}

main().catch(console.error);
