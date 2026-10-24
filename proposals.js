const proposals = [
  { id: 'aero-panorama', name: 'Frutiger Aero · Panorama', family: 'atlas', key: 'world', world: 'aero' },
  { id: 'aero-cristal', name: 'Frutiger Aero · Cristal', family: 'studies', key: 'look', world: 'aero' },
  { id: 'current', name: 'Corriente', family: 'atlas', key: 'world', world: 'current' },
  { id: 'shards', name: 'Cristales de luz', family: 'particles' },
  { id: 'orbit', name: 'Órbita', family: 'atlas', key: 'world', world: 'orbit' },
  { id: 'vector', name: 'Vector', family: 'studies', key: 'look', world: 'vector' },
  { id: 'vector-cobalto', name: 'Vector · Cobalto', family: 'studies', key: 'look', world: 'vector-cobalto' },
  { id: 'seda', name: 'Seda', family: 'studies', key: 'look', world: 'seda' }
];
const parameterNames = ['density', 'size', 'speed', 'light', 'interaction', 'character', 'grain', 'glassTransparency', 'glassBlur', 'glassSaturation', 'bubbleColor'];
const colorParameterNames = ['background', 'surface', 'text', 'accent', 'particle', 'particleAccent'];
const isColor = value => typeof value === 'string' && /^#?[\da-f]{6}$/i.test(value);
const backdrops = { aurora: 'Cortinas de luz en diagonal, arriba y abajo.', prism: 'Luz solar en coral, lima y azul a través del cristal.', water: 'Luz de piscina, reflejos y profundidad.', glass: 'Un pliegue de cristal atravesado por la luz.', mist: 'Un horizonte abierto, entre cielo y agua.', original: 'Curvas pastel y contornos de la primera versión.' };
const isBackdrop = value => Object.hasOwn(backdrops, value);
const backdropPicker = document.querySelector('#aero-backgrounds');
const backdropButtons = [...document.querySelectorAll('[data-backdrop]')];
const themePicker = document.querySelector('#aurora-theme-picker');
const themeButtons = [...themePicker.querySelectorAll('[data-aurora-theme]')];
const frame = document.querySelector('#proposal-frame');
const status = document.querySelector('#gallery-status');
const error = document.querySelector('#preview-error');
const buttons = [...document.querySelectorAll('[data-proposal]')];
const parameterValues = document.querySelector('#parameter-values');
const parameterLoading = document.querySelector('#parameter-loading');
const adjustButton = document.querySelector('#adjust-parameters');
const header = document.querySelector('.gallery-header');
const galleryPanel = document.querySelector('#gallery-panel');
const toggleButton = document.querySelector('#toggle-proposals');
const mobile = matchMedia('(max-width: 760px), (hover: none) and (pointer: coarse)');
let active;
let paused = false;

function setPanelOpen(open) {
  galleryPanel.hidden = !open;
  header.dataset.expanded = String(open);
  toggleButton.setAttribute('aria-expanded', String(open));
  toggleButton.setAttribute('aria-label', `${open ? 'Ocultar' : 'Mostrar'} las ${proposals.length} propuestas`);
  if (!open && galleryPanel.contains(document.activeElement)) toggleButton.focus({ preventScroll: true });
}
toggleButton.addEventListener('click', () => setPanelOpen(galleryPanel.hidden));
mobile.addEventListener('change', () => setPanelOpen(!mobile.matches));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !galleryPanel.hidden) {
    setPanelOpen(false);
    toggleButton.focus({ preventScroll: true });
  }
});
document.addEventListener('pointerdown', event => {
  if (mobile.matches && !header.contains(event.target)) setPanelOpen(false);
});
setPanelOpen(!mobile.matches);

