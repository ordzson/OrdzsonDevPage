const TAU = Math.PI * 2;

// With no refraction the film is static. Cache its gradients and inset shading
// once, then move those transparent images in a single canvas under the glass.
export class AeroBubbleSprites {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'aero-bubble-sprites';
    this.canvas.width = this.canvas.height = 1;
    this.ctx = this.canvas.getContext('2d');
    this.canCacheGlass = 'filter' in this.ctx && typeof this.ctx.roundRect === 'function';
    this.cache = new Map();
  }

  resize(width, height, ratio, panel) {
    this.width = width;
    this.height = height;
    if (this.ratio !== ratio) this.cache.clear();
    this.ratio = ratio;
    this.panel = panel;
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  update(light, color, blur, saturation) {
    if (this.color !== color) this.cache.clear();
    if (this.blur !== blur || this.saturation !== saturation) {
      for (const sprite of this.cache.values()) sprite.blurred = null;
      // Aurora's uniform ground is also seen through the saturated glass.
      const ground = [250, 253, 253], luminance = 250 * .213 + 253 * .787;
      this.glassGround = `rgb(${ground.map(channel => Math.max(0, Math.min(255, luminance + (channel - luminance) * saturation))).join(' ')})`;
    }
    this.color = color;
    this.light = light / 100;
    this.blur = blur;
    this.saturation = saturation;
  }

  panelPath() {
    const { x, y, width, height, radius } = this.panel;
    this.ctx.roundRect(x, y, width, height, radius);
  }

  beginFrame(cachedGlass) {
    this.cachedGlass = cachedGlass;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.globalAlpha = this.light;
    this.ctx.save();
    if (cachedGlass) {
      this.ctx.beginPath();
      this.ctx.rect(0, 0, this.width, this.height);
      this.panelPath();
      this.ctx.clip('evenodd');
    }
  }

  endFrame(lenses) {
    this.ctx.restore();
    if (!this.cachedGlass) return;
    this.ctx.save();
    this.ctx.beginPath();
    this.panelPath();
    this.ctx.clip();
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = this.glassGround;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.globalAlpha = this.light;
    const panel = this.panel, padding = Math.ceil(this.blur * 3);
    for (const { hue, x, y, diameter } of lenses) {
      if (x + diameter + padding < panel.x || y + diameter + padding < panel.y || x - padding > panel.x + panel.width || y - padding > panel.y + panel.height || this.light === 0) continue;
      const sprite = this.sprite(hue, diameter);
      if (!sprite.blurred) {
        const canvas = document.createElement('canvas');
        const extent = diameter + padding * 2;
        canvas.width = canvas.height = Math.ceil(extent * this.ratio);
        const ctx = canvas.getContext('2d');
        ctx.filter = `blur(${this.blur * this.ratio}px) saturate(${this.saturation})`;
        ctx.drawImage(sprite.canvas, padding * this.ratio, padding * this.ratio);
        sprite.blurred = canvas;
      }
      this.ctx.drawImage(sprite.blurred, x - padding, y - padding, diameter + padding * 2, diameter + padding * 2);
    }
    this.ctx.restore();
  }

  sprite(hue, diameter) {
    const key = `${hue}:${diameter}`;
    if (this.cache.has(key)) return this.cache.get(key);
    // Size sliders can visit many diameters without rebuilding the particle list.
    if (this.cache.size >= 64) this.cache.clear();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.ceil(diameter * this.ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(canvas.width / diameter, canvas.height / diameter);
    const radius = diameter / 2, color = this.color / 100;
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, TAU);
    ctx.clip();

    // Match the existing CSS film, including its cool-neutral outer shading.
    const radial = (x, y, stops, rx = Math.hypot(Math.max(x, 1 - x), Math.max(y, 1 - y)), ry = rx) => {
      ctx.save();
      ctx.translate(x * diameter, y * diameter);
      ctx.scale(rx * diameter, ry * diameter);
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      for (const [at, value] of stops) gradient.addColorStop(at, value);
      ctx.fillStyle = gradient;
      ctx.fillRect(-2 / rx, -2 / ry, 4 / rx, 4 / ry);
      ctx.restore();
    };
    radial(.36, .30, [
      [0, `hsl(${hue} 90% 62% / ${color * .12})`],
      [.58, `hsl(${hue} 90% 57% / ${color * .3})`],
      [.87, `hsl(${hue} 85% 52% / ${color * .62})`],
      [1, 'transparent']
    ]);
    radial(.40, .35, [[0, 'transparent'], [.66, 'transparent'], [.83, '#d8e9f014'], [.96, '#ffffff61'], [.99, '#ffffff8c']]);
    radial(.45, .37, [[0, '#ffffff00'], [.67, '#ffffff00'], [.86, '#aac1d41f'], [.96, '#ffffff99'], [1, '#ffffff00']]);
    radial(.69, .88, [[0, '#ffffff52'], [1, '#ffffff00']], .42, .17);
    radial(.32, .18, [[0, '#ffffffc9'], [1, '#ffffff00']], .33, .13);

    // Inset shadows are rasterized once instead of filtered on every frame.
    for (const [x, y, blur, shade] of [[-1, -2, 4, `hsl(${hue} ${65 * color}% 53% / .24)`], [1, 2, 2, '#ffffffc9']]) {
      ctx.save();
      ctx.shadowColor = shade;
      const scale = canvas.width / diameter;
      ctx.shadowOffsetX = x * scale;
      ctx.shadowOffsetY = y * scale;
      ctx.shadowBlur = blur * scale;
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.rect(-20, -20, diameter + 40, diameter + 40);
      ctx.arc(radius, radius, Math.max(.5, radius - 1), 0, TAU, true);
      ctx.fill('evenodd');
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(radius, radius, Math.max(.5, radius - .5), 0, TAU);
    ctx.strokeStyle = `hsl(${hue} ${65 * color}% 53% / .58)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    const sprite = { canvas, blurred: null };
    this.cache.set(key, sprite);
    return sprite;
  }

  draw(hue, x, y, diameter) {
    // Queued bubbles below the section need neither a sprite nor a draw call.
    if (x + diameter <= 0 || y + diameter <= 0 || x >= this.width || y >= this.height || this.light === 0) return;
    this.ctx.drawImage(this.sprite(hue, diameter).canvas, x, y, diameter, diameter);
  }

  release() {
    this.cache.clear();
    this.canvas.width = this.canvas.height = 1;
  }
}
