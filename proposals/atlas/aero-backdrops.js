import { AeroAurora } from './aero-aurora.js?v=1';

// Historical studies remain static; Aurora owns its independent light curtains.
export const aeroBackdrops = {
  aurora: { name: 'Aurora', detail: 'Cortinas de luz en diagonal, arriba y abajo.' },
  prism: { name: 'Prisma', detail: 'Luz solar en coral, lima y azul a través del cristal.' },
  water: { name: 'Agua', detail: 'Luz de piscina, reflejos y profundidad.' },
  glass: { name: 'Vidrio', detail: 'Un pliegue de cristal atravesado por la luz.' },
  mist: { name: 'Bruma', detail: 'Un horizonte abierto, entre cielo y agua.' },
  original: { name: 'Original', detail: 'Curvas pastel y contornos de la primera versión.' }
};
const storageKey = 'ordzson-panorama-backdrop-v3';
const themeKey = 'ordzson-panorama-aurora-theme-v1';
const valid = value => Object.hasOwn(aeroBackdrops, value);
const clamp = value => Math.max(0, Math.min(1, value));
const mix = (a, b, t) => a + (b - a) * clamp(t);
const bell = (value, width) => Math.exp(-value * value / width);
const hash = (x, y) => {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// Distances between refracted wave cells form the water's caustic network.
function caustic(x, y, seeds) {
  const gx = Math.floor(x), gy = Math.floor(y);
  let first = 100, second = 100;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const px = gx + i, py = gy + j;
    const index = ((py + 4) * seeds.columns + px + 4) * 2;
    const dx = px + seeds.points[index] - x;
    const dy = py + seeds.points[index + 1] - y;
    const d = dx * dx + dy * dy;
    if (d < first) { second = first; first = d; }
    else if (d < second) second = d;
  }
  return Math.exp(-(Math.sqrt(second) - Math.sqrt(first)) * 32);
}

// Broad optical planes, rather than a landscape: the seams give the bubbles
// something real to refract. Native gradients keep this plate inexpensive.
function paintPrism(ctx, width, height) {
  ctx.save();
  ctx.scale(width, height);
  const gradient = (from, to, stops) => {
    const fill = ctx.createLinearGradient(...from, ...to);
    for (const [at, color] of stops) fill.addColorStop(at, color);
    return fill;
  };
  ctx.fillStyle = gradient([0, 0], [1, .85], [[0, '#ffe3a6'], [.4, '#f3fbdc'], [.72, '#c9ecff'], [1, '#aba5f5']]);
  ctx.fillRect(0, 0, 1, 1);

  // A coral pane enters from the upper left, catching a warm amber edge.
  ctx.beginPath();
  ctx.moveTo(-.2, -.1); ctx.lineTo(.30, -.1);
  ctx.bezierCurveTo(.20, .24, .05, .48, -.16, .72);
  ctx.closePath();
  ctx.fillStyle = gradient([0, .05], [.30, .4], [[0, '#ff8a80'], [.5, '#ffb56b'], [1, '#ffeaa199']]);
  ctx.fill();

  // The main spectrum passes diagonally through the lower foreground.
  ctx.beginPath();
  ctx.moveTo(-.15, .42);
  ctx.bezierCurveTo(.24, .65, .62, .93, 1.15, 1.02);
  ctx.lineTo(1.1, 1.25); ctx.lineTo(-.15, 1.25); ctx.closePath();
  ctx.fillStyle = gradient([.05, .72], [.96, .99], [[0, '#c6ee4d'], [.27, '#d9f56b'], [.52, '#83dfaf'], [.75, '#53bfe9'], [1, '#8585ed']]);
  ctx.fill();

  // A blue glass face crosses the spectrum, with a bright refracting edge.
  ctx.beginPath();
  ctx.moveTo(1.14, -.16);
  ctx.bezierCurveTo(.93, .19, .89, .63, .56, 1.18);
  ctx.lineTo(1.2, 1.18); ctx.closePath();
  ctx.fillStyle = gradient([.66, .5], [1.15, .7], [[0, '#b8ecff00'], [.24, '#b0e4ff80'], [.64, '#83b0f5bf'], [1, '#ad91f4']]);
  ctx.fill();

  // Sunlight fans through the planes; its clear centre protects the real copy.
  const light = ctx.createRadialGradient(.48, .35, .03, .48, .35, .61);
  light.addColorStop(0, '#fffff5f0');
  light.addColorStop(.48, '#ffffeeae');
  light.addColorStop(1, '#fffde300');
  ctx.fillStyle = light; ctx.fillRect(0, 0, 1, 1);

  // Tight light/dark pairs read as glass thickness, never as water ripples.
  ctx.lineWidth = 1.2 / width;
  ctx.beginPath(); ctx.moveTo(.30, -.1);
  ctx.bezierCurveTo(.20, .24, .05, .48, -.16, .72);
  ctx.strokeStyle = '#fffbeac7'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-.15, .42);
  ctx.bezierCurveTo(.24, .65, .62, .93, 1.15, 1.02);
  ctx.strokeStyle = '#fffff0cc'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1.14, -.16);
  ctx.bezierCurveTo(.93, .19, .89, .63, .56, 1.18);
  ctx.strokeStyle = '#faffffe0'; ctx.stroke();
  ctx.restore();
}