function choose(id, { initial = false, fromHistory = false } = {}) {
  const proposal = proposals.find(item => item.id === id) || proposals[0];
  active = proposal;
  backdropPicker.hidden = proposal.id !== 'aero-panorama';
  themePicker.hidden = true;
  delete document.body.dataset.aeroTheme;
  document.querySelector('meta[name="theme-color"]').content = '#f6f7f4';
  backdropButtons.forEach(button => { button.disabled = true; });
  const index = proposals.indexOf(proposal);
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.proposal === proposal.id)));
  document.querySelector('#proposal-count').textContent = `${index + 1} / ${proposals.length}`;
  document.querySelector('#proposal-count').setAttribute('aria-label', `Propuesta ${index + 1} de ${proposals.length}`);
  const currentName = document.querySelector('#current-proposal');
  currentName.textContent = proposal.name;
  currentName.title = `Propuesta ${index + 1} de ${proposals.length}: ${proposal.name}`;
  if (mobile.matches) setPanelOpen(false);
  frame.title = `${proposal.name} — propuesta completa`;
  document.title = `Ordzson · ${proposal.name} · ${index + 1} de ${proposals.length}`;
  status.textContent = `Propuesta ${index + 1} de ${proposals.length}: ${proposal.name}.`;
  parameterValues.replaceChildren();
  parameterLoading.hidden = false;
  adjustButton.disabled = true;
  error.hidden = true;
  const url = new URL(location.href);
  if (!initial && !fromHistory) {
    url.search = '';
    url.hash = '';
  }
  url.searchParams.set('proposal', proposal.id);
  const brandmarksURL = new URL('logos/', location.href);
  brandmarksURL.search = url.search;
  brandmarksURL.searchParams.set('series', 'imagegen');
  brandmarksURL.searchParams.set('v', '4');
  document.querySelector('#brandmarks-link').href = brandmarksURL.href;
  if (!fromHistory) history[initial ? 'replaceState' : 'pushState']({ proposal: proposal.id }, '', url);
  const source = new URL(`proposals/${proposal.family}/`, location.href);
  if (proposal.key) source.searchParams.set(proposal.key, proposal.world);
  source.searchParams.set('embed', '1');
  source.searchParams.set('v', '4');
  source.searchParams.set('proposal', proposal.id);
  for (const key of parameterNames) {
    const value = url.searchParams.get(key);
    if (value !== null && value.trim() !== '' && Number.isFinite(Number(value))) source.searchParams.set(key, value);
  }
  if (proposal.id === 'vector-cobalto') {
    for (const key of colorParameterNames) {
      const value = url.searchParams.get(key);
      if (isColor(value)) source.searchParams.set(key, value);
    }
  }
  const preset = url.searchParams.get('preset');
  const backdrop = url.searchParams.get('backdrop');
  if (proposal.id === 'aero-panorama' && isBackdrop(backdrop)) source.searchParams.set('backdrop', backdrop);
  const theme = url.searchParams.get('theme');
  if (proposal.id === 'aero-panorama' && ['light', 'dark'].includes(theme)) source.searchParams.set('theme', theme);
  if (proposal.id === 'shards' && ['prisma', 'cristal', 'flujo'].includes(preset)) source.searchParams.set('preset', preset);
  source.hash = url.hash;
  if (frame.contentWindow.location.href !== source.href) frame.contentWindow.location.replace(source.href);
}

document.querySelector('.proposal-picker').addEventListener('click', event => {
  const button = event.target.closest('button[data-proposal]');
  if (button && button.dataset.proposal !== active.id) choose(button.dataset.proposal);
  else if (button && mobile.matches) setPanelOpen(false);
});
document.querySelector('.proposal-picker').addEventListener('keydown', event => {
  const current = buttons.indexOf(event.target);
  if (current === -1) return;
  let next;
  if (event.key === 'ArrowRight') next = (current + 1) % buttons.length;
  if (event.key === 'ArrowLeft') next = (current + buttons.length - 1) % buttons.length;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = buttons.length - 1;
  if (next === undefined) return;
  event.preventDefault();
  buttons[next].focus();
  if (buttons[next].dataset.proposal !== active.id) choose(buttons[next].dataset.proposal);
});
function step(direction) {
  choose(proposals[(proposals.indexOf(active) + direction + proposals.length) % proposals.length].id);
}
document.querySelector('#previous').addEventListener('click', () => step(-1));
document.querySelector('#next').addEventListener('click', () => step(1));
document.querySelector('#retry').addEventListener('click', () => choose(active.id, { fromHistory: true }));
adjustButton.addEventListener('click', () => {
  if (mobile.matches) setPanelOpen(false);
  reply({ type: 'ordzson:parameters' });
});
window.addEventListener('popstate', () => choose(new URLSearchParams(location.search).get('proposal'), { fromHistory: true }));

