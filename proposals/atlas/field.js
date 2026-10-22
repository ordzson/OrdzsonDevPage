const TAU = Math.PI * 2;
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

export class ParticleField {
  constructor(canvas, world, parameters) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.world = world;
    this.params = { ...parameters };
    this.time = 18;
    this.frames = 0;
    this.paintTotal = 0;
    this.lastTime = 0;
    this.frame = 0;
    this.paused = false;
    this.visible = true;
    this.destroyed = false;
    this.pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    this.seed = 716023;
    this.particles = [];
    this.sprites = [];
    this.hero = canvas.closest('.hero');
    this.onFrame = this.onFrame.bind(this);
    this.onVisibility = () => this.schedule();
    this.onPointer = event => {
      const bounds = this.canvas.getBoundingClientRect();
      this.pointer.x = clamp((event.clientX - bounds.left) / Math.max(1, bounds.width) - .5, -.5, .5);
      this.pointer.y = clamp((event.clientY - bounds.top) / Math.max(1, bounds.height) - .5, -.5, .5);
    };
    this.onLeave = () => { this.pointer.x = 0; this.pointer.y = 0; };
    this.hero.addEventListener('pointermove', this.onPointer, { passive: true });
    this.hero.addEventListener('pointerleave', this.onLeave);
    document.addEventListener('visibilitychange', this.onVisibility);
    if (world === 'halation') this.sprites = ['#fbc575', '#f69543', '#ffe5b5', '#cf6c38'].map(color => this.makeBokeh(color));
    if (world === 'aero') this.sprites = [0, 1, 2].map(index => this.makeBubble(index));
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.intersection = new IntersectionObserver(entries => { this.visible = entries[0].isIntersecting; this.schedule(); }, { threshold: 0 });
    this.intersection.observe(canvas);
    this.resize();
  }

  random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  resize() {
    this.width = Math.max(1, this.canvas.clientWidth);
    this.height = Math.max(1, this.canvas.clientHeight);
    this.mobile = innerWidth <= 700;
    this.ratio = Math.min(devicePixelRatio || 1, 1.75);
    this.canvas.width = Math.round(this.width * this.ratio);
    this.canvas.height = Math.round(this.height * this.ratio);
    this.ctx?.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    this.build();
    this.paint();
    this.schedule();
  }

  build() {
    this.seed = 716023;
    const density = this.params.density / 100;
    const budgets = { orbit: this.mobile ? 2200 : 4100, current: this.mobile ? 4200 : 8500, halation: this.mobile ? 46 : 65, aero: this.mobile ? 31 : 45 };
    const count = Math.round(budgets[this.world] * density);
    this.particles = Array.from({ length: count }, (_, index) => ({
      u: this.random(), v: this.random(), a: this.random() * TAU,
      radius: .73 + this.random() * .31,
      size: .3 + this.random() ** 2 * 1.7,
      depth: this.random(), speed: .2 + this.random() * .8,
      color: index % 4, phase: this.random() * TAU,
      side: index % 2 ? this.random() * .23 : .77 + this.random() * .23
    }));
  }

  update(parameters) {
    const rebuild = parameters.density !== this.params.density;
    this.params = { ...parameters };
    if (rebuild) this.build();
    this.paint();
    this.schedule();
  }

  setPaused(paused) { this.paused = paused; this.schedule(); }
  schedule() {
    const shouldRun = !this.destroyed && !this.paused && this.visible && !document.hidden && this.params.speed > 0;
    if (shouldRun && !this.frame) { this.lastTime = 0; this.frame = requestAnimationFrame(this.onFrame); }
    if (!shouldRun && this.frame) { cancelAnimationFrame(this.frame); this.frame = 0; this.lastTime = 0; }
  }

  onFrame(now) {
    this.frame = 0;
    const delta = this.lastTime ? Math.min((now - this.lastTime) / 1000, .05) : 0;
    this.lastTime = now;
    this.time += delta * this.params.speed / 28;
    const ease = 1 - Math.exp(-delta * 3);
    this.pointer.sx += (this.pointer.x - this.pointer.sx) * ease;
    this.pointer.sy += (this.pointer.y - this.pointer.sy) * ease;
    this.paint();
    // Preserve the timestamp across frames; schedule resets it only on resume.
    if (!this.paused && this.visible && !document.hidden && this.params.speed > 0) this.frame = requestAnimationFrame(this.onFrame);
  }

  paint() {
    if (!this.ctx || this.destroyed) return;
    const before = performance.now();
    this.ctx.clearRect(0, 0, this.width, this.height);
    this[this.world]();
    this.frames++;
    this.paintTotal += performance.now() - before;
  }

  orbit() {
    const c = this.ctx, w = this.width, h = this.height;
    const light = this.params.light / 100, size = .35 + this.params.size / 58;
    const influence = this.params.interaction / 100;
    const cx = (this.mobile ? w * .56 : w * .78) + this.pointer.sx * 42 * influence;
    const cy = (this.mobile ? h * .68 : h * .43) + this.pointer.sy * 35 * influence;
    const radius = this.mobile ? w * .69 : Math.min(w * .34, h * .68);
    const inclination = .13 + this.params.character / 200;
    const rotation = -.49 + this.pointer.sx * influence * .08;
    const cos = Math.cos(rotation), sin = Math.sin(rotation);
    const glow = c.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.25);
    glow.addColorStop(0, `rgba(156,137,100,${.055 * light})`);
    glow.addColorStop(.7, `rgba(89,109,111,${.025 * light})`);
    glow.addColorStop(1, 'rgba(89,109,111,0)');
    c.fillStyle = glow; c.fillRect(0, 0, w, h);
    c.save(); c.translate(cx, cy); c.rotate(rotation);
    c.strokeStyle = `rgba(221,189,143,${.065 * light})`; c.lineWidth = .6;
    for (const scale of [.735, .87, 1.045]) { c.beginPath(); c.ellipse(0, 0, radius * scale, radius * scale * inclination, 0, 0, TAU); c.stroke(); }
    c.restore();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (i % 6 === 0) {
        const x = p.u * w, y = p.v * h;
        c.fillStyle = `rgba(211,224,221,${(.15 + p.depth * .45) * light})`;
        c.fillRect(x, y, Math.max(.5, p.size * size * .45), Math.max(.5, p.size * size * .45));
        continue;
      }
      const angle = p.a + this.time * .055 * (1.6 - p.radius);
      const r = p.radius * radius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r * inclination + (p.v - .5) * radius * .085;
      const px = cx + x * cos - y * sin, py = cy + x * sin + y * cos;
      const near = (Math.sin(angle) + 1) / 2;
      const alpha = (.3 + near * .55 + p.depth * .15) * light;
      const s = Math.max(.45, p.size * size * (.45 + near * .5));
      c.fillStyle = i % 5 === 0 ? `rgba(188,217,218,${alpha * .8})` : `rgba(242,${193 + p.color * 12},${134 + p.color * 18},${alpha})`;
      c.fillRect(px, py, s, s);
      if (i % 115 === 0) {
        c.globalAlpha = alpha * .33; c.fillRect(px - s * 2, py + s * .35, s * 5, .6); c.fillRect(px + s * .35, py - s * 2, .6, s * 5); c.globalAlpha = 1;
      }
    }
  }

  makeBokeh(color) {
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 192;
    const c = sprite.getContext('2d'), r = 96;
    const disc = c.createRadialGradient(r, r, 0, r, r, r);
    disc.addColorStop(0, color + '7a'); disc.addColorStop(.48, color + '71'); disc.addColorStop(.66, color + '85');
    disc.addColorStop(.74, color + '96'); disc.addColorStop(.82, color + '40'); disc.addColorStop(1, color + '00');
    c.fillStyle = disc; c.fillRect(0, 0, 192, 192);
    return sprite;
  }

  halation() {
    const c = this.ctx, w = this.width, h = this.height;
    const light = this.params.light / 100, size = .2 + this.params.size / 62;
    const influence = this.params.interaction / 100;
    const backdrop = c.createLinearGradient(0, 0, w, h);
    backdrop.addColorStop(0, '#1b2522'); backdrop.addColorStop(.48, '#55402a'); backdrop.addColorStop(1, '#221e18');
    c.fillStyle = backdrop; c.fillRect(0, 0, w, h);
    const spill = c.createRadialGradient(w * .75, h * .42, 0, w * .75, h * .42, w * .75);
    spill.addColorStop(0, `rgba(239,162,61,${light * .19})`); spill.addColorStop(1, 'rgba(239,162,61,0)');
    c.fillStyle = spill; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'screen';
    for (const p of this.particles) {
      const depth = .25 + p.depth * .75;
      const r = (18 + depth * 96) * size * (this.mobile ? .72 : 1);
      const x = p.u * w + Math.sin(this.time * .08 + p.phase) * 26 + this.pointer.sx * influence * (1 - depth) * 65;
      const y = ((p.v * h - this.time * (2 + p.speed * 4)) % (h + r * 2) + h + r * 2) % (h + r * 2) - r;
      c.globalAlpha = (.13 + p.depth * .51) * light * (.8 + this.params.character / 210);
      c.drawImage(this.sprites[p.color], x - r, y - r, r * 2, r * 2);
      // A sharper aperture ring appears only at low defocus.
      if (this.params.character < 50) {
        c.beginPath(); c.arc(x, y, r * .72, 0, TAU); c.strokeStyle = '#ffe7b5';
        c.lineWidth = .8; c.globalAlpha *= (50 - this.params.character) / 120; c.stroke();
      }
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    const vignette = c.createRadialGradient(w * .5, h * .5, w * .1, w * .5, h * .5, h * .7);
    vignette.addColorStop(0, '#0d191000'); vignette.addColorStop(1, '#111d1666');
    c.fillStyle = vignette; c.fillRect(0, 0, w, h);
  }

  current() {
    const c = this.ctx, w = this.width, h = this.height;
    const size = .6 + this.params.size / 70, light = this.params.light / 100;
    const amplitude = .2 + this.params.character / 90, influence = this.params.interaction / 100;
    const cx = this.mobile ? w * .5 : w * .82;
    const cy = this.mobile ? h * .73 : h * .46;
    const horizontal = this.mobile ? w * .75 : w * .38;
    const vertical = this.mobile ? h * .18 : h * .39;
    const rotation = this.mobile ? -.08 : -.52;
    const cos = Math.cos(rotation), sin = Math.sin(rotation);
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const u = p.u * TAU;
      const v = (p.v - .5) * 2;
      const wave = Math.sin(u * .9 + this.time * .24) * amplitude;
      const localX = (p.u - .5) * horizontal * 2;
      const localY = wave * vertical * .54 + v * vertical * .28 * Math.cos(u * .65 + this.time * .16) + Math.sin(v * 2.4 + u * 1.2 + this.time * .22) * vertical * .12;
      const x = cx + localX * cos - localY * sin + this.pointer.sx * 50 * influence * p.depth;
      const y = cy + localX * sin + localY * cos + this.pointer.sy * 35 * influence * p.depth;
      const depth = (Math.sin(u + .7) + 1) / 2;
      const s = size * (.5 + p.depth * 1.2 + depth * .2);
      c.globalAlpha = Math.min(1, (.3 + depth * .6 + p.depth * .23) * light);
      c.fillStyle = i % 7 === 0 ? '#50a47e' : i % 4 === 0 ? '#4f8de5' : '#164fdd';
      c.fillRect(x, y, s, s);
    }
    c.globalAlpha = 1;
  }

  makeBubble(index) {
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 256;
    const c = sprite.getContext('2d'), cx = 128, r = 112;
    const fill = c.createRadialGradient(cx - 35, cx - 42, 5, cx, cx, r);
    fill.addColorStop(0, '#ffffff43'); fill.addColorStop(.38, '#d4faff08'); fill.addColorStop(.72, '#d5fbff12');
    fill.addColorStop(.88, index === 1 ? '#9ee9b862' : '#a0ddff62'); fill.addColorStop(.97, '#ffffffbf'); fill.addColorStop(1, '#69b5dd40');
    c.beginPath(); c.arc(cx, cx, r, 0, TAU); c.fillStyle = fill; c.fill();
    const rim = c.createLinearGradient(30, 20, 225, 245);
    rim.addColorStop(0, '#ffffffef'); rim.addColorStop(.3, '#efffff5a'); rim.addColorStop(.6, '#92d5e976'); rim.addColorStop(.82, '#b5efbdbb'); rim.addColorStop(1, '#ffffffcc');
    c.strokeStyle = rim; c.lineWidth = 2; c.stroke();
    c.save(); c.translate(cx - 31, cx - 65); c.rotate(-.5);
    const glint = c.createRadialGradient(0, 0, 0, 0, 0, 40);
    glint.addColorStop(0, '#fffffffa'); glint.addColorStop(.5, '#ffffffa3'); glint.addColorStop(1, '#ffffff00');
    c.scale(1, .42); c.fillStyle = glint; c.beginPath(); c.arc(0, 0, 42, 0, TAU); c.fill(); c.restore();
    c.strokeStyle = '#ffffffb0'; c.lineWidth = 3.5; c.beginPath(); c.arc(cx, cx, r * .84, 3.8, 4.7); c.stroke();
    c.strokeStyle = '#dbffdd86'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cx, r * .89, .7, 1.6); c.stroke();
    return sprite;
  }

  aero() {
    const c = this.ctx, w = this.width, h = this.height;
    const size = .2 + this.params.size / 65, light = this.params.light / 100;
    const influence = this.params.interaction / 100;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const r = (12 + p.depth ** 2 * 72) * size * (this.mobile ? .65 : 1);
      const xBase = p.v > .52 ? p.u : p.side;
      const x = xBase * w + Math.sin(this.time * .16 + p.phase) * (12 + p.depth * 10) + this.pointer.sx * influence * p.depth * 50;
      const y = ((p.v * h - this.time * (4 + p.speed * 11)) % (h + r * 2) + h + r * 2) % (h + r * 2) - r;
      c.globalAlpha = (.35 + p.depth * .5) * light;
      c.drawImage(this.sprites[i % 3], x - r, y - r, r * 2, r * 2);
      if (i % 4 === 0 && this.params.character > 20) {
        const glint = (this.params.character - 20) / 80;
        c.globalAlpha *= glint;
        c.strokeStyle = '#ffffff'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x - r * .3, y - r * .65 - 5); c.lineTo(x - r * .3, y - r * .65 + 5);
        c.moveTo(x - r * .3 - 5, y - r * .65); c.lineTo(x - r * .3 + 5, y - r * .65); c.stroke();
      }
    }
    c.globalAlpha = 1;
  }

  destroy() {
    this.destroyed = true; cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect(); this.intersection.disconnect();
    this.hero.removeEventListener('pointermove', this.onPointer);
    this.hero.removeEventListener('pointerleave', this.onLeave);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.sprites.length = 0;
  }

  get state() {
    return { count: this.particles.length, frames: this.frames, paused: this.paused, visible: this.visible, meanPaintMs: Number((this.paintTotal / Math.max(1, this.frames)).toFixed(2)), width: this.width, height: this.height };
  }
}