function paint(canvas, look) {
  const rect = canvas.getBoundingClientRect();
  // A bounded optical plate stays soft at high DPR and avoids a full-screen GPU.
  const scale = Math.min(1, 1100 / rect.width, 850 / rect.height);
  const width = Math.max(1, Math.round(rect.width * scale));
  const height = Math.max(1, Math.round(rect.height * scale));
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  if (look === 'prism') { paintPrism(ctx, width, height); return; }
  const plate = ctx.createImageData(width, height);
  const pixels = plate.data, aspect = rect.width / rect.height;
  const seeds = { columns: Math.ceil(Math.max(3.2, aspect * 4.8)) + 9 };
  if (look === 'water') {
    seeds.points = new Float32Array(seeds.columns * 15 * 2);
    for (let j = -4; j <= 10; j++) for (let i = -4; i < seeds.columns - 4; i++) {
      const index = ((j + 4) * seeds.columns + i + 4) * 2;
      seeds.points[index] = hash(i, j); seeds.points[index + 1] = hash(i + 19, j + 47);
    }
  }
  for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) {
    const x = px / width, y = py / height;
    const side = bell((x - .5) * Math.min(aspect, 1.7), .18);
    let r, g, b;
    if (look === 'water') {
      const depth = clamp((y - .25) / .75);
      const wave = Math.sin(x * 7 + y * 4) * .04 + Math.sin(y * 11 - x * 3) * .025;
      const shade = clamp(depth * .9 + (1 - side) * .32 + wave);
      const lagoon = clamp(1 - x * 1.4);
      r = mix(193, 12, shade); g = mix(246, mix(133, 183, lagoon), shade); b = mix(251, mix(228, 155, lagoon), shade);
      const u = x * Math.max(3.2, aspect * 4.8) + Math.sin(y * 9 + x * 3) * .7 + Math.sin(y * 19 + x * 7) * .16;
      const v = y * 5.3 + Math.sin(x * 10 - y * 4) * .6 + Math.sin(x * 19 + y * 13) * .12;
      const light = caustic(u, v, seeds) * clamp((y - .35) * 2) * .58;
      r = mix(r, 244, light); g = mix(g, 255, light); b = mix(b, 245, light);
      const shaft = bell(x - .82 + y * .27, .017) * .35;
      r = mix(r, 255, shaft); g = mix(g, 249, shaft); b = mix(b, 190, shaft);
      // Clear light behind the real copy, detailed water in the foreground.
      const clear = bell((y - .3), .065) * side * .76;
      r = mix(r, 237, clear); g = mix(g, 255, clear); b = mix(b, 245, clear);
    } else if (look === 'glass') {
      const cool = clamp(y * .45 + x * .12);
      r = mix(235, 155, cool); g = mix(238, 184, cool); b = mix(255, 250, cool);
      const edge = .85 - .19 * Math.sin(x * 2.6 - .55);
      const d = y - edge;
      const body = bell(d - .09, .018) * .7;
      r = mix(r, 48, body); g = mix(g, 113, body); b = mix(b, 232, body);
      const shadow = bell(d - .012, .00018) * .3;
      r = mix(r, 35, shadow); g = mix(g, 75, shadow); b = mix(b, 169, shadow);
      const rim = bell(d + .008, .000035) * .95;
      r = mix(r, 255, rim); g = mix(g, 255, rim); b = mix(b, 252, rim);
      const narrow = aspect < .8;
      const curl = x - (narrow ? 1.08 - .07 * Math.sin(y * 3.8) : 1.02 - .13 * Math.sin(y * 3.8));
      const blue = bell(curl, narrow ? .0015 : .004) * .85;
      r = mix(r, 29, blue); g = mix(g, 98, blue); b = mix(b, 236, blue);
      const lip = bell(curl + (narrow ? .04 : .065), .000045) * .9;
      r = mix(r, 255, lip); g = mix(g, 255, lip); b = mix(b, 255, lip);
      const warm = bell(x + y * .25 - .08, .033) * .76;
      r = mix(r, 255, warm); g = mix(g, 178, warm); b = mix(b, 87, warm);
    } else {
      const horizon = .66;
      const air = clamp(y / horizon);
      r = mix(105, 255, air); g = mix(190, 180, air); b = mix(238, 158, air);
      const sun = bell((x - .77) * Math.min(aspect, 1.6), .055) * bell(y - .47, .045) * .8;
      r = mix(r, 255, sun); g = mix(g, 221, sun); b = mix(b, 132, sun);
      if (y > horizon) {
        const depth = (y - horizon) / (1 - horizon);
        const reflection = bell((x - .77) * Math.min(aspect, 1.6), .008 + depth * .02);
        r = mix(151, 22, depth); g = mix(220, 151, depth); b = mix(212, 172, depth);
        const ripple = Math.sin((y - horizon) * 440 / (depth + .3) + Math.sin(x * 31) * .12);
        const glint = reflection * Math.pow(Math.max(0, ripple), 8) * .5 * depth;
        r = mix(r, 255, glint); g = mix(g, 218, glint); b = mix(b, 141, glint);
      }
      const bank = .735 + .025 * Math.sin(x * 4.3 + .6) + .012 * Math.sin(x * 10);
      const land = bell(y - bank, .0002) * clamp((.5 - x) * 4) * .21;
      r = mix(r, 36, land); g = mix(g, 130, land); b = mix(b, 121, land);
      const haze = bell(y - horizon, .0007) * .64;
      r = mix(r, 255, haze); g = mix(g, 224, haze); b = mix(b, 187, haze);
      const clear = bell(y - .36, .055) * side * .7 * clamp((horizon - y) * 12);
      r = mix(r, 255, clear); g = mix(g, 244, clear); b = mix(b, 221, clear);
    }
    const index = (py * width + px) * 4;
    pixels[index] = r; pixels[index + 1] = g; pixels[index + 2] = b; pixels[index + 3] = 255;
  }
  ctx.putImageData(plate, 0, 0);
}

