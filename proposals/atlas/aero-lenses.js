import { AeroBubbleSprites } from './aero-bubble-sprites.js?v=2';

const SVG = 'http://www.w3.org/2000/svg';
const REFERENCE_DIAMETER = 192;
const BUBBLE_HUES = [195, 270, 330, 155, 35];
const POP_SOUNDS = [1, 2, 3].map(number => new URL(`./assets/bubble-pop-${number}.wav`, import.meta.url));

// Only the outer annulus bends the backdrop; the centre stays optically flat.
// One small numerical map and one filter serve every bubble, at any diameter.
function normalMap() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + .5) / size * 2 - 1, v = (y + .5) / size * 2 - 1;
    const radius = Math.hypot(u, v);
    const edge = Math.max(0, Math.min(1, (radius - .72) / .28));
    const bend = -.75 * Math.sin(edge * Math.PI);
    const offset = (y * size + x) * 4;
    image.data[offset] = Math.round(127.5 + u * bend * 127.5);
    image.data[offset + 1] = Math.round(127.5 + v * bend * 127.5);
    image.data[offset + 2] = 128;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

let map;
let sequence = 0;

export class AeroLenses {
  constructor(hero, redraw) {
    this.container = hero;
    this.redraw = redraw;
    this.layer = document.createElement('div');
    this.layer.className = 'aero-bubbles';
    this.layer.setAttribute('aria-hidden', 'true');
    this.sprites = new AeroBubbleSprites();
    this.layer.append(this.sprites.canvas);
    this.filters = document.createElementNS(SVG, 'svg');
    this.filters.classList.add('aero-lens-filters');
    this.filters.setAttribute('aria-hidden', 'true');
    this.definitions = document.createElementNS(SVG, 'defs');
    this.filters.append(this.definitions);
    hero.append(this.filters, this.layer);
    this.lenses = [];
    this.bursts = new Set();
    this.voices = new Set();
    // Fetch ahead of the interaction; audio starts only after a deliberate pop.
    this.popData = Promise.all(POP_SOUNDS.map(url => fetch(url).then(response => {
      if (!response.ok) throw new Error('Pop sound unavailable');
      return response.arrayBuffer();
    }))).catch(() => null);
    this.onVisibility = () => { if (document.hidden) this.clearBursts(); };
    document.addEventListener('visibilitychange', this.onVisibility);
    this.prefix = `aero-lens-${++sequence}`;
  }

  createFilter() {
    if (this.displacement) return;
    map ||= normalMap();
    const filter = document.createElementNS(SVG, 'filter');
    for (const [key, value] of Object.entries({ id: this.prefix, filterUnits: 'objectBoundingBox', primitiveUnits: 'objectBoundingBox', x: '0', y: '0', width: '1', height: '1', 'color-interpolation-filters': 'sRGB' })) filter.setAttribute(key, value);
    const image = document.createElementNS(SVG, 'feImage');
    for (const [key, value] of Object.entries({ href: map, x: '0', y: '0', width: '1', height: '1', preserveAspectRatio: 'none', result: 'normal' })) image.setAttribute(key, value);
    this.displacement = document.createElementNS(SVG, 'feDisplacementMap');
    for (const [key, value] of Object.entries({ in: 'SourceGraphic', in2: 'normal', scale: '0', xChannelSelector: 'R', yChannelSelector: 'G' })) this.displacement.setAttribute(key, value);
    filter.append(image, this.displacement);
    this.definitions.append(filter);
    this.layer.style.setProperty('--lens-filter', `url("#${this.prefix}")`);
  }

  resize(width, height, ratio) {
    this.width = width;
    this.height = height;
    this.ratio = ratio;
    const panel = this.container.querySelector('ul').getBoundingClientRect();
    const section = this.container.getBoundingClientRect();
    this.panel = { x: panel.x - section.x, y: panel.y - section.y, width: panel.width, height: panel.height, radius: 16 };
    if (this.flat) this.sprites.resize(width, height, ratio, this.panel);
  }

  build(count) {
    this.clearBursts();
    this.sprites.cache.clear();
    this.layer.replaceChildren(this.sprites.canvas);
    this.lenses = Array.from({ length: count }, (_, index) => {
      const bubble = document.createElement('span');
      bubble.className = 'aero-bubble';
      bubble.style.setProperty('--bubble-hue', BUBBLE_HUES[index % BUBBLE_HUES.length]);
      const lens = document.createElement('span');
      lens.className = 'aero-bubble__lens';
      bubble.append(lens);
      if (!this.flat) this.layer.append(bubble);
      return { bubble, hue: BUBBLE_HUES[index % BUBBLE_HUES.length], diameter: 0 };
    });
  }

