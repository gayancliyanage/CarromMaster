const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 450, height: 800 } });
  
  // Menu
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'new-menu.png' });
  console.log('Menu screenshot saved');
  
  // Click play
  await page.mouse.click(225, 570);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'new-game.png' });
  console.log('Game screenshot saved');
  
  await browser.close();
})();
