'use strict';

// Simple converter from packer-style JSON (frames array) to Phaser TexturePacker-style atlas JSON.
// Usage:
//   node scripts/convert_packer_to_phaser_atlas.js <inputPathOrDir> [<inputPathOrDir> ...]
// If you pass a directory it will convert all .json files in it. For each input file
// it writes a sibling file with the same basename and suffix `.phaser.json`.

import { promises as fs } from 'fs';
import path from 'path';

async function convertFile(filePath) {
  const src = await fs.readFile(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(src);
  } catch (err) {
    console.error(`Skipping ${filePath}: invalid JSON (${err.message})`);
    return;
  }

  if (!data.frames || !Array.isArray(data.frames)) {
    console.error(`Skipping ${filePath}: missing "frames" array`);
    return;
  }

  const meta = data.meta || {};
  const imageName = meta.image || path.basename(filePath).replace(/\.json$/i, '.png');
  const size = (meta.size && typeof meta.size === 'object') ? meta.size : { w: 0, h: 0 };

  const base = path.basename(filePath).replace(/\.json$/i, '');

  const out = {
    frames: {},
    meta: {
      app: 'packer-to-phaser',
      version: '1.0',
      image: imageName,
      format: 'RGBA8888',
      size: { w: size.w || 0, h: size.h || 0 },
      scale: '1'
    }
  };

  for (const frameEntry of data.frames) {
    // frameEntry.name may be numeric; coerce to string
    const namePart = String(frameEntry.name != null ? frameEntry.name : frameEntry.index ?? 'frame');
    const frameKey = `${base}-frame-${namePart}.png`;
    const f = frameEntry.frame || frameEntry;
    if (!f || typeof f.x !== 'number' || typeof f.y !== 'number' || typeof f.w !== 'number' || typeof f.h !== 'number') {
      console.warn(`  skipping frame ${namePart} in ${filePath}: missing x/y/w/h`);
      continue;
    }

    out.frames[frameKey] = {
      frame: { x: f.x, y: f.y, w: f.w, h: f.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
      sourceSize: { w: f.w, h: f.h }
    };
  }

  const outPath = path.join(path.dirname(filePath), `${base}.phaser.json`);
  await fs.writeFile(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Converted ${path.basename(filePath)} -> ${path.basename(outPath)} (${Object.keys(out.frames).length} frames)`);
}

async function convertPaths(paths) {
  for (const p of paths) {
    let stat;
    try {
      stat = await fs.stat(p);
    } catch (err) {
      console.error(`Path not found: ${p}`);
      continue;
    }

    if (stat.isDirectory()) {
      const items = await fs.readdir(p);
      for (const it of items) {
        if (/\.json$/i.test(it)) {
          await convertFile(path.join(p, it));
        }
      }
    } else if (stat.isFile()) {
      await convertFile(p);
    } else {
      console.error(`Unsupported path type: ${p}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1] && process.argv[1].endsWith('convert_packer_to_phaser_atlas.js')) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/convert_packer_to_phaser_atlas.js <dir-or-file> [..]');
    process.exit(2);
  }
  convertPaths(args).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
