const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
  
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(2000);
  
  // Click at center where PLAY button should be (based on game code: centerY + 180)
  await page.mouse.click(400, 580);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshot-game.png' });
  console.log('Game screenshot saved');
  
  await browser.close();
})();