function reply(message) {
  frame.contentWindow.postMessage(message, location.origin);
}
backdropPicker.addEventListener('click', event => {
  const button = event.target.closest('button[data-backdrop]');
  if (button) reply({ type: 'ordzson:backdrop', backdrop: button.dataset.backdrop });
});
themePicker.addEventListener('click', event => {
  const button = event.target.closest('[data-aurora-theme]');
  if (button && !button.disabled) reply({ type: 'ordzson:aurora-theme', theme: button.dataset.auroraTheme });
});
window.addEventListener('message', async event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.proposal !== active.id) return;
  const { type, values } = event.data;
  if (mobile.matches && (type === 'ordzson:interact' || type === 'ordzson:scroll' && event.data.y > 24 && event.data.delta > 0)) setPanelOpen(false);
  if (type === 'ordzson:dismiss' && !galleryPanel.hidden) {
    setPanelOpen(false);
    toggleButton.focus({ preventScroll: true });
  }
  if (type === 'ordzson:ready') reply({ type: 'ordzson:motion', paused });
  if (type === 'ordzson:motion-state') paused = Boolean(event.data.paused);
  if (type === 'ordzson:state' && values && typeof values === 'object') {
    const url = new URL(location.href);
    parameterNames.forEach(key => url.searchParams.delete(key));
    colorParameterNames.forEach(key => url.searchParams.delete(key));
    url.searchParams.delete('preset');
    url.searchParams.delete('backdrop');
    url.searchParams.delete('theme');
    if (active.id === 'aero-panorama' && isBackdrop(event.data.backdrop)) {
      url.searchParams.set('backdrop', event.data.backdrop);
      const changed = !document.querySelector(`[data-backdrop="${event.data.backdrop}"][aria-pressed="true"]`);
      backdropButtons.forEach(button => {
        button.disabled = false;
        button.setAttribute('aria-pressed', String(button.dataset.backdrop === event.data.backdrop));
      });
      document.querySelector('#backdrop-description').textContent = backdrops[event.data.backdrop];
      if (changed) status.textContent = `Fondo ${document.querySelector(`[data-backdrop="${event.data.backdrop}"]`).textContent}. ${backdrops[event.data.backdrop]}`;
      themePicker.hidden = event.data.backdrop !== 'aurora';
      if (event.data.backdrop === 'aurora' && ['light', 'dark'].includes(event.data.theme)) {
        const themeChanged = document.body.dataset.aeroTheme !== event.data.theme;
        document.body.dataset.aeroTheme = event.data.theme;
        url.searchParams.set('theme', event.data.theme);
        themeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.auroraTheme === event.data.theme)));
        document.querySelector('meta[name="theme-color"]').content = event.data.theme === 'dark' ? '#03070d' : '#fafdfd';
        if (themeChanged) status.textContent = `Aurora, fondo ${event.data.theme === 'dark' ? 'oscuro cinematográfico' : 'claro futurista'}.`;
      } else {
        delete document.body.dataset.aeroTheme;
        document.querySelector('meta[name="theme-color"]').content = '#f6f7f4';
      }
    }
    for (const key of parameterNames) {
      if (typeof values[key] === 'number' && Number.isFinite(values[key])) url.searchParams.set(key, values[key]);
    }
    if (active.id === 'vector-cobalto') {
      for (const key of colorParameterNames) {
        if (isColor(values[key])) url.searchParams.set(key, values[key].replace('#', '').toLowerCase());
      }
    }
    if (active.id === 'shards' && ['prisma', 'cristal', 'flujo'].includes(event.data.preset)) url.searchParams.set('preset', event.data.preset);
    history.replaceState({ proposal: active.id }, '', url);
    const brandmarksURL = new URL('logos/', location.href);
    brandmarksURL.search = url.search;
    brandmarksURL.searchParams.set('series', 'imagegen');
    brandmarksURL.searchParams.set('v', '4');
    document.querySelector('#brandmarks-link').href = brandmarksURL.href;
    const entries = Array.isArray(event.data.entries) ? event.data.entries : [];
    parameterValues.replaceChildren(...entries.filter(entry => !colorParameterNames.includes(entry.key)).map(entry => {
      const item = document.createElement('div');
      const label = document.createElement('dt');
      const value = document.createElement('dd');
      label.textContent = entry.label;
      value.textContent = entry.value;
      item.dataset.parameter = entry.key;
      item.append(label, value);
      return item;
    }));
    const colors = entries.filter(entry => colorParameterNames.includes(entry.key) && isColor(values[entry.key]));
    if (colors.length) {
      const item = document.createElement('div');
      const label = document.createElement('dt');
      label.textContent = 'Paleta';
      const palette = document.createElement('dd');
      palette.className = 'parameter-palette';
      for (const entry of colors) {
        const swatch = document.createElement('span');
        swatch.className = 'parameter-swatch';
        swatch.style.backgroundColor = `#${values[entry.key].replace('#', '')}`;
        swatch.title = `${entry.label}: ${entry.value}`;
        const description = document.createElement('span');
        description.className = 'sr-only';
        description.textContent = swatch.title;
        swatch.append(description); palette.append(swatch);
      }
      item.dataset.parameter = 'palette';
      item.append(label, palette); parameterValues.append(item);
    }
    parameterLoading.hidden = true;
    adjustButton.disabled = false;
  }
  if (type === 'ordzson:share') {
    try {
      await navigator.clipboard.writeText(location.href);
      reply({ type: 'ordzson:feedback', text: 'Enlace copiado con esta propuesta y tus ajustes.' });
    } catch {
      reply({ type: 'ordzson:feedback', text: 'Tus ajustes están en la dirección. Puedes copiarla desde el navegador.' });
    }
  }
});
frame.addEventListener('load', () => {
  try {
    const child = frame.contentWindow;
    error.hidden = Boolean(child.particleAtlas || child.particleStudies || child.particlePreview);
  } catch { error.hidden = false; }
});
choose(new URLSearchParams(location.search).get('proposal'), { initial: true });
