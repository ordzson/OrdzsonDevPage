import { ParticleField } from './field.js';

const icons = {
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>',
  diagonal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 18 12-12M6 6h12v12"/></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V4m-6 6 6-6 6 6"/></svg>'
};
const worlds = {
  orbit: { name: 'Órbita', subtitle: 'Polvo estelar · perspectiva orbital', detail: 'Una órbita de luz. Un espacio para tus ideas.', defaults: { density: 100, size: 65, speed: 38, light: 96, interaction: 100, character: 50 }, character: 'Inclinación', labels: ['Dispersa', 'Densa'], color: '#111719' },
  halation: { name: 'Halation', subtitle: 'Bokeh fotográfico · luz desenfocada', detail: 'Luz, profundidad y una mirada diferente.', defaults: { density: 35, size: 72, speed: 18, light: 67, interaction: 25, character: 68 }, character: 'Desenfoque', labels: ['Pocas luces', 'Más luces'], color: '#f2ede4' },
  current: { name: 'Corriente', subtitle: 'Nube de puntos · ondas continuas', detail: 'Ideas en movimiento. Desarrollo con dirección.', defaults: { density: 95, size: 38, speed: 17, light: 80, interaction: 100, character: 100 }, character: 'Amplitud', labels: ['Ligera', 'Envolvente'], color: '#e9f3ed' },
  aero: { name: 'Frutiger Aero', subtitle: 'Burbujas de cristal · naturaleza y brillo', detail: 'El futuro se siente bien.', defaults: { density: 42, size: 68, speed: 45, light: 89, interaction: 35, character: 84 }, character: 'Reflejos', labels: ['Despejado', 'Burbujeante'], color: '#d9f4ff' }
};
const site = document.querySelector('#site');
const settings = document.querySelector('#settings');
const controls = document.querySelector('#sliders');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const storageKey = 'ordzson-proposals-atlas-v2';
let stored = {};
try { stored = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch {}
let active, field, paused = false;

function readValues(world) {
  const values = { ...worlds[world].defaults };
  const previous = stored[world];
  if (previous && typeof previous === 'object') for (const key of Object.keys(values)) {
    if (typeof previous[key] === 'number' && Number.isFinite(previous[key])) values[key] = Math.max(0, Math.min(100, previous[key]));
  }
  return values;
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(stored)); } catch {}
}
const header = () => `<header class="site-header"><a class="wordmark" href="#contenido" aria-label="Ordzson, inicio">ordzson<span>.</span></a><nav aria-label="Principal"><a href="#trabajo">Trabajo</a><a href="#servicios">Servicios</a><a class="nav-contact" href="#contacto">Hablemos ${icons.diagonal}</a></nav></header>`;
const offer = '<p class="offer">Páginas web, tiendas en línea y sistemas a medida.<br> Un único responsable, trato directo.</p>';
const cta = (label = 'Hablemos de tu proyecto') => `<a class="cta" href="#contacto"><span>${label}</span>${icons.arrow}</a>`;
const work = (name, kind, url, image, development = false) => `<article class="work-item ${development ? 'work-lirios' : 'work-bamboo'}"><a class="project-visual" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="Visitar ${name}, abre en otra pestaña"><div class="window-bar" aria-hidden="true"><span class="window-dots"><i></i><i></i><i></i></span><span>${development ? 'ordzson.github.io/Lirios' : 'bamboo.salon'}</span></div><img src="assets/${image}" width="1440" height="1000" loading="lazy" alt="${development ? 'Lirios: flores artesanales y ramos tejidos en un catálogo de tonos cálidos.' : 'Bamboo Salon: página de belleza profesional con acceso a citas y tienda en línea.'}"></a><div class="project-caption"><div><h3>${name}</h3><p>${kind}${development ? ' <span class="development">En desarrollo</span>' : ''}</p></div><a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="Ver ${name}, abre en otra pestaña">Ver proyecto ${icons.diagonal}</a></div></article>`;
const projects = () => work('Bamboo Salon', 'Citas y tienda en línea', 'https://www.bamboo.salon/', 'bamboo.png') + work('Lirios', 'Catálogo de flores artesanales', 'https://ordzson.github.io/Lirios/', 'lirios.png', true);
const process = () => '<ol class="process" aria-label="Proceso de trabajo"><li><span>01</span>Requerimientos</li><li><span>02</span>Diseño</li><li><span>03</span>Desarrollo</li><li><span>04</span>Implementación</li></ol>';
const services = () => `<section class="services" id="servicios"><div class="services-heading"><h2>Soluciones web<br>para tu negocio.</h2><p>Un único responsable.<br>De la primera idea a la implementación.</p></div><ul><li><span>Páginas web</span>${icons.diagonal}</li><li><span>Tiendas en línea</span>${icons.diagonal}</li><li><span>Sistemas a medida</span>${icons.diagonal}</li></ul></section>`;
const footer = () => `<footer id="contacto"><div class="footer-main"><h2>Hablemos de<br>tu proyecto<span>.</span></h2><p>Un único responsable,<br>trato directo.</p></div><div class="footer-bottom"><a class="wordmark" href="#contenido">ordzson<span>.</span></a><a class="back-top" href="#contenido">Volver arriba ${icons.up}</a></div></footer>`;
const canvas = '<canvas id="field" aria-hidden="true"></canvas>';

