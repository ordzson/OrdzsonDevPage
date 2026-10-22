(() => {
  'use strict';
  const stage = document.querySelector('#stage');
  const canvas = document.querySelector('#field');
  const ctx = canvas.getContext('2d');
  const fields = document.querySelector('#parameter-fields');
  const motionButton = document.querySelector('#motion-toggle');
  const motionLabel = document.querySelector('#motion-label');
  const saveNote = document.querySelector('#save-note');
  const controls = document.querySelector('#parameters');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'ordzson-proposals-studies-v2';
  const looks = {
    orbita: {
      name: 'Órbita', kind: 'Perlas orbitales', note: 'Movimiento en equilibrio.',
      description: 'Perlas luminosas, órbitas lentas y espacio para respirar.',
      parameters: {
        density: { label: 'Perlas', min: 16, max: 160, step: 8, value: 56, unit: '' },
        size: { label: 'Tamaño', min: 1, max: 8, step: .5, value: 3.5, unit: ' px' },
        speed: { label: 'Velocidad', min: .1, max: 2, step: .05, value: .35, unit: '×' },
        character: { label: 'Profundidad', min: 0, max: 100, step: 5, value: 65, unit: '%' }
      }
    },
    seda: {
      name: 'Seda', kind: 'Filamentos fluidos', note: 'Lo digital también puede ser natural.',
      description: 'Un tejido de partículas verdes que fluye como una tela muy ligera.',
      parameters: {
        density: { label: 'Partículas', min: 160, max: 2240, step: 80, value: 1120, unit: '' },
        size: { label: 'Grosor', min: .25, max: 2, step: .05, value: .8, unit: ' px' },
        speed: { label: 'Velocidad', min: .05, max: 1.5, step: .05, value: .3, unit: '×' },
        character: { label: 'Ondulación', min: 20, max: 100, step: 5, value: 75, unit: '%' }
      }
    },
    vector: {
      name: 'Vector', kind: 'Trazos cinéticos', note: 'Siempre hacia adelante.',
      description: 'Trazos direccionales, energía cálida y una composición gráfica más contundente.',
      parameters: {
        density: { label: 'Trazos', min: 24, max: 360, step: 12, value: 360, unit: '' },
        size: { label: 'Longitud', min: 8, max: 80, step: 2, value: 80, unit: ' px' },
        speed: { label: 'Velocidad', min: .1, max: 3, step: .1, value: 1, unit: '×' },
        character: { label: 'Estela', min: 0, max: 100, step: 5, value: 100, unit: '%' }
      }
    },
    aero: {
      name: 'Aero', kind: 'Frutiger Aero · Burbujas', note: 'Un futuro más luminoso.',
      description: 'Burbujas de agua, reflejos brillantes y naturaleza. Una lectura Frutiger Aero.',
      parameters: {
        density: { label: 'Burbujas', min: 8, max: 88, step: 4, value: 88, unit: '' },
        size: { label: 'Diámetro', min: 8, max: 80, step: 2, value: 72, unit: ' px' },
        speed: { label: 'Velocidad', min: .05, max: 1.5, step: .05, value: .4, unit: '×' },
        character: { label: 'Reflejos', min: 0, max: 100, step: 5, value: 80, unit: '%' }
      }
    }
  };
  const defaults = id => Object.fromEntries(Object.entries(looks[id].parameters).map(([key, spec]) => [key, spec.value]));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const normalize = (id, values) => Object.fromEntries(Object.entries(looks[id].parameters).map(([key, spec]) => {
    const value = typeof values?.[key] === 'number' && Number.isFinite(values[key]) ? values[key] : spec.value;
    const snapped = spec.min + Math.round((value - spec.min) / spec.step) * spec.step;
    return [key, +clamp(snapped, spec.min, spec.max).toFixed(3)];
  }));
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { /* Defaults work without storage. */ }
  const settings = Object.fromEntries(Object.keys(looks).map(id => [id, normalize(id, stored[id])]));
  const query = new URLSearchParams(location.search);
  let world = Object.hasOwn(looks, query.get('look')) ? query.get('look') : 'orbita';
  const shared = {};
  for (const key of Object.keys(looks[world].parameters)) {
    if (query.has(key) && Number.isFinite(Number(query.get(key)))) shared[key] = Number(query.get(key));
  }
  settings[world] = normalize(world, { ...settings[world], ...shared });
  let width = 0, height = 0, dpr = 1, particles = [], frame = 0;
  let time = 18, lastTime = 0, lastPaint = 0, framesDrawn = 0, paintTotal = 0;
  let paused = reduced.matches, onscreen = true, seed = 381491;
  let copyBounds = { x: 0, y: 0, width: 1, height: 1 };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, active: false };
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const wrap = (value, range) => ((value % range) + range) % range;
  const format = (id, value) => new Intl.NumberFormat('es-GT', { maximumFractionDigits: 2 }).format(value) + looks[world].parameters[id].unit;

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); }
    catch { saveNote.textContent = 'Ajustes activos durante esta visita.'; }
  }
  function cleanUrl(id) {
    const url = new URL(location.href);
    for (const key of Object.keys(looks[id].parameters)) url.searchParams.delete(key);
    url.searchParams.set('look', id);
    history.replaceState(null, '', url);
  }
  function renderParameters() {
    fields.replaceChildren();
    for (const [id, spec] of Object.entries(looks[world].parameters)) {
      const label = document.createElement('label');
      label.className = 'parameter-field';
      label.htmlFor = `param-${id}`;
      const row = document.createElement('span');
      const text = document.createElement('span');
      text.textContent = spec.label;
      const output = document.createElement('output');
      output.htmlFor = `param-${id}`;
      output.textContent = format(id, settings[world][id]);
      const input = document.createElement('input');
      Object.assign(input, { type: 'range', id: `param-${id}`, min: spec.min, max: spec.max, step: spec.step, value: settings[world][id] });
      input.dataset.parameter = id;
      input.setAttribute('aria-valuetext', output.textContent);
      input.addEventListener('input', () => {
        settings[world][id] = Number(input.value);
        output.textContent = format(id, settings[world][id]);
        input.setAttribute('aria-valuetext', output.textContent);
        persist(); cleanUrl(world);
        if (ctx) {
          if (id === 'density') makeParticles();
          draw(0);
        }
      });
      row.append(text, output); label.append(row, input); fields.append(label);
    }
  }
  function choose(id) {
    if (!Object.hasOwn(looks, id)) return;
    world = id;
    document.body.dataset.world = id;
    document.title = `Ordzson · ${looks[id].name} · Partículas`;
    document.querySelectorAll('[data-look]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.look === id)));
    document.querySelector('#look-kind').textContent = looks[id].kind;
    document.querySelector('#parameter-name').textContent = looks[id].name;
    document.querySelector('#look-description').textContent = looks[id].description;
    document.querySelector('#world-note').textContent = looks[id].note;
    saveNote.textContent = 'Tus ajustes se guardan por propuesta.';
    cleanUrl(id); renderParameters();
    time = 18; lastTime = 0; framesDrawn = 0; paintTotal = 0;
    if (ctx) resize();
  }
  document.querySelectorAll('[data-look]').forEach(button => button.addEventListener('click', () => choose(button.dataset.look)));
  document.querySelector('#reset').addEventListener('click', () => {
    settings[world] = defaults(world);
    persist(); cleanUrl(world); renderParameters();
    if (ctx) { makeParticles(); draw(0); }
    saveNote.textContent = 'Valores originales restaurados.';
  });
  document.querySelector('#copy-link').addEventListener('click', async () => {
    if (window.parent !== window) { window.parent.postMessage({ type: 'ordzson:share', proposal: new URLSearchParams(location.search).get('proposal') }, location.origin); return; }
    const url = new URL(location.href);
    url.search = '';
    url.searchParams.set('look', world);
    for (const [key, value] of Object.entries(settings[world])) url.searchParams.set(key, value);
    try {
      await navigator.clipboard.writeText(url.href);
      saveNote.textContent = 'Enlace copiado con tus cuatro ajustes.';
    } catch {
      history.replaceState(null, '', url);
      saveNote.textContent = 'Tus ajustes están en la URL. Puedes copiarla.';
    }
  });
  controls.open = false;

  function makePearl(warm) {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 96;
    const c = sprite.getContext('2d');
    const halo = c.createRadialGradient(48, 48, 8, 48, 48, 48);
    halo.addColorStop(0, warm ? '#f9cda64d' : '#9de8ef55'); halo.addColorStop(1, '#9de8ef00');
    c.fillStyle = halo; c.fillRect(0, 0, 96, 96);
    const face = c.createRadialGradient(40, 37, 1, 48, 48, 22);
    face.addColorStop(0, '#fffef0'); face.addColorStop(.24, warm ? '#ffe8ce' : '#edf5f2');
    face.addColorStop(.65, warm ? '#c79774' : '#81bac4'); face.addColorStop(1, '#2f657d');
    c.fillStyle = face; c.beginPath(); c.arc(48, 48, 21, 0, Math.PI * 2); c.fill();
    return sprite;
  }
  function makeBubble(green) {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 192;
    const c = sprite.getContext('2d');
    const face = c.createRadialGradient(69, 54, 4, 99, 103, 80);
    face.addColorStop(0, '#ffffff28'); face.addColorStop(.45, '#e7ffff08');
    face.addColorStop(.76, green ? '#9de26830' : '#62cef336');
    face.addColorStop(.94, green ? '#52b85278' : '#2299c88c'); face.addColorStop(1, '#eeffffd9');
    c.fillStyle = face; c.beginPath(); c.arc(96, 96, 78, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#eeffffba'; c.lineWidth = 1.6; c.stroke();
    const shine = c.createLinearGradient(55, 28, 78, 69);
    shine.addColorStop(0, '#fffffff0'); shine.addColorStop(1, '#ffffff08');
    c.fillStyle = shine; c.beginPath(); c.ellipse(71, 46, 32, 12, -.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#fcffffbd'; c.lineWidth = 3.5; c.lineCap = 'round';
    c.beginPath(); c.arc(96, 96, 68, Math.PI * .66, Math.PI * .91); c.stroke();
    c.strokeStyle = green ? '#c6ff7bd4' : '#a7faffcc'; c.lineWidth = 2;
    c.beginPath(); c.arc(96, 96, 73, .2, 1); c.stroke();
    return sprite;
  }
  const pearls = ctx ? [makePearl(false), makePearl(true)] : [];
  const bubbles = ctx ? [makeBubble(false), makeBubble(true)] : [];
  function makeParticles() {
    seed = 381491;
    particles = Array.from({ length: settings[world].density }, (_, index) => ({
      x: random(), y: random(), phase: random() * Math.PI * 2,
      scale: .3 + random() ** 1.5 * 1.2, depth: .2 + random() * .8,
      velocity: .45 + random() * .75, band: index % 3, color: random() > .84 ? 1 : 0
    }));
    if (world === 'aero') particles.sort((a, b) => a.scale - b.scale);
  }
  function resize() {
    width = stage.clientWidth; height = stage.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const stageRect = stage.getBoundingClientRect();
    const copyRect = document.querySelector('#hero-copy').getBoundingClientRect();
    copyBounds = { x: copyRect.x - stageRect.x, y: copyRect.y - stageRect.y, width: copyRect.width, height: copyRect.height };
    makeParticles(); draw(0); schedule();
  }
  function quiet(x, y) {
    const dx = (x - copyBounds.x - copyBounds.width / 2) / (copyBounds.width * .63);
    const dy = (y - copyBounds.y - copyBounds.height / 2) / (copyBounds.height * .7);
    return 1 - .87 * Math.exp(-(dx ** 4 + dy ** 4));
  }
  function orbit(s) {
    const mobile = width < 700;
    const cx = width * (mobile ? .51 : .78) + pointer.sx * 12;
    const cy = mobile ? 650 : 352;
    const radius = Math.min(width * (mobile ? .40 : .225), 335);
    const depth = s.character / 100;
    for (let band = 0; band < 3; band++) {
      const rotation = -.76 + band * .64 + Math.sin(time * .028) * .12;
      const r = radius * (.64 + band * .17);
      ctx.strokeStyle = band === 1 ? '#c8bc9c36' : '#9cd4df38';
      ctx.lineWidth = .65; ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * (.22 + depth * .17), rotation, 0, Math.PI * 2); ctx.stroke();
    }
    for (const p of particles) {
      const theta = p.phase + time * s.speed * (p.band === 1 ? -.28 : .22) * p.velocity;
      const rotation = -.76 + p.band * .64 + Math.sin(time * .028) * .12;
      const r = radius * (.64 + p.band * .17);
      const a = Math.cos(theta) * r;
      const b = Math.sin(theta) * r * (.22 + depth * .17);
      const x = cx + a * Math.cos(rotation) - b * Math.sin(rotation);
      const y = cy + a * Math.sin(rotation) + b * Math.cos(rotation) + pointer.sy * 9;
      const z = (Math.sin(theta) + 1) / 2;
      const size = s.size * (1 - depth * .5 + z * depth) * (.55 + p.scale * .65);
      ctx.globalAlpha = (.38 + z * .62) * quiet(x, y);
      ctx.drawImage(pearls[p.color], x - size * 2.3, y - size * 2.3, size * 4.6, size * 4.6);
    }
  }
  function silk(s) {
    const mobile = width < 700;
    const cx = width * (mobile ? .49 : .255), cy = mobile ? 648 : 367;
    const spread = width * (mobile ? 1.18 : .6);
    const amplitude = 30 + s.character * 1.05;
    const flow = time * s.speed * .045;
    const wave = u => Math.sin(u * Math.PI * 2 + time * .055) * amplitude + Math.cos(u * Math.PI) * 45;
    ctx.lineCap = 'round';
    for (const p of particles) {
      const u = wrap(p.x + flow * p.velocity, 1);
      const envelope = Math.sin(u * Math.PI);
      const lane = (p.y - .5) * 210 * envelope;
      const twist = Math.sin(u * Math.PI * 3 + p.y * 2.2 + time * .035) * s.character * .48;
      const x = cx + (u - .5) * spread + pointer.sx * 12 * envelope;
      const y = cy + wave(u) + lane + twist + pointer.sy * 9;
      const previousU = u - (.003 + p.depth * .009);
      const previousY = cy + wave(previousU) + (p.y - .5) * 210 * Math.sin(previousU * Math.PI)
        + Math.sin(previousU * Math.PI * 3 + p.y * 2.2 + time * .035) * s.character * .48 + pointer.sy * 9;
      ctx.globalAlpha = (.13 + p.depth * .36) * Math.sin(u * Math.PI) ** .5 * quiet(x, y);
      ctx.strokeStyle = p.color ? '#829b49' : '#2c8363';
      ctx.lineWidth = s.size * (.45 + p.depth * .8);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - (u - previousU) * spread, previousY); ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }
  function vectors(s) {
    const span = s.size * 3;
    const travel = time * s.speed * 82;
    for (const p of particles) {
      const x = wrap(p.x * (width + span * 2) + travel * p.velocity, width + span * 2) - span;
      const y = wrap(p.y * (height + span * 2) - travel * p.velocity * .58, height + span * 2) - span;
      const length = s.size * (.35 + p.depth * .9);
      const alpha = (.14 + p.depth * .43) * quiet(x, y);
      ctx.strokeStyle = p.color ? '#63351d' : '#fff5cb';
      ctx.lineWidth = .65 + p.depth * 1.15;
      ctx.globalAlpha = alpha * .28 * s.character / 100;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - length * (1 + s.character / 45), y + length * (.58 + s.character / 78)); ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - length * .62, y + length * .36); ctx.stroke();
    }
  }
  function aero(s) {
    for (const p of particles) {
      const size = s.size * (.5 + p.scale * 1.12);
      const travel = time * s.speed * (17 + p.depth * 13);
      const x = p.x * width + Math.sin(time * .15 * p.velocity + p.phase) * (12 + p.depth * 20) + pointer.sx * p.depth * 16;
      const y = wrap(p.y * (height + size * 3) - travel, height + size * 3) - size;
      ctx.globalAlpha = (.24 + s.character / 100 * .62) * (.35 + quiet(x, y) * .65);
      ctx.drawImage(bubbles[p.color], x - size / 2, y - size / 2, size, size);
    }
  }
  function draw(dt) {
    const began = performance.now();
    ctx.clearRect(0, 0, width, height);
    const ease = 1 - Math.exp(-dt * 3);
    pointer.sx += ((pointer.active ? pointer.x : 0) - pointer.sx) * ease;
    pointer.sy += ((pointer.active ? pointer.y : 0) - pointer.sy) * ease;
    const s = settings[world];
    if (world === 'orbita') orbit(s);
    else if (world === 'seda') silk(s);
    else if (world === 'vector') vectors(s);
    else aero(s);
    ctx.globalAlpha = 1;
    framesDrawn++; paintTotal += performance.now() - began;
  }
  function animate(now) {
    frame = 0;
    if (paused || !onscreen || document.hidden) return;
    const interval = width < 700 ? 1000 / 30 : 1000 / 60;
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
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Reanudar animación' : 'Pausar animación');
    motionLabel.textContent = paused ? 'Reanudar' : 'Pausar';
    if (reduced.matches && paused) saveNote.textContent = 'Movimiento reducido: partículas en pausa.';
    lastTime = 0;
    if (paused) { cancelAnimationFrame(frame); frame = 0; }
    else schedule();
  }
  motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; syncMotion(); if (ctx) draw(0); });
  stage.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reduced.matches) return;
    const bounds = stage.getBoundingClientRect();
    pointer.x = (event.clientX - bounds.left) / width * 2 - 1;
    pointer.y = (event.clientY - bounds.top) / Math.min(height, 900) * 2 - 1;
    pointer.active = true;
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { pointer.active = false; });
  document.addEventListener('visibilitychange', () => {
    lastTime = 0;
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else if (ctx) schedule();
  });
  if (!ctx) {
    canvas.hidden = true;
    paused = true; motionButton.disabled = true;
    choose(world); saveNote.textContent = 'El navegador no admite la animación Canvas.';
    return;
  }
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries => {
    onscreen = entries[0].isIntersecting;
    if (!onscreen) { cancelAnimationFrame(frame); frame = 0; }
    else { lastTime = 0; schedule(); }
  }).observe(stage);
  document.fonts.ready.then(resize);
  window.particleStudies = {
    get state() {
      return { world, paused, onscreen, count: particles.length, settings: { ...settings[world] }, framesDrawn,
        averagePaintMs: +(paintTotal / Math.max(1, framesDrawn)).toFixed(2), reducedMotion: reduced.matches };
    }
  };
  choose(world); syncMotion();
})();
