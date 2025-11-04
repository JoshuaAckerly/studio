#!/usr/bin/env node
// CommonJS manifest generator for Noteleks sprite assets.
// Use this variant when the repo uses "type": "module" in package.json.

const fs = require('fs');
const path = require('path');

const spritesDir = path.resolve(__dirname, '..', 'public', 'games', 'noteleks', 'sprites');
const outFile = path.join(spritesDir, 'manifest.json');

function buildManifest(dir) {
    const files = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isFile());

    const frameSeqs = {};

    // Match per-frame files like Skeleton-Run_00.webp or Skeleton-Run_0.webp
    const frameRe = /^(.+_)(\d+)\.webp$/i;

    for (const f of files) {
        const m = f.match(frameRe);
        if (!m) continue;
        const base = m[1]; // e.g., 'Skeleton-Run_'
        const idx = parseInt(m[2], 10);
        const baseUrl = '/games/noteleks/sprites/' + base;
        if (!frameSeqs[baseUrl]) frameSeqs[baseUrl] = [];
        frameSeqs[baseUrl].push({ name: f, idx });
    }

    // Sort each sequence by numeric index and collapse to filename list
    const frameSequences = {};
    for (const baseUrl of Object.keys(frameSeqs)) {
        frameSeqs[baseUrl].sort((a, b) => a.idx - b.idx);
        frameSequences[baseUrl] = frameSeqs[baseUrl].map(x => x.name);
    }

    // Also detect spritesheet/atlas sidecars. Group by stem like 'skeleton_idle'.
    const stemRe = /^(.+?)(?:_512)?(?:\.phaser)?\.(png|webp|json)$/i;
    const stems = {};
    for (const f of files) {
        const m = f.match(stemRe);
        if (!m) continue;
        const stem = m[1];
        const ext = m[2].toLowerCase();
        if (!stems[stem]) stems[stem] = { files: [] };
        stems[stem].files.push({ name: f, ext, isPhaser: /\.phaser\./i.test(f), has512: /_512\./i.test(f) });
    }

    const sheets = {};
    for (const stem of Object.keys(stems)) {
        const group = stems[stem].files;
        // Prefer image: webp no _512, webp _512, png no _512, png _512
        const pickImage = () => {
            const order = [ {ext:'webp', has512:false}, {ext:'webp', has512:true}, {ext:'png', has512:false}, {ext:'png', has512:true} ];
            for (const o of order) {
                const found = group.find(g => g.ext === o.ext && g.has512 === o.has512);
                if (found) return found.name;
            }
            return null;
        };
        // Prefer json: phaser.json, then json no _512, then json _512
        const pickJson = () => {
            const ph = group.find(g => g.ext === 'json' && g.isPhaser);
            if (ph) return ph.name;
            const jno512 = group.find(g => g.ext === 'json' && !g.has512 && !g.isPhaser);
            if (jno512) return jno512.name;
            const j512 = group.find(g => g.ext === 'json' && g.has512 && !g.isPhaser);
            if (j512) return j512.name;
            return null;
        };

        const image = pickImage();
        const json = pickJson();
        if (image || json) {
            // texKey: convert underscores to dashes, e.g. skeleton_idle -> skeleton-idle
            const texKey = stem.replace(/_/g, '-');
            sheets[texKey] = { image: image || null, json: json || null };
        }
    }

    return { frameSequences, sheets };
}

function writeManifest(manifest, out) {
    fs.writeFileSync(out, JSON.stringify(manifest, null, 2), 'utf8');
}

function main() {
    if (!fs.existsSync(spritesDir)) {
        console.error('Sprites directory not found:', spritesDir);
        process.exit(1);
    }

    const manifest = buildManifest(spritesDir);
    writeManifest(manifest, outFile);
    console.log('Wrote manifest to', outFile);
}

if (require.main === module) main();
