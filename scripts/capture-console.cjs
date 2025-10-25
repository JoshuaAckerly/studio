const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const url = process.argv[2] || 'https://studio.test/noteleks';
  // Optional third argument: user-agent string to use for the headless page.
  // If provided, this lets us emulate desktop vs mobile UA to exercise different input paths.
  const forcedUA = process.argv[3] || null;
  const out = [];

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox'],
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(30000);

  // If a UA was provided, set it and force a desktop-like environment to avoid mobile input detection.
  // We set a desktop viewport with touch disabled and inject overrides for navigator.maxTouchPoints
  // and window.ontouchstart so the page's device-detection sees a non-touch desktop device.
  if (forcedUA) {
    try {
      // Ensure overrides are applied before any scripts run on the page
      await page.evaluateOnNewDocument((ua) => {
        try {
          // Override maxTouchPoints to 0
          Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0, configurable: true });
        } catch (e) {
          // ignore
        }
        try {
          // Remove any conventional touch event hints
          delete window.ontouchstart;
          delete window.ontouchmove;
          delete window.ontouchend;
        } catch (e) {
          // ignore
        }
        try {
          // Optionally override platform to a desktop value
          Object.defineProperty(navigator, 'platform', { get: () => 'Win32', configurable: true });
        } catch (e) {
          // ignore
        }
      }, forcedUA);

      await page.setUserAgent(forcedUA);
      // Set desktop viewport and explicitly disable touch emulation
      await page.setViewport({ width: 1280, height: 800, isMobile: false, hasTouch: false });
      console.log('Using forced User-Agent and forcing desktop environment for capture');
    } catch (e) {
      console.warn('Failed to set forced UA/desktop viewport/overrides:', e && e.message);
    }
  }

  page.on('console', msg => {
    try {
      const args = msg.args();
      Promise.all(args.map(a => a.jsonValue().catch(() => a.toString()))).then(values => {
        const ev = {
          type: 'console',
          ts: new Date().toISOString(),
          tms: Date.now(),
          level: msg.type(),
          text: values.join(' '),
          location: msg.location()
        };
        out.push(ev);
        console.log('[console]', msg.type(), values.join(' '));
      });
    } catch (e) {
      const ev = { type: 'console', ts: new Date().toISOString(), tms: Date.now(), level: msg.type(), text: msg.text() };
      out.push(ev);
      console.log('[console]', msg.type(), msg.text());
    }
  });

  page.on('pageerror', err => {
    const ev = { type: 'pageerror', ts: new Date().toISOString(), tms: Date.now(), message: err.message, stack: err.stack };
    out.push(ev);
    console.log('[pageerror]', err.message);
  });

  page.on('response', response => {
    const ev = { type: 'response', ts: new Date().toISOString(), tms: Date.now(), url: response.url(), status: response.status() };
    out.push(ev);
    if (response.status() >= 400) console.log('[response]', response.status(), response.url());
  });

  try {
    console.log('Visiting', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait up to 15s for the app to initialize, but poll for known globals.
    const maxWaitMs = 15000;
    const pollInterval = 500;
    let waited = 0;
    let found = false;
    while (waited < maxWaitMs) {
      // Check for the globals we expose: noteleksGame or noteleksPlayer
      const hasGlobals = await page.evaluate(() => {
        try {
          return !!(window.noteleksGame || window.noteleksPlayer);
        } catch (e) {
          return false;
        }
      });
      if (hasGlobals) {
        found = true;
        console.log('Detected game globals in page');
        break;
      }
      await new Promise(r => setTimeout(r, pollInterval));
      waited += pollInterval;
    }

    if (!found) {
      console.log('Globals not detected within timeout, still capturing page for debugging');
    }

    // Extra wait to let any late logs appear
    await new Promise(r => setTimeout(r, 3000));

    // Save screenshot and page HTML for offline inspection
    try {
      const screenshotPath = 'capture-console-page.png';
      await page.screenshot({ path: screenshotPath, fullPage: true });
      out.push({ type: 'artifact', ts: new Date().toISOString(), tms: Date.now(), kind: 'screenshot', path: screenshotPath });
      console.log('Saved screenshot to', screenshotPath);
    } catch (e) {
      console.warn('Failed to save screenshot:', e && e.message);
    }

    try {
      const html = await page.content();
      const htmlPath = 'capture-console-page.html';
      require('fs').writeFileSync(htmlPath, html, 'utf8');
      out.push({ type: 'artifact', ts: new Date().toISOString(), tms: Date.now(), kind: 'html', path: htmlPath });
      console.log('Saved page HTML to', htmlPath);
    } catch (e) {
      console.warn('Failed to save page HTML:', e && e.message);
    }
  } catch (e) {
    console.error('Navigation error:', e && e.message ? e.message : e);
    out.push({type: 'navigation-error', ts: new Date().toISOString(), tms: Date.now(), message: e.message || String(e)});
  }

  const outPath = 'capture-console-output.json';
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('Saved logs to', outPath);

  await browser.close();
  process.exit(0);
})();