  update({ light, character, bubbleColor: color = 10, glassBlur = 25, glassSaturation = 55 }) {
    const flat = character === 0 && document.body.dataset.aeroTheme === 'light';
    if (flat !== this.flat) {
      this.clearBursts();
      this.flat = flat;
      this.layer.toggleAttribute('data-flat-bubbles', flat);
      if (flat) {
        this.sprites.resize(this.width, this.height, this.ratio, this.panel);
        for (const { bubble } of this.lenses) bubble.remove();
      } else {
        this.sprites.release();
        this.createFilter();
        for (const { bubble } of this.lenses) this.layer.append(bubble);
      }
    }
    if (flat) this.sprites.update(light, color, glassBlur * .4, 1 + glassSaturation * .04);
    if (color !== this.color) {
      this.layer.style.setProperty('--bubble-color', (color / 100).toFixed(2));
      this.color = color;
    }
    if (light !== this.light) {
      this.layer.style.setProperty('--bubble-light', (light / 100).toFixed(2));
      this.light = light;
    }
    if (this.displacement && character !== this.character) {
      // Normalized coordinates scale with the bubble itself. Filtering a
      // transformed fixed-size child makes Chromium misproject fine contours.
      this.displacement.setAttribute('scale', ((2 + character * .055) / REFERENCE_DIAMETER).toFixed(6));
      this.character = character;
    }
  }

  beginFrame() {
    // During the brief DOM tear effect use the native glass, then return to
    // cached optical plates. The panel's translucent fill never changes.
    const cachedGlass = this.flat && this.sprites.canCacheGlass && this.bursts.size === 0;
    if (this.cachedGlass !== cachedGlass) {
      this.container.toggleAttribute('data-cached-glass', cachedGlass);
      this.cachedGlass = cachedGlass;
    }
    if (this.flat) this.sprites.beginFrame(cachedGlass);
  }

  endFrame() {
    if (this.flat) this.sprites.endFrame(this.lenses);
  }

  draw(index, x, y, radius) {
    const lens = this.lenses[index];
    const diameter = Math.round(radius * 2);
    lens.x = x - diameter / 2;
    lens.y = y - diameter / 2;
    if (diameter !== lens.diameter) {
      lens.bubble.style.width = `${diameter}px`;
      lens.diameter = diameter;
    }
    if (this.flat) this.sprites.draw(lens.hue, lens.x, lens.y, diameter);
    else this.position(lens);
  }

  position(lens) {
    lens.bubble.style.transform = `translate3d(${lens.x.toFixed(2)}px, ${lens.y.toFixed(2)}px, 0)`;
  }