function markup(world) {
  if (world === 'orbit') return `${header()}<main id="contenido"><section class="hero orbit-hero">${canvas}<div class="hero-copy"><h1>Tu proyecto web,<br>de principio<br>a fin<span>.</span></h1>${offer}${cta()}</div><div class="hero-caption"><span>${worlds.orbit.detail}</span><a href="#trabajo">Explorar el trabajo ${icons.arrow}</a></div></section><section class="work" id="trabajo"><div class="section-heading"><h2>Trabajo en perspectiva.</h2><p>Dos proyectos. Dos universos.</p></div><div class="work-grid">${projects()}</div></section><div class="process-wrap">${process()}</div>${services()}</main>${footer()}`;
  if (world === 'halation') return `${header()}<main id="contenido"><section class="hero halation-hero"><div class="photo-field">${canvas}<span class="photo-caption">Luz que se convierte en forma.</span></div><div class="hero-copy"><h1>Tu proyecto web,<br><em>de principio<br>a fin.</em></h1>${offer}${cta('Démosle forma')}</div><div class="hero-caption"><span>${worlds.halation.detail}</span><a href="#trabajo">Ver proyectos ${icons.arrow}</a></div></section><section class="work" id="trabajo"><div class="section-heading"><h2>Hecho con intención.</h2><p>Una mirada al trabajo.</p></div><div class="work-grid">${projects()}</div></section>${services()}<div class="process-wrap">${process()}</div></main>${footer()}`;
  if (world === 'current') return `${header()}<main id="contenido"><section class="hero current-hero">${canvas}<div class="hero-copy"><h1>Tu proyecto web.<br>De principio<br>a fin<span>.</span></h1><div class="current-offer">${offer}${cta('Pongamos tu idea en movimiento')}</div></div><div class="hero-caption"><span>${worlds.current.detail}</span><a href="#trabajo">Sigue la corriente ${icons.arrow}</a></div></section><section class="work" id="trabajo"><div class="section-heading"><h2>Ideas que toman forma.</h2><p>Desarrollo web, en la práctica.</p></div><div class="work-grid">${projects()}</div></section><div class="process-wrap">${process()}</div>${services()}</main>${footer()}`;
  return `${header()}<main id="contenido"><section class="hero aero-hero"><div class="aero-landscape" role="img" aria-label="Paisaje conceptual Frutiger Aero: cielo azul, pradera verde, agua turquesa y esferas de cristal."></div>${canvas}<div class="hero-copy"><h1>Tu proyecto web,<br> con un futuro brillante.</h1>${offer}${cta('Hagámoslo realidad')}</div><div class="hero-caption"><span>${worlds.aero.detail}</span><a href="#trabajo">Descubre el trabajo ${icons.arrow}</a></div></section><section class="work" id="trabajo"><div class="section-heading"><h2>Buenas ideas.<br>Un mundo de posibilidades.</h2><p>Proyectos que puedes explorar.</p></div><div class="work-grid">${projects()}</div></section>${services()}<div class="process-wrap">${process()}</div></main>${footer()}`;
}

