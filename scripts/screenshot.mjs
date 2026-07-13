import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto('http://localhost:5174/');
await page.waitForTimeout(1000);

// 城を20回クリックして金貨獲得
const clickZone = page.locator('text=クリックで金貨獲得').first();
for (let i = 0; i < 20; i++) {
  await clickZone.click();
  await page.waitForTimeout(30);
}
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/kd-after-click.png', fullPage: false });
console.log('click screenshot done');

// Wave開始
await page.getByText('Wave 1 開始').click();
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/kd-wave.png', fullPage: false });
console.log('wave screenshot done');

await browser.close();
