const { chromium } = require('playwright');

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 500, height: 850 } });
  
  // Wait for Vite to be ready
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    await page.goto('http://localhost:3003/pixi.html', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000); // Wait for rendering
    await page.screenshot({ path: '/tmp/pixi-board.png', fullPage: false });
    console.log('Screenshot saved to /tmp/pixi-board.png');
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  try {
    await page.goto('http://localhost:3003/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    // Click to start game if menu exists
    await page.screenshot({ path: '/tmp/phaser-menu.png', fullPage: false });
    console.log('Screenshot saved to /tmp/phaser-menu.png');
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  await browser.close();
}

takeScreenshot();
