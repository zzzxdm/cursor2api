/**
 * 测试 Vercel Challenge 耗时
 * 用法: npm run test:stealth
 */
const CHALLENGE_URL = process.env.CHALLENGE_URL || 'https://cursor.com/cn/docs';

async function simulateHuman(page) {
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
    const points = Array.from({ length: 5 }, () => ({
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 400,
    }));
    for (const p of points) {
        await page.mouse.move(p.x, p.y, { steps: 5 + Math.floor(Math.random() * 10) });
        await new Promise(r => setTimeout(r, 100 + Math.random() * 300));
    }
    await page.mouse.wheel(0, 100 + Math.random() * 200);
    await new Promise(r => setTimeout(r, 300 + Math.random() * 500));
    await page.mouse.click(300 + Math.random() * 400, 300 + Math.random() * 200);
    console.log(`[Test] Human behavior simulation done`);
}

(async () => {
    const { chromium } = require('playwright-extra');
    const stealth = require('puppeteer-extra-plugin-stealth');
    chromium.use(stealth());

    const start = Date.now();
    const elapsed = () => ((Date.now() - start) / 1000).toFixed(1) + 's';

    console.log(`[Test] Launching browser...`);
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const ctx = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
    });

    const page = await ctx.newPage();
    console.log(`[Test] [${elapsed()}] Navigating to ${CHALLENGE_URL}...`);

    try {
        await page.goto(CHALLENGE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
        console.log(`[Test] [${elapsed()}] Page loaded, simulating human behavior...`);
    } catch (e) {
        console.error(`[Test] [${elapsed()}] Page load failed: ${e.message}`);
        await browser.close();
        process.exit(1);
    }

    await simulateHuman(page);
    console.log(`[Test] [${elapsed()}] Waiting for _vcrcs cookie...`);

    for (let i = 0; i < 60; i++) {
        const cookies = await ctx.cookies();
        const vcrcs = cookies.find(c => c.name === '_vcrcs');
        if (vcrcs) {
            console.log(`[Test] [${elapsed()}] Got _vcrcs cookie!`);
            console.log(`[Test] Value: ${vcrcs.value.substring(0, 50)}...`);
            await browser.close();
            process.exit(0);
        }
        await new Promise(r => setTimeout(r, 2000));
    }

    console.error(`[Test] [${elapsed()}] Failed to get _vcrcs cookie after 120s`);
    await browser.close();
    process.exit(1);
})();