function updatePause() {
  const stop = paused || reduced.matches;
  const button = document.querySelector('#pause');
  button.setAttribute('aria-pressed', String(stop));
  button.setAttribute('aria-label', reduced.matches ? 'Movimiento reducido activado' : stop ? 'Reanudar partículas' : 'Pausar partículas');
  button.disabled = reduced.matches;
  document.querySelector('#motion-note').textContent = reduced.matches ? 'Movimiento reducido: composición estática. Puedes ajustar sus parámetros.' : 'Los ajustes se guardan para esta propuesta.';
  if (field) field.setPaused(stop);
}
function renderSliders() {
  const config = worlds[active], values = stored[active];
  document.querySelector('#settings-title').textContent = config.name;
  document.querySelector('#settings-description').textContent = config.subtitle;
  const labels = { density: 'Densidad', size: 'Tamaño', speed: 'Velocidad', light: 'Intensidad', interaction: 'Respuesta al cursor', character: config.character };
  controls.innerHTML = Object.entries(labels).map(([key, label]) => `<label class="parameter" for="param-${key}"><span>${label}</span><output id="value-${key}" for="param-${key}">${values[key]}</output><input id="param-${key}" name="${key}" type="range" min="0" max="100" step="1" value="${values[key]}"></label>`).join('');
  document.querySelector('#feedback').textContent = '';
}
function setWorld(world, initial = false) {
  if (!worlds[world]) world = 'orbit';
  field?.destroy();
  active = world;
  stored[world] = readValues(world);
  document.body.dataset.world = world;
  document.querySelector('meta[name="theme-color"]').content = worlds[world].color;
  document.title = `Ordzson · ${worlds[world].name}`;
  for (const button of document.querySelectorAll('.world-picker button')) button.setAttribute('aria-pressed', String(button.dataset.world === world));
  site.innerHTML = markup(world);
  renderSliders();
  field = new ParticleField(document.querySelector('#field'), world, stored[world]);
  updatePause();
  if (!initial) {
    const url = new URL(location.href); url.search = ''; url.searchParams.set('world', world); url.hash = '';
    history.pushState({ world }, '', url);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}
document.querySelector('.world-picker').addEventListener('click', event => {
  const button = event.target.closest('button[data-world]');
  if (button && button.dataset.world !== active) setWorld(button.dataset.world);
});
controls.addEventListener('input', event => {
  const input = event.target;
  if (!input.matches('input[type="range"]')) return;
  stored[active][input.name] = Number(input.value);
  document.querySelector(`#value-${input.name}`).value = input.value;
  field.update(stored[active]); persist();
});
controls.addEventListener('submit', event => event.preventDefault());
function toggleSettings(show) {
  settings.hidden = !show;
  document.querySelector('#parameters').setAttribute('aria-expanded', String(show));
}
document.querySelector('#parameters').addEventListener('click', () => toggleSettings(settings.hidden));
document.querySelector('#close-settings').addEventListener('click', () => { toggleSettings(false); document.querySelector('#parameters').focus(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !settings.hidden) { toggleSettings(false); document.querySelector('#parameters').focus(); } });
document.querySelector('#pause').addEventListener('click', () => { paused = !paused; updatePause(); });
document.querySelector('#reset').addEventListener('click', () => {
  stored[active] = { ...worlds[active].defaults }; field.update(stored[active]); renderSliders(); persist();
  document.querySelector('#feedback').textContent = 'Parámetros originales restaurados.';
});
document.querySelector('#share').addEventListener('click', async () => {
  if (window.parent !== window) { window.parent.postMessage({ type: 'ordzson:share', proposal: new URLSearchParams(location.search).get('proposal') }, location.origin); return; }
  const url = new URL(location.href); url.search = ''; url.hash = '';
  url.searchParams.set('world', active);
  for (const [key, value] of Object.entries(stored[active])) url.searchParams.set(key, value);
  try {
    await navigator.clipboard.writeText(url.href);
    document.querySelector('#feedback').textContent = 'Enlace copiado con estos parámetros.';
  } catch {
    history.replaceState({ world: active }, '', url);
    document.querySelector('#feedback').textContent = 'Parámetros añadidos a la dirección. Puedes copiarla desde el navegador.';
  }
});
reduced.addEventListener('change', updatePause);
function loadLocation() {
  const params = new URLSearchParams(location.search), world = worlds[params.get('world')] ? params.get('world') : 'orbit';
  stored[world] = readValues(world);
  for (const key of Object.keys(worlds[world].defaults)) {
    const value = params.get(key);
    if (value !== null && value.trim() !== '' && Number.isFinite(Number(value))) stored[world][key] = Math.max(0, Math.min(100, Math.round(Number(value))));
  }
  setWorld(world, true);
}
window.addEventListener('popstate', loadLocation);
loadLocation();
window.particleAtlas = { get state() { return { world: active, params: { ...stored[active] }, ...field.state }; } };
