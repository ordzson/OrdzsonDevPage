// Two translucent light curtains. Paint the rays once, then bend narrow strips
// of those plates at 24fps; no per-frame noise generation or full-screen blur.
export class AeroAurora {
  constructor(container) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'aero-backdrop aero-aurora';
    this.canvas.setAttribute('aria-hidden', 'true');
    container.prepend(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.time = 0;
    this.visible = true;
    this.hidden = () => this.sync();
    document.addEventListener('visibilitychange', this.hidden);
    this.observer = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.sync();
    });
    this.observer.observe(container);
    this.tick = stamp => {
      if (stamp - this.lastFrame >= 1000 / 24) {
        this.time += Math.min(80, stamp - this.lastFrame) / 1000;
        this.lastFrame = stamp;
        this.draw();
      }
      this.frame = requestAnimationFrame(this.tick);
    };
  }

  plate(reverse) {
    const plate = document.createElement('canvas');
    plate.width = 1400;
    plate.height = 360;
    const ctx = plate.getContext('2d');
    if (!ctx) return plate;
    const image = ctx.createImageData(plate.width, plate.height);
    const colors = reverse
      ? [[111, 101, 246], [65, 135, 255], [25, 216, 225], [80, 239, 161], [175, 231, 119]]
      : [[80, 235, 166], [27, 216, 223], [71, 148, 255], [139, 115, 247], [218, 137, 226]];
    for (let x = 0; x < plate.width; x++) {
      const u = x / (plate.width - 1);
      const segment = Math.min(3, Math.floor(u * 4));
      const blend = u * 4 - segment;
      const color = colors[segment].map((v, i) => v + (colors[segment + 1][i] - v) * blend);
      const ray = .46 + .25 * Math.sin(x * .077 + Math.sin(x * .021) * 2)
        + .18 * Math.sin(x * .193) + .11 * Math.sin(x * .417);
      const height = .52 + .2 * Math.sin(x * .011) + .12 * Math.sin(x * .031);
      const edge = Math.pow(Math.sin(Math.PI * u), .45);
      for (let y = 0; y < plate.height; y++) {
        const v = y / (plate.height - 1), d = .88 - v;
        const core = Math.exp(-Math.abs(d) * 30) * .8;
        const curtain = d > 0 ? Math.exp(-d * 6 / height) * ray * .8 : Math.exp(d * 38) * .22;
        const atmosphere = Math.exp(-Math.abs(d) * 4) * .14;
        const at = (y * plate.width + x) * 4;
        image.data[at] = color[0];
        image.data[at + 1] = color[1];
        image.data[at + 2] = color[2];
        image.data[at + 3] = Math.min(1, core + curtain + atmosphere) * edge * Math.min(1, (1 - v) * 14) * 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    return plate;
  }

  setTheme(theme) {
    this.theme = theme;
    this.plates ||= [this.plate(false), this.plate(true)];
    this.draw();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const scale = Math.min(1, 1000 / rect.width, 700 / rect.height);
    const width = Math.max(1, Math.round(rect.width * scale));
    const height = Math.max(1, Math.round(rect.height * scale));
    if (this.canvas.width === width && this.canvas.height === height) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.draw();
  }

  draw() {
    if (!this.ctx || !this.plates) return;
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    const dark = this.theme === 'dark';
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = dark ? '#03070d' : '#fafdfd';
    ctx.fillRect(0, 0, w, h);
    for (let layer = 0; layer < 2; layer++) {
      const plate = this.plates[layer];
      const span = w * 1.7;
      const depth = Math.min(h * .56, w * .58);
      ctx.save();
      ctx.translate(w * .5, h * (layer ? .98 : .11));
      // Both diagonals rise to the right; the lower curtain reaches upward.
      ctx.rotate(-.32);
      if (!layer) ctx.scale(1, -1);
      ctx.globalCompositeOperation = dark ? 'screen' : 'multiply';
      ctx.globalAlpha = dark ? .9 : .72;
      const strips = 220;
      const offset = u => {
        const phase = u * Math.PI * 4 + this.time * .17 * (layer ? -1 : 1);
        return Math.sin(phase) * h * .045 + Math.sin(phase * 2.3 + this.time * .11) * h * .017;
      };
      for (let i = 0; i < strips; i++) {
        const u = i / strips;
        const wave = offset(u), nextWave = offset((i + 1) / strips);
        const breathe = 1 + Math.sin(u * 8 + this.time * .15) * .12;
        ctx.save();
        // Interpolate the slope across each slice so the luminous edge is smooth.
        ctx.transform(1, (nextWave - wave) / (span / strips), 0, 1, (u - .5) * span, wave);
        ctx.drawImage(plate, u * plate.width, 0, plate.width / strips, plate.height,
          0, -depth * breathe, span / strips + .15, depth * breathe);
        ctx.restore();
      }
      ctx.restore();
    }
    // A clear centre holds the copy; the curtains keep their saturated edges.
    const clear = ctx.createRadialGradient(w * .5, h * .43, 0, w * .5, h * .43, Math.max(w * .46, h * .47));
    clear.addColorStop(0, dark ? '#03070dc7' : '#fafdfddd');
    clear.addColorStop(.45, dark ? '#03070d75' : '#fafdfd85');
    clear.addColorStop(1, dark ? '#03070d00' : '#fafdfd00');
    ctx.fillStyle = clear;
    ctx.fillRect(0, 0, w, h);
  }

  setPaused(paused) {
    this.paused = paused;
    this.sync();
  }

  sync() {
    const run = !this.destroyed && !this.paused && this.visible && !document.hidden;
    if (run && !this.frame) {
      this.lastFrame = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    } else if (!run && this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    document.removeEventListener('visibilitychange', this.hidden);
    this.canvas.remove();
  }
}
