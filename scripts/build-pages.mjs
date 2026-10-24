import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
// An explicit list keeps the archived proposals and galleries out of Pages.
const files = [
  'index.html',
  'proposals/embedded.css',
  ...[
    'app.js', 'field.js', 'aero-physics.js', 'aero-lenses.js',
    'aero-bubble-sprites.js', 'aero-backdrops.js', 'aero-aurora.js',
    'style.css', 'aero-glass.css', 'aero-aurora.css',
    'assets/manrope-regular.ttf', 'assets/manrope-medium.ttf',
    'assets/OFL.txt', 'assets/NOTO-LICENSE.txt',
    'assets/bamboo.png', 'assets/lirios.png', 'assets/aero-contours.svg',
    'assets/bubble-pop-1.wav', 'assets/bubble-pop-2.wav', 'assets/bubble-pop-3.wav'
  ].map(file => `proposals/atlas/${file}`)
];

await rm(output, { recursive: true, force: true });
for (const file of files) {
  const target = new URL(file, output);
  await mkdir(dirname(fileURLToPath(target)), { recursive: true });
  await copyFile(new URL(file, root), target);
}
await writeFile(new URL('.nojekyll', output), '');
console.log(`GitHub Pages: Frutiger Aero · Panorama (${files.length} archivos) → dist/`);
