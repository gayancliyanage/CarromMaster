const { spawn } = require('child_process');
const { chromium } = require('playwright');

async function main() {
  // Start Vite server
  console.log('Starting Vite server...');
  const vite = spawn('npx', ['vite', '--port', '3099'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let serverReady = false;
  
  vite.stdout.on('data', (data) => {
    const str = data.toString();
    console.log('Vite:', str);
    if (str.includes('localhost:3099')) {
      serverReady = true;
    }
  });
  
  vite.stderr.on('data', (data) => {
    console.log('Vite err:', data.toString());
  });
  
  // Wait for server to be ready
  for (let i = 0; i < 30; i++) {
    if (serverReady) break;
    await new Promise(r => setTimeout(r, 500));
  }
  
  await new Promise(r => setTimeout(r, 2000));
  console.log('Server should be ready');
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    // PixiJS version
    console.log('Taking PixiJS screenshot...');
    const page1 = await browser.newPage({ viewport: { width: 500, height: 850 } });
    await page1.goto('http://localhost:3099/pixi.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page1.waitForTimeout(4000);
    await page1.screenshot({ path: '/tmp/pixi-board.png' });
    console.log('PixiJS screenshot saved');
    await page1.close();
    
    // Phaser version - click Play vs CPU to get to game
    console.log('Taking Phaser screenshot...');
    const page2 = await browser.newPage({ viewport: { width: 500, height: 850 } });
    await page2.goto('http://localhost:3099/', { waitUntil: 'networkidle', timeout: 30000 });
    await page2.waitForTimeout(2000);
    
    // Click on "Play vs CPU" text
    try {
      await page2.click('text=Play vs CPU', { timeout: 5000 });
      await page2.waitForTimeout(3000);
    } catch (e) {
      console.log('Could not click Play vs CPU, taking menu screenshot');
    }
    
    await page2.screenshot({ path: '/tmp/phaser-board.png' });
    console.log('Phaser screenshot saved');
    await page2.close();
    
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  await browser.close();
  vite.kill();
  console.log('Done!');
}

main().catch(console.error);
