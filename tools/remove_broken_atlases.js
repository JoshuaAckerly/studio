const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'public', 'games', 'noteleks', 'sprites');
const targets = [
  'skeleton_idle.webp',
  'skeleton_idle.json',
  'skeleton_idle.phaser.json',
  'skeleton_walk.webp',
  'skeleton_walk.json',
  'skeleton_walk.phaser.json',
  'skeleton_run.webp',
  'skeleton_run.json',
  'skeleton_run.phaser.json',
  'skeleton_jumpattack.webp',
  'skeleton_jumpattack.json',
  'skeleton_jumpattack.phaser.json'
];

let removed = 0;
for (const t of targets) {
  const p = path.join(base, t);
  try {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('Removed', p);
      removed++;
    } else {
      console.log('Not found, skipping', p);
    }
  } catch (e) {
    console.error('Failed to remove', p, e.message);
  }
}
console.log('Done. Removed count =', removed);
