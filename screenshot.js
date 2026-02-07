const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
  
  // Menu screen
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot-menu.png' });
  console.log('Menu screenshot saved');
  
  // Click play to go to game
  await page.click('text=PLAY');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot-game.png' });
  console.log('Game screenshot saved');
  
  await browser.close();
})();
