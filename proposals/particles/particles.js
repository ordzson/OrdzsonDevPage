(() => {
  'use strict';
  const opening = document.querySelector('#opening');
  const canvas = document.querySelector('#particles');
  const ctx = canvas.getContext('2d', { alpha: false });
  const grain = document.querySelector('#grain');
  const grainCtx = grain.getContext('2d');
  const toggle = document.querySelector('#motion-toggle');
  const note = document.querySelector('#motion-note');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!ctx || !grainCtx) return;

  const palettes = {
    prisma: ['#36d9ef', '#44e4b1', '#b3ee62', '#ffd05b', '#ffa064', '#b7f1dd'],
    cristal: ['#73e9ff', '#6aefc4', '#cafa8b', '#ffe09b', '#ffc194', '#d8ffed'],
    flujo: ['#30d4f1', '#46e4c2', '#a9ea70', '#f6d361', '#ffa96b', '#b6f0d5']
  };
  // Pointed crystal splinters, with a long ridge between their lit facets.
  const shardShapes = [
    [[-.98, -.22], [.12, -.37], [.94, .03], [-.48, .36]],
    [[-1, -.15], [.32, -.31], [.91, .08], [-.15, .34]],
    [[-.94, -.26], [1, .02], [-.46, .42]],
    [[-.75, -.28], [.54, -.38], [1, .1], [-.49, .26]],
    [[-.31, -.94], [.36, .2], [.08, .82], [-.37, .32]]
  ];
  // Cache the light spill once per hue; avoid a live blur on every shard.
  const blooms = Object.fromEntries(Object.entries(palettes).map(([name, colors]) => [name, colors.map(color => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 48;
    const spriteCtx = sprite.getContext('2d');
    const glow = spriteCtx.createRadialGradient(24, 24, 0, 24, 24, 24);
    glow.addColorStop(0, color + 'a0');
    glow.addColorStop(.3, color + '45');
    glow.addColorStop(1, color + '00');
    spriteCtx.fillStyle = glow; spriteCtx.fillRect(0, 0, 48, 48);
    return sprite;
  })]));
  let width = 0, height = 0, ratio = 1, particles = [], frame = 0;
  let time = 12, lastTime = 0, lastPaint = 0, mode = 'prisma', density = 65;
  let paused = reduced.matches, onscreen = true, light = .10;
  let framesDrawn = 0, paintTotal = 0;
  const pointer = { x: 0, y: 0, active: false, sx: 0, sy: 0 };
  let seed = 92381;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const colorFor = p => palettes[mode][p.color];
  const defaults = { density: 65, grain: 12, light: 10, preset: 'prisma' };
  const storageKey = 'ordzson-proposals-shards-v1';
  const inputs = { density: document.querySelector('#density'), grain: document.querySelector('#grain-level'), light: document.querySelector('#light-level') };
  const values = () => ({ density, grain: Number(inputs.grain.value), light: Number(inputs.light.value) });
  function updateOutputs() {
    for (const [key, value] of Object.entries(values())) document.querySelector(`#value-${key}`).value = value;
  }
  function persist() {
    updateOutputs();
    try { localStorage.setItem(storageKey, JSON.stringify({ ...values(), preset: mode })); } catch {}
  }
  function applySettings(settings) {
    for (const [key, input] of Object.entries(inputs)) {
      const number = Number(settings[key]);
      input.value = Number.isFinite(number) ? Math.max(Number(input.min), Math.min(Number(input.max), number)) : defaults[key];
    }
    density = Number(inputs.density.value);
    light = Number(inputs.light.value) / 100;
    document.documentElement.style.setProperty('--grain', Number(inputs.grain.value) / 100);
    mode = Object.hasOwn(palettes, settings.preset) ? settings.preset : defaults.preset;
    document.querySelectorAll('[data-preset]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.preset === mode)));
    updateOutputs();
  }

  function makeParticles() {
    seed = 92381;
    const maximum = width < 600 ? 500 : 1150;
    const count = Math.round(maximum * density / 100);
    particles = Array.from({ length: count }, () => {
      const p = {
        x: random(), y: random(), phase: random() * Math.PI * 2,
        size: 2.2 + random() ** 2 * 8.5, depth: .35 + random() * .65,
        speed: .3 + random() * .7, color: Math.floor(random() * 6),
        spin: .11 + random() * .15, tilt: random() * Math.PI * 2,
        dx: 0, dy: 0
      };
      p.vertices = shardShapes[Math.floor(random() * shardShapes.length)].map(([x, y]) =>
        [x * p.size * (.90 + random() * .2), y * p.size * (.85 + random() * .3)]
      );
      p.silhouette = new Path2D();
      p.vertices.forEach(([x, y], i) => i ? p.silhouette.lineTo(x, y) : p.silhouette.moveTo(x, y));
      p.silhouette.closePath();
      p.facet = new Path2D();
      p.facet.moveTo(p.vertices[0][0], p.vertices[0][1]);
      p.facet.lineTo(p.vertices[1][0], p.vertices[1][1]);
      p.facet.lineTo(p.size * .09, p.size * .12);
      p.facet.closePath();
      p.ridge = new Path2D();
      p.ridge.moveTo(...p.vertices[0]);
      p.ridge.lineTo(p.size * .09, p.size * .12);
      p.ridge.lineTo(...p.vertices[2]);
      return p;
    });
  }

  function drawShard(p, x, y, ring, nearCopy) {
    const turn = time * p.spin + p.phase;
    const face = .18 + Math.abs(Math.cos(turn)) * .82;
    const tilt = .65 + Math.abs(Math.sin(turn * .67 + p.tilt)) * .35;
    const rotation = p.phase + time * p.spin * .32 + Math.sin(turn * .4) * .22 + ring * .12;
    const glint = Math.max(0, Math.cos(turn + p.tilt)) ** 10;
    const visibility = (.62 + p.depth * .32) * (1 - nearCopy * .82);
    const scale = .85 + p.depth * .35 + ring * .18;
    const tint = colorFor(p);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(face * scale, tilt * scale);
    ctx.globalCompositeOperation = 'lighter';

    // The color lives inside the crystal; a small light spill softens its edge.
    ctx.globalAlpha = visibility * (.17 + glint * .12);
    ctx.drawImage(blooms[mode][p.color], -p.size * 1.25, -p.size * .8, p.size * 2.5, p.size * 1.6);
    ctx.globalAlpha = visibility * (.34 + face * .23 + glint * .16);
    ctx.fillStyle = tint;
    ctx.fill(p.silhouette);
    ctx.globalAlpha = visibility * (.12 + glint * .22);
    ctx.fillStyle = '#e8fff5'; ctx.fill(p.facet);
    ctx.globalAlpha = visibility * (.48 + glint * .26);
    ctx.strokeStyle = tint; ctx.lineWidth = .48 / Math.max(face, .45);
    ctx.stroke(p.silhouette);
    ctx.globalAlpha = visibility * (.23 + glint * .38);
    ctx.strokeStyle = '#eafff5'; ctx.lineWidth = .4 / Math.max(face, .5);
    ctx.stroke(p.ridge);

    // Only edges facing the light catch it. Highlights change smoothly with rotation.
    const lx = Math.cos(-.9 - rotation), ly = Math.sin(-.9 - rotation);
    for (let i = 0; i < p.vertices.length; i++) {
      const a = p.vertices[i], b = p.vertices[(i + 1) % p.vertices.length];
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const length = Math.hypot(ex, ey) || 1;
      const reflection = Math.max(0, (ey * lx - ex * ly) / length) ** 4;
      if (reflection < .12) continue;
      ctx.globalAlpha = visibility * reflection * (.48 + glint * .4);
      ctx.strokeStyle = '#effff7'; ctx.lineWidth = .65 / Math.max(face, .5);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.globalAlpha = visibility * reflection * (.26 + glint * .3);
      ctx.strokeStyle = tint;
      ctx.lineWidth = .75;
      ctx.beginPath(); ctx.moveTo(a[0] + .5, a[1] + .35); ctx.lineTo(b[0] + .5, b[1] + .35); ctx.stroke();
    }
    ctx.restore();
  }

  function drawGrain() {
    const gw = Math.ceil(width / 1.5), gh = Math.ceil(height / 1.5);
    grain.width = gw; grain.height = gh;
    const img = grainCtx.createImageData(gw, gh);
    const bytes = img.data;
    for (let i = 0; i < bytes.length; i += 4) {
      const value = Math.floor(random() * 180);
      bytes[i] = value * .90; bytes[i + 1] = value; bytes[i + 2] = value * .92; bytes[i + 3] = 100;
    }
    grainCtx.putImageData(img, 0, 0);
  }

  function resize() {
    width = opening.clientWidth; height = opening.clientHeight;
    ratio = Math.min(devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    makeParticles(); drawGrain(); draw(0); schedule();
  }

  function draw(dt) {
    const began = performance.now();
    ctx.fillStyle = '#060808'; ctx.fillRect(0, 0, width, height);
    if (light > 0) {
      const left = ctx.createRadialGradient(-width * .1, height * .55, 0, -width * .1, height * .55, width * .65);
      left.addColorStop(0, `rgba(35,154,152,${light * .65})`); left.addColorStop(1, 'rgba(35,154,152,0)');
      ctx.fillStyle = left; ctx.fillRect(0, 0, width, height);
      const right = ctx.createRadialGradient(width * 1.12, height * .75, 0, width * 1.12, height * .75, width * .55);
      right.addColorStop(0, `rgba(203,123,47,${light * .65})`); right.addColorStop(1, 'rgba(203,123,47,0)');
      ctx.fillStyle = right; ctx.fillRect(0, 0, width, height);
    }
    const ease = 1 - Math.exp(-dt * 6);
    const autoX = width * (.50 + Math.sin(time * .17) * .23);
    const autoY = height * (.31 + Math.cos(time * .13) * .15);
    const targetX = pointer.active ? pointer.x : autoX;
    const targetY = pointer.active ? pointer.y : autoY;
    pointer.sx += (targetX - pointer.sx) * ease;
    pointer.sy += (targetY - pointer.sy) * ease;
    const radius = Math.min(width * .2, 230);

    for (const p of particles) {
      let x = p.x * width, y = p.y * height;
      const drift = time * .28 * p.speed;
      x += Math.sin(drift + p.phase + p.y * 9) * (14 + p.depth * 24);
      y += Math.cos(drift * .7 + p.phase + p.x * 8) * (9 + p.depth * 18);
      if (mode === 'flujo') {
        y += Math.sin(p.x * 8 + time * .18) * 36;
        x += Math.cos(p.y * 6 + time * .14) * 24;
      }
      const dx = x - pointer.sx, dy = y - pointer.sy;
      const distance = Math.hypot(dx, dy) || 1;
      const ring = Math.exp(-Math.pow((distance - radius * .7) / (radius * .24), 2));
      const force = Math.max(0, 1 - distance / radius);
      const magnitude = pointer.active ? 28 : 12;
      const targetDx = (dx / distance * force - dy / distance * ring * .45) * magnitude;
      const targetDy = (dy / distance * force + dx / distance * ring * .45) * magnitude;
      p.dx += (targetDx - p.dx) * ease; p.dy += (targetDy - p.dy) * ease;
      x += p.dx; y += p.dy;
      // Quiet the copy without enclosing it in a panel; the field remains continuous.
      const nearCopy = Math.exp(-Math.pow((x - width / 2) / (width * .29), 4)) * Math.exp(-Math.pow((y - 270) / 190, 4));
      drawShard(p, x, y, ring, nearCopy);
    }
    ctx.globalAlpha = 1;
    framesDrawn++; paintTotal += performance.now() - began;
  }

  function animate(now) {
    frame = 0;
    if (paused || !onscreen || document.hidden) return;
    const interval = width < 600 ? 1000 / 30 : 1000 / 60;
    if (now - lastPaint >= interval - 1) {
      const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) : 1 / 60;
      lastTime = now; lastPaint = now; time += dt; draw(dt);
    }
    schedule();
  }
  function schedule() {
    if (!frame && !paused && onscreen && !document.hidden) frame = requestAnimationFrame(animate);
  }
  function syncMotion() {
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Reanudar animación' : 'Pausar animación');
    note.textContent = reduced.matches && paused ? 'Movimiento reducido activado' : paused ? 'Animación en pausa' : 'Responde al cursor';
    lastTime = 0;
    if (paused) { cancelAnimationFrame(frame); frame = 0; } else schedule();
  }

  opening.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reduced.matches) return;
    const rect = opening.getBoundingClientRect();
    pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; pointer.active = true;
  }, { passive: true });
  opening.addEventListener('pointerleave', () => { pointer.active = false; });
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.preset;
    document.querySelectorAll('[data-preset]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
    draw(0); persist();
  }));
  document.querySelector('#density').addEventListener('input', event => { density = Number(event.target.value); makeParticles(); draw(0); });
  document.querySelector('#grain-level').addEventListener('input', event => { document.documentElement.style.setProperty('--grain', Number(event.target.value) / 100); });
  document.querySelector('#light-level').addEventListener('input', event => { light = Number(event.target.value) / 100; draw(0); });
  Object.values(inputs).forEach(input => input.addEventListener('input', persist));
  document.querySelector('#reset').addEventListener('click', () => {
    applySettings(defaults); persist(); makeParticles(); draw(0);
    document.querySelector('#save-note').textContent = 'Parámetros originales restaurados.';
  });
  document.querySelector('#copy-link').addEventListener('click', async () => {
    if (parent !== window) { parent.postMessage({ type: 'ordzson:share', proposal: new URLSearchParams(location.search).get('proposal') }, location.origin); return; }
    const url = new URL(location.href);
    for (const [key, value] of Object.entries({ ...values(), preset: mode })) url.searchParams.set(key, value);
    try {
      await navigator.clipboard.writeText(url.href);
      document.querySelector('#save-note').textContent = 'Enlace copiado con tus ajustes.';
    } catch {
      history.replaceState(null, '', url);
      document.querySelector('#save-note').textContent = 'Tus ajustes están en la dirección. Puedes copiarla.';
    }
  });
  toggle.addEventListener('click', () => { paused = !paused; syncMotion(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; syncMotion(); draw(0); });
  document.addEventListener('visibilitychange', () => { lastTime = 0; if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else schedule(); });
  new IntersectionObserver(entries => {
    onscreen = entries[0].isIntersecting;
    if (!onscreen) { cancelAnimationFrame(frame); frame = 0; } else { lastTime = 0; schedule(); }
  }).observe(opening);
  new ResizeObserver(resize).observe(opening);
  // Read-only diagnostics for verifying this motion study in the browser.
  window.particlePreview = { get state() { return { material: 'light-shards', mode, preset: mode, params: values(), paused, onscreen, count: particles.length, framesDrawn, averagePaintMs: +(paintTotal / Math.max(1, framesDrawn)).toFixed(2), reducedMotion: reduced.matches }; } };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch {}
  const initial = { ...defaults, ...saved };
  const query = new URLSearchParams(location.search);
  for (const key of Object.keys(defaults)) if (query.has(key) && query.get(key).trim() !== '') initial[key] = query.get(key);
  applySettings(initial);
  syncMotion(); resize();
})();
