import puppeteer from 'puppeteer';

(async () => {
  console.log("Starting puppeteer...");
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('https://sesewa.ng', { waitUntil: 'networkidle2' });
  
  console.log("Page loaded. Closing browser.");
  await browser.close();
})();
