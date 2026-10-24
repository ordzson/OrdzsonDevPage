import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { marks, boldMarks, allMarks, svgFor } from './marks.js';
import { execFileSync } from 'node:child_process';

const folder = new URL('./assets/', import.meta.url);
await mkdir(folder, { recursive: true });
for (const mark of allMarks) {
  for (const variant of ['color', 'mono', 'white']) {
    const suffix = variant === 'color' ? '' : `-${variant}`;
    await writeFile(new URL(`${mark.id}${suffix}.svg`, folder), svgFor(mark, variant) + '\n');
  }
}

const panels = marks.map((mark, index) => {
  const x = 48 + index % 4 * 426;
  const y = 180 + Math.floor(index / 4) * 430;
  return `<g transform="translate(${x} ${y})"><rect width="402" height="306" fill="${mark.ground}"/><svg x="91" y="35" width="220" height="220" viewBox="0 0 220 220">${svgFor(mark, 'color', { label: false }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg><g font-family="sans-serif" fill="#253331"><text x="0" y="340" font-size="16">${mark.name}</text><text x="0" y="373" font-size="25">${mark.concept}</text></g></g>`;
}).join('');
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1080" viewBox="0 0 1800 1080" role="img" aria-label="Ocho propuestas de brandmarks Z para Ordzson"><title>Ordzson · Una Z para cada mundo</title><rect width="1800" height="1080" fill="#f6f7f4"/><g font-family="sans-serif" fill="#253331"><text x="48" y="65" font-size="24">ordzson.</text><text x="48" y="124" font-size="38">Una Z para cada mundo.</text><text x="1752" y="66" font-size="17" text-anchor="end">Ocho exploraciones de identidad</text></g>${panels}<text x="48" y="1050" font-family="sans-serif" font-size="14" fill="#52605a">Geometrías originales · Una propuesta por alternativa web · SVG con fondo transparente</text></svg>`;
await writeFile(new URL('ordzson-brandmarks-lamina.svg', folder), sheet + '\n');

// Keep the original sheet byte-for-byte; the second series has its own sheet.
const boldPanels = boldMarks.map((mark, index) => {
  const x = 48 + index % 4 * 426;
  const y = 180 + Math.floor(index / 4) * 430;
  return `<g transform="translate(${x} ${y})"><rect width="402" height="306" fill="${mark.ground}"/><svg x="91" y="35" width="220" height="220" viewBox="0 0 220 220">${svgFor(mark, 'color', { label: false }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg><g font-family="sans-serif" fill="#253331"><text x="0" y="340" font-size="16">${mark.name}</text><text x="0" y="373" font-size="25">${mark.concept}</text></g></g>`;
}).join('');
const boldSheet = sheet.replace(panels, boldPanels)
  .replace('Una Z para cada mundo</title>', 'Brandmarks Z · Más valientes</title>')
  .replace('Una Z para cada mundo.</text>', 'Más gesto. Más carácter.</text>')
  .replace('Ocho exploraciones de identidad', 'Ocho alternativas nuevas');
await writeFile(new URL('ordzson-brandmarks-valientes-lamina.svg', folder), boldSheet + '\n');
execFileSync('python3', [fileURLToPath(new URL('./package-assets.py', import.meta.url))], { stdio: 'inherit' });
console.log('48 logos y dos láminas SVG disponibles; colección original conservada.');
