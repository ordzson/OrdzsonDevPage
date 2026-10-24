import { marks, boldMarks, svgFor } from './marks.js?v=4';
import { imageMarks } from './image-marks.js?v=4';

const params = new URLSearchParams(location.search);
const selected = marks.find(mark => mark.id === params.get('proposal'));
let mode = params.get('mode') === 'mono' ? 'mono' : 'color';
let series = ['original', 'bold', 'compare'].includes(params.get('series')) ? params.get('series') : 'imagegen';
let visibleMarks = [];
const grid = document.querySelector('#brandmarks');
const dialog = document.querySelector('.mark-dialog');
const downloadIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/></svg>';
const arrowIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>';
const collections = {
  imagegen: ['Ocho formas de decir Z.', 'Líquida, tallada, pintada, refractada. Abre cada marca para verla de cerca.'],
  bold: ['Más gesto. Más carácter.', 'La segunda serie: vacíos, fracturas y siluetas con más tensión.'],
  original: ['Las primeras ocho.', 'La primera serie, con sus geometrías y descargas originales.'],
  compare: ['Tres lecturas de cada mundo.', 'Imagegen, más valiente y original: cada grupo de tres comparte la misma paleta.']
};

function proposalURL(mark) {
  const url = new URL('../', location.href);
  if (selected?.id === (mark.proposalId || mark.id)) {
    for (const [key, value] of params) if (!['mode', 'series', 'v'].includes(key)) url.searchParams.set(key, value);
  }
  url.searchParams.set('proposal', mark.proposalId || mark.id);
  return url.href;
}

