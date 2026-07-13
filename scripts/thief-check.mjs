import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto('http://localhost:5175/');
await page.waitForTimeout(800);

// 兵士パネルを確認（シーフが表示されているか）
await page.screenshot({ path: 'C:/tmp/thief-panel.png', fullPage: false });

// 城を60回クリックしてゴールドを貯める
for (let i = 0; i < 60; i++) {
  await page.locator('text=クリックで金貨獲得').click();
  await page.waitForTimeout(20);
}
await page.waitForTimeout(300);

// シーフを雇用（200Gのはず）
const hireButtons = page.locator('button', { hasText: '雇用' });
const count = await hireButtons.count();
for (let i = 0; i < count; i++) {
  const btn = hireButtons.nth(i);
  const text = await btn.locator('..').locator('..').textContent().catch(() => '');
  if (text.includes('シーフ')) {
    await btn.click();
    break;
  }
}
await page.waitForTimeout(300);
await page.screenshot({ path: 'C:/tmp/thief-hired.png', fullPage: false });

// Wave開始
await page.locator('text=Wave 1 開始').click();
await page.waitForTimeout(4000);
await page.screenshot({ path: 'C:/tmp/thief-wave.png', fullPage: false });

await browser.close();
console.log('done');
