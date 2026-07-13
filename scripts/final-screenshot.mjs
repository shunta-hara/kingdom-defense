import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto('http://localhost:5175/');
await page.waitForTimeout(1000);

// デスクトップ表示
await page.screenshot({ path: 'C:/tmp/final-desktop.png', fullPage: false });

// 城を30回クリック → 槍兵を雇用
for (let i = 0; i < 30; i++) {
  await page.locator('text=クリックで金貨獲得').click();
  await page.waitForTimeout(20);
}
await page.waitForTimeout(300);

// 槍兵の雇用ボタンをクリック（あれば）
const hireBtn = page.locator('button', { hasText: '雇用' }).first();
if (await hireBtn.isVisible()) {
  await hireBtn.click();
  await page.waitForTimeout(300);
}

// Wave開始
const waveBtn = page.locator('text=Wave 1 開始').first();
if (await waveBtn.isVisible()) {
  await waveBtn.click();
  await page.waitForTimeout(3000);
}
await page.screenshot({ path: 'C:/tmp/final-wave.png', fullPage: false });

// 設定モーダルを開く
const settingsBtn = page.locator('button[title="設定"], button:has-text("⚙")').first();
if (await settingsBtn.isVisible()) {
  await settingsBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/tmp/final-settings.png', fullPage: false });
  await page.keyboard.press('Escape');
}

// スマホサイズ
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(500);
await page.screenshot({ path: 'C:/tmp/final-mobile.png', fullPage: false });

await browser.close();
console.log('done');
