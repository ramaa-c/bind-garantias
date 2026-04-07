const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'login.png' });
  await page.goto('http://localhost:5173/inicio');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'inicio.png' });
  await browser.close();
})();