  pop(index, contact = { x: .35, y: .25 }) {
    const lens = this.lenses[index];
    if (!lens?.diameter) return;
    this.position(lens);
    this.playPop();
    // Keep the original silhouette: a hole eats through the film from the
    // contact point. An intact, expanding ring looks like an inflated balloon.
    const burst = lens.bubble.cloneNode(true);
    burst.classList.add('aero-bubble--burst');
    this.layer.append(burst);
    const effect = { stop: () => {
      cancelAnimationFrame(effect.frame);
      effect.animation?.cancel();
      burst.remove();
      effect.spray?.remove();
      this.bursts.delete(effect);
      if (!this.clearing && !this.destroyed) this.redraw();
    } };
    // Repeated taps never leave an unbounded pile of canvases or callbacks.
    if (this.bursts.size >= 6) this.bursts.values().next().value.stop();
    this.bursts.add(effect);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      effect.animation = burst.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, fill: 'forwards' });
      effect.animation.finished.then(effect.stop, effect.stop);
      return;
    }

    const diameter = lens.diameter, radius = diameter / 2;
    const hitX = contact.x * diameter, hitY = contact.y * diameter;
    const reach = radius + Math.hypot(hitX - radius, hitY - radius);
    const tearTime = 65 + Math.min(diameter, 240) * .18;
    const padding = 40, extent = diameter + padding * 2;
    const spray = effect.spray = document.createElement('canvas');
    spray.className = 'aero-burst-spray';
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    spray.width = spray.height = Math.ceil(extent * ratio);
    spray.style.width = spray.style.height = `${extent}px`;
    spray.style.transform = `${lens.bubble.style.transform} translate(${-padding}px, ${-padding}px)`;
    this.layer.append(spray);
    const context = spray.getContext('2d');
    context.scale(ratio, ratio);
    const hue = lens.bubble.style.getPropertyValue('--bubble-hue');
    const light = this.light / 100;
    const dark = document.body.dataset.aeroTheme === 'dark';
    const count = Math.max(5, Math.min(10, Math.round(diameter / 24)));
    const phase = Math.random() * Math.PI * 2;
    const drops = Array.from({ length: count }, (_, i) => {
      const angle = phase + (i + Math.random() * .55) / count * Math.PI * 2;
      const nx = Math.cos(angle), ny = Math.sin(angle);
      const x = radius + nx * radius, y = radius + ny * radius;
      return { x, y, nx, ny, angle,
        // Each remnant releases only when the tear actually reaches its rim.
        birth: tearTime * (Math.hypot(x - hitX, y - hitY) / reach) ** (1 / .8),
        speed: 25 + Math.random() * 55, life: 160 + Math.random() * 100,
        size: .6 + Math.random() * .85, arc: .12 + Math.random() * .24
      };
    });
    const started = performance.now();
    const draw = now => {
      const elapsed = now - started;
      if (elapsed >= tearTime + 280) { effect.stop(); return; }
      const progress = Math.min(1, elapsed / tearTime);
      const hole = reach * progress ** .8;
      if (progress < 1) {
        const mask = `radial-gradient(circle at ${hitX}px ${hitY}px, transparent ${hole}px, #000 ${hole + 1}px)`;
        burst.style.maskImage = burst.style.webkitMaskImage = mask;
      } else burst.remove();
      context.clearRect(0, 0, extent, extent);
      // White specular light disappears on a pale surface. Give the retreating
      // film a coloured edge, clipped to the original bubble's silhouette.
      if (!dark && progress > 0 && progress < 1) {
        context.save();
        context.beginPath();
        context.arc(padding + radius, padding + radius, radius, 0, Math.PI * 2);
        context.clip();
        context.beginPath();
        context.arc(padding + hitX, padding + hitY, hole, 0, Math.PI * 2);
        context.strokeStyle = `hsla(${hue}, 58%, 36%, ${light * .75})`;
        context.lineWidth = 1.25;
        context.stroke();
        context.restore();
      }
      for (const drop of drops) {
        const age = elapsed - drop.birth;
        if (age < 0 || age > drop.life) continue;
        const t = age / 1000;
        const travel = drop.speed * (1 - Math.exp(-t * 5)) / 5;
        const fall = 120 * t * t;
        const fade = (1 - age / drop.life) ** (dark ? 1.5 : .85) * light;
        // Short curved threads contract into tiny drops; no full-ring pulse.
        const arc = drop.arc * Math.max(0, 1 - age / 85);
        if (arc > .005) {
          context.beginPath();
          context.arc(padding + radius + drop.nx * travel, padding + radius + drop.ny * travel + fall, radius, drop.angle - arc / 2, drop.angle + arc / 2);
          context.strokeStyle = `hsla(${hue}, 62%, ${dark ? 67 : 38}%, ${fade * (dark ? .65 : .9)})`;
          context.lineWidth = dark ? .8 : 1.3;
          context.stroke();
        }
        const x = padding + drop.x + drop.nx * travel;
        const y = padding + drop.y + drop.ny * travel + fall;
        const size = drop.size * (dark ? 1 : 1.35) * (1 - age / drop.life * .45);
        context.beginPath();
        context.ellipse(x, y, size * .8, size, 0, 0, Math.PI * 2);
        context.fillStyle = `hsla(${hue}, 50%, ${dark ? 60 : 38}%, ${fade * (dark ? .7 : .95)})`;
        context.fill();
        context.beginPath();
        context.arc(x - size * .2, y - size * .3, size * .35, 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 255, 255, ${fade})`;
        context.fill();
      }
      effect.frame = requestAnimationFrame(draw);
    };
    draw(started);
  }

  clearBursts() {
    this.clearing = true;
    for (const effect of this.bursts) effect.stop();
    this.clearing = false;
  }

  playPop() {
    // Create audio only inside a deliberate click, tap or keyboard activation.
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      if (!this.audio) {
        const context = this.audio = new Audio({ latencyHint: 'interactive' });
        // A soft ceiling keeps overlapping pops at a comfortable level.
        this.audioOutput = context.createDynamicsCompressor();
        this.audioOutput.threshold.value = -14;
        this.audioOutput.knee.value = 8;
        this.audioOutput.ratio.value = 8;
        this.audioOutput.attack.value = .002;
        this.audioOutput.release.value = .07;
        this.audioOutput.connect(context.destination);
        this.popBuffers = this.popData.then(files => files && Promise.all(files.map(data => context.decodeAudioData(data.slice(0))))).catch(() => null);
      }
      const context = this.audio;
      const requested = performance.now();
      const ready = context.state === 'suspended' ? context.resume() : Promise.resolve();
      Promise.all([this.popBuffers, ready]).then(([buffers]) => {
        if (!buffers || this.audio !== context || context.state !== 'running' || document.hidden || performance.now() - requested > 250) return;
        if (this.voices.size >= 6) this.voices.values().next().value.stop();
        const source = context.createBufferSource(), gain = context.createGain();
        source.buffer = buffers[Math.floor(Math.random() * buffers.length)];
        gain.gain.value = .65;
        source.connect(gain).connect(this.audioOutput);
        const cleanup = () => {
          source.disconnect();
          gain.disconnect();
          this.voices.delete(voice);
        };
        const voice = { stop: () => {
          source.stop();
          cleanup();
        } };
        source.onended = cleanup;
        this.voices.add(voice);
        source.start();
      }).catch(() => {});
    } catch { /* Visual popping remains available when audio is unavailable. */ }
  }

  destroy() {
    this.destroyed = true;
    this.clearBursts();
    document.removeEventListener('visibilitychange', this.onVisibility);
    for (const voice of this.voices) voice.stop();
    this.audio?.close().catch(() => {});
    this.audio = null;
    this.audioOutput = this.popBuffers = this.popData = null;
    this.layer.remove();
    this.filters.remove();
    this.sprites.release();
    this.container.removeAttribute('data-cached-glass');
    this.lenses.length = 0;
  }
}