function renderSeries() {
  visibleMarks = series === 'original' ? marks : series === 'bold' ? boldMarks : series === 'compare' ? marks.flatMap((mark, index) => [imageMarks[index], boldMarks[index], mark]) : imageMarks;
  grid.dataset.series = series;
  grid.innerHTML = visibleMarks.map((mark, index) => `<article class="mark-card${mark.raster ? ' raster-card' : ''}" id="${mark.id}" aria-labelledby="title-${mark.id}" style="--mark-ground:${mark.ground};--mark-ink:${mark.ink}"${selected?.id === (mark.proposalId || mark.id) ? ' data-selected="true"' : ''}>
    <div class="mark-stage">${mark.raster ? `<button type="button" class="mark-preview" data-enlarge="${mark.id}" aria-label="Ampliar ${mark.concept}, ${mark.name}"><span class="hero-mark"><img src="${mark.src}" width="1254" height="1254" alt="Brandmark Z · ${mark.concept}"${index > 3 ? ' loading="lazy"' : ''}></span></button>` : `<div class="hero-mark">${svgFor(mark)}</div>`}<div class="stage-caption"><span>${mark.raster ? mark.language : mark.concept}</span><span>${mark.raster ? 'PNG · Ampliar' : mark.proposalId ? 'Más valiente' : 'Original'}</span></div></div>
    <div class="mark-info"><p class="mark-name">${mark.name}</p><h3 id="title-${mark.id}">${mark.concept}</h3><p class="mark-description">${mark.description}</p>
      <div class="specimens" aria-label="${mark.concept}: pruebas de silueta a 16, 24 y 40 píxeles y en blanco sobre oscuro"><div class="small-marks">${[16, 24, 40].map(size => `<img src="${mark.raster ? mark.src : `assets/${mark.id}-mono.svg`}" width="${size}" height="${size}" alt="" loading="lazy">`).join('')}</div><span class="specimen-label" aria-hidden="true">16 · 24 · 40 px</span><div class="inverse-sample"><img src="${mark.raster ? mark.src : `assets/${mark.id}-white.svg`}" width="29" height="29" alt="" loading="lazy"></div></div>
      <div class="export-links"><a data-download href="${mark.raster ? mark.src : `assets/${mark.id}.svg`}" download aria-label="Descargar ${mark.raster ? 'PNG' : 'SVG'} de ${mark.concept}">${downloadIcon}<span>Descargar ${mark.raster ? 'PNG' : 'SVG'}</span></a><a href="${proposalURL(mark)}" aria-label="Ver propuesta web ${mark.name}">Ver propuesta ${arrowIcon}</a></div>
    </div>
  </article>`).join('');
  document.querySelectorAll('button[data-series]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.series === series)));
  document.querySelector('#collection-heading').textContent = collections[series][0];
  document.querySelector('#collection-description').textContent = collections[series][1];
  document.querySelector('#format-note').hidden = !['imagegen', 'compare'].includes(series);
  grid.setAttribute('aria-label', `${visibleMarks.length} brandmarks Z · ${series === 'compare' ? 'comparación de tres series' : series === 'imagegen' ? 'creados con imagegen' : series === 'original' ? 'originales' : 'más valientes'}`);
  document.querySelector('[data-mode="mono"]').textContent = ['imagegen', 'compare'].includes(series) ? 'Silueta' : 'Una tinta';
  setMode(mode, false);
}

if (selected) document.querySelector('#back-to-proposals').href = proposalURL(selected);

function syncURL() {
  const url = new URL(location.href);
  if (mode === 'mono') url.searchParams.set('mode', mode);
  else url.searchParams.delete('mode');
  url.searchParams.set('series', series);
  if (url.hash && !document.getElementById(url.hash.slice(1))) url.hash = '';
  history.replaceState(null, '', url);
  document.querySelector('#view-status').textContent = `${visibleMarks.length} logos en ${mode === 'mono' ? 'silueta' : 'color'}. ${['imagegen', 'compare'].includes(series) ? 'Las descargas PNG conservan el color original.' : 'Las descargas SVG corresponden a esta vista.'}`;
}

function setMode(next, updateURL = true) {
  mode = next;
  document.querySelectorAll('button[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  visibleMarks.forEach(mark => {
    const card = document.getElementById(mark.id);
    card.dataset.mode = mode;
    if (!mark.raster) card.querySelector('.hero-mark').innerHTML = svgFor(mark, mode);
    const download = card.querySelector('[data-download]');
    const suffix = !mark.raster && mode === 'mono' ? '-mono' : '';
    const extension = mark.raster ? 'png' : 'svg';
    download.href = mark.raster ? mark.src : `assets/${mark.id}${suffix}.svg`;
    download.download = `ordzson-z-${mark.id}${suffix}.${extension}`;
    download.setAttribute('aria-label', `Descargar ${extension.toUpperCase()} ${!mark.raster && mode === 'mono' ? 'a una tinta' : 'en color'} de ${mark.concept}, ${mark.name}`);
  });
  if (updateURL) syncURL();
}

grid.addEventListener('click', event => {
  const button = event.target.closest('[data-enlarge]');
  if (!button) return;
  const mark = imageMarks.find(item => item.id === button.dataset.enlarge);
  document.querySelector('#detail-title').textContent = `${mark.concept} · ${mark.name}`;
  const preview = document.querySelector('#detail-image');
  preview.src = mark.src;
  preview.alt = `Brandmark Z · ${mark.concept}, vista ampliada`;
  dialog.style.setProperty('--mark-ground', mark.ground);
  dialog.dataset.mode = mode;
  document.querySelector('#detail-description').textContent = `${mark.description} PNG transparente en color.`;
  document.querySelector('#detail-download').href = mark.src;
  document.querySelector('#detail-download').download = `ordzson-z-${mark.id}.png`;
  dialog.showModal();
});
document.querySelector('.detail-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }
});
document.querySelector('.view-switch').addEventListener('click', event => {
  const button = event.target.closest('button[data-mode]');
  if (button) setMode(button.dataset.mode);
});
document.querySelector('.series-switch').addEventListener('click', event => {
  const button = event.target.closest('button[data-series]');
  if (!button) return;
  series = button.dataset.series;
  renderSeries();
  syncURL();
});
renderSeries();