export class AeroBackdrop {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'aero-backdrop';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.querySelector('.aero-optics').prepend(this.canvas);
    let saved, savedTheme;
    try { saved = localStorage.getItem(storageKey); savedTheme = localStorage.getItem(themeKey); } catch {}
    const params = new URLSearchParams(location.search);
    const requested = params.get('backdrop');
    const theme = params.get('theme');
    this.theme = ['light', 'dark'].includes(theme) ? theme : savedTheme === 'dark' ? 'dark' : 'light';
    this.set(valid(requested) ? requested : valid(saved) ? saved : 'aurora', false);
    this.resize = new ResizeObserver(() => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.draw(), 100);
    });
    this.resize.observe(document.querySelector('.aero-optics'));
  }
  draw() {
    if (this.value === 'aurora') { this.aurora?.resize(); return; }
    const rect = this.canvas.getBoundingClientRect();
    const signature = `${this.value}:${rect.width}:${rect.height}`;
    if (this.value !== 'original' && signature !== this.signature) {
      paint(this.canvas, this.value);
      this.signature = signature;
    }
  }
  set(value, notify = true) {
    if (!valid(value)) return;
    this.value = value;
    document.body.dataset.backdrop = value;
    if (value === 'aurora') {
      this.aurora ||= new AeroAurora(document.querySelector('.aero-optics'));
      this.aurora.setTheme(this.theme);
      this.aurora.setPaused(Boolean(this.paused));
      document.body.dataset.aeroTheme = this.theme;
    } else {
      this.aurora?.destroy();
      this.aurora = null;
      delete document.body.dataset.aeroTheme;
    }
    this.syncThemeControls();
    const select = document.querySelector('#aero-backdrop');
    if (select) select.value = value;
    this.draw();
    if (!notify) return;
    try { localStorage.setItem(storageKey, value); } catch {}
    const url = new URL(location.href);
    url.searchParams.set('backdrop', value);
    if (value === 'aurora') url.searchParams.set('theme', this.theme);
    else url.searchParams.delete('theme');
    history.replaceState(history.state, '', url);
    document.dispatchEvent(new Event('ordzson:backdrop-change'));
  }
  syncThemeControls() {
    document.querySelector('#aurora-theme-setting').hidden = this.value !== 'aurora';
    document.querySelectorAll('[data-aurora-theme]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.auroraTheme === this.theme));
    });
    document.querySelector('meta[name="theme-color"]').content = this.value === 'aurora'
      ? this.theme === 'dark' ? '#03070d' : '#fafdfd' : '#d9f4ff';
  }
  setTheme(theme) {
    if (!['light', 'dark'].includes(theme) || this.value !== 'aurora') return;
    this.theme = theme;
    document.body.dataset.aeroTheme = theme;
    this.aurora?.setTheme(theme);
    this.syncThemeControls();
    try { localStorage.setItem(themeKey, theme); } catch {}
    const url = new URL(location.href);
    url.searchParams.set('theme', theme);
    history.replaceState(history.state, '', url);
    document.dispatchEvent(new Event('ordzson:backdrop-change'));
  }
  setPaused(paused) {
    this.paused = paused;
    this.aurora?.setPaused(paused);
  }
  destroy() {
    clearTimeout(this.timer);
    this.resize.disconnect();
    this.canvas.remove();
    this.aurora?.destroy();
    delete document.body.dataset.backdrop;
    delete document.body.dataset.aeroTheme;
  }
}
