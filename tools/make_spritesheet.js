#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import puppeteer from 'puppeteer';

function usage() {
    console.log(`
Usage: node tools/make_spritesheet.js --base <basePath> --count <numFrames> --out <outPng> [--json <outJson>] [--cols <cols>] [--frameWidth <w>] [--frameHeight <h>]

Arguments:
  --base        Base file path prefix for frames (relative to repo root). Example: public/games/noteleks/spine/characters/Skeleton-Idle_
  --count       Number of frames (frames numbered 0..count-1)
  --out         Output PNG path (relative to repo root)
  --json        Output JSON metadata path (optional)
  --cols        Number of columns in the spritesheet grid (default: 8)
  --frameWidth  Optional frame width to force
  --frameHeight Optional frame height to force

Example:
  node tools/make_spritesheet.js --base public/games/noteleks/spine/characters/Skeleton-Idle_ --count 9 --out public/games/noteleks/sprites/skeleton_idle.png --json public/games/noteleks/sprites/skeleton_idle.json --cols 4
`);
}

function parseArgs() {
    const args = process.argv.slice(2);
    const out = {};
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '--base') out.base = args[++i];
        else if (a === '--count') out.count = parseInt(args[++i], 10);
        else if (a === '--out') out.out = args[++i];
        else if (a === '--json') out.json = args[++i];
        else if (a === '--cols') out.cols = parseInt(args[++i], 10);
        else if (a === '--frameWidth') out.frameWidth = parseInt(args[++i], 10);
        else if (a === '--frameHeight') out.frameHeight = parseInt(args[++i], 10);
        else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
        else {
            console.error('Unknown arg', a);
            usage(); process.exit(1);
        }
    }
    return out;
}

(async () => {
    try {
        const repoRoot = process.cwd();
        const args = parseArgs();
        if (!args.base || !args.count || !args.out) {
            usage();
            process.exit(1);
        }
        const cols = args.cols && args.cols > 0 ? args.cols : 8;
        const frameCount = args.count;
        const frameUrls = [];
        for (let i = 0; i < frameCount; i++) {
            const rel = args.base + i + '.webp';
            const abs = path.resolve(repoRoot, rel);
            // Read the file and convert to a data URL so the headless page can
            // load it without relying on file:// access which can be flaky
            // across environments.
            try {
                const buf = await fs.readFile(abs);
                const dataUrl = 'data:image/webp;base64,' + buf.toString('base64');
                frameUrls.push(dataUrl);
            } catch (e) {
                console.error('[make_spritesheet] Failed to read frame file', abs, e && e.message);
                throw e;
            }
        }

        console.log('[make_spritesheet] Launching headless browser...');
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();

        // Expose frameUrls and options to the page
        await page.exposeFunction('__getFrameUrls', () => frameUrls);
        await page.exposeFunction('__getOptions', () => ({ cols, frameWidth: args.frameWidth || null, frameHeight: args.frameHeight || null }));

        const result = await page.evaluate(async () => {
            const frameUrls = await window.__getFrameUrls();
            const opts = await window.__getOptions();

            const loadImage = (url) => new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = (e) => reject(new Error('Failed to load ' + url + ' - ' + e));
                img.src = url;
            });

            const imgs = [];
            for (const u of frameUrls) {
                // eslint-disable-next-line no-await-in-loop
                const img = await loadImage(u);
                imgs.push(img);
            }

            // Determine frame dimensions. If a target frame size was provided,
            // we'll scale each source image into that cell; otherwise use the
            // first image's natural dimensions.
            const fw = opts.frameWidth || imgs[0].naturalWidth || imgs[0].width;
            const fh = opts.frameHeight || imgs[0].naturalHeight || imgs[0].height;

            const cols = opts.cols;
            const rows = Math.ceil(imgs.length / cols);
            const canvas = document.createElement('canvas');
            canvas.width = cols * fw;
            canvas.height = rows * fh;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const framesMeta = [];
            for (let i = 0; i < imgs.length; i++) {
                const img = imgs[i];
                const cx = (i % cols) * fw;
                const cy = Math.floor(i / cols) * fh;
                // Draw image into the cell. If the target frame size differs
                // from the source, scale the image to fit exactly into the
                // target cell (this downscales/upscales as requested). This
                // avoids huge output spritesheets when you want smaller frames.
                const dx = cx;
                const dy = cy;
                try {
                    ctx.drawImage(img, dx, dy, fw, fh);
                } catch (e) {
                    // Fallback: draw without scaling if drawImage failed
                    const dw = img.naturalWidth || img.width;
                    const dh = img.naturalHeight || img.height;
                    const ddx = cx + Math.floor((fw - dw) / 2);
                    const ddy = cy + Math.floor((fh - dh) / 2);
                    ctx.drawImage(img, ddx, ddy, dw, dh);
                }
                framesMeta.push({ name: i, frame: { x: cx, y: cy, w: fw, h: fh } });
            }

            const dataUrl = canvas.toDataURL('image/png');
            return { dataUrl, width: canvas.width, height: canvas.height, frameWidth: fw, frameHeight: fh, frames: framesMeta };
        });

        // Convert dataURL to buffer and write file
        const base64 = result.dataUrl.split(',')[1];
        const buf = Buffer.from(base64, 'base64');
        const outPath = path.resolve(repoRoot, args.out);
        await fs.mkdir(path.dirname(outPath), { recursive: true });
        await fs.writeFile(outPath, buf);
        console.log('[make_spritesheet] Wrote', outPath, 'size=', result.width + 'x' + result.height);

        if (args.json) {
            const jsonOut = path.resolve(repoRoot, args.json);
            const meta = {
                meta: {
                    image: path.basename(args.out),
                    size: { w: result.width, h: result.height },
                    frameWidth: result.frameWidth,
                    frameHeight: result.frameHeight,
                    frameCount: frameCount
                },
                frames: result.frames
            };
            await fs.writeFile(jsonOut, JSON.stringify(meta, null, 2), 'utf8');
            console.log('[make_spritesheet] Wrote JSON metadata to', jsonOut);
        }

        await browser.close();
        console.log('[make_spritesheet] Done.');
    } catch (err) {
        console.error('[make_spritesheet] Error:', err && err.stack ? err.stack : err);
        process.exit(1);
    }
})();
