(() => {
  if (parent === window) return;
  const proposal = new URLSearchParams(location.search).get('proposal');
  const state = () => window.particleAtlas?.state || window.particleStudies?.state || window.particlePreview?.state;
  const send = message => parent.postMessage({ ...message, proposal }, location.origin);
  const publish = () => {
    const current = state();
    if (!current) return;
    const values = current.params || current.settings;
    const entries = Object.entries(values).map(([key, value]) => {
      const input = document.getElementById(`param-${key}`) || document.getElementById({ grain: 'grain-level', light: 'light-level' }[key] || key);
      const label = input?.labels?.[0] || input?.closest('label');
      const copy = label?.cloneNode(true);
      copy?.querySelectorAll('input, output, svg').forEach(element => element.remove());
      return { key, label: copy?.textContent.trim() || key, value: input?.getAttribute('aria-valuetext') || label?.querySelector('output')?.textContent || String(value) };
    });
    if (current.preset) entries.unshift({ key: 'preset', label: 'Estilo', value: document.querySelector('[data-preset][aria-pressed="true"]').textContent });
    send({ type: 'ordzson:state', values, entries, preset: current.preset });
  };
  const motionButton = () => document.querySelector('#pause, #motion-toggle');
  let lastScrollY = scrollY;
  let scrollFrame = 0;
  let scrollReported = false;
  let scrollIdle = 0;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollIdle);
    scrollIdle = setTimeout(() => { scrollReported = false; }, 120);
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const delta = scrollY - lastScrollY;
      if (!scrollReported && scrollY > 24 && delta > 0) {
        send({ type: 'ordzson:scroll', y: scrollY, delta });
        scrollReported = true;
      }
      lastScrollY = scrollY;
    });
  }, { passive: true });
  document.addEventListener('pointerdown', () => send({ type: 'ordzson:interact' }), { passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') send({ type: 'ordzson:dismiss' });
  });
  document.addEventListener('input', event => {
    if (event.target.matches('input[type="range"]')) queueMicrotask(publish);
  });
  document.addEventListener('click', event => {
    if (event.target.closest('#reset, [data-preset]')) queueMicrotask(publish);
    if (event.target.closest('#pause, #motion-toggle')) {
      queueMicrotask(() => send({ type: 'ordzson:motion-state', paused: motionButton().getAttribute('aria-pressed') === 'true' }));
    }
  });
  window.addEventListener('message', event => {
    if (event.source !== parent || event.origin !== location.origin) return;
    if (event.data?.type === 'ordzson:parameters') {
      const details = document.querySelector('details#parameters, details.tuning');
      if (details) details.open = true;
      else {
        const button = document.querySelector('#parameters');
        if (button?.getAttribute('aria-expanded') !== 'true') button?.click();
      }
      document.querySelector('input[type="range"]')?.focus({ preventScroll: true });
    }
    if (event.data?.type === 'ordzson:feedback') {
      document.querySelector('#feedback, #save-note').textContent = event.data.text;
    }
    if (event.data?.type === 'ordzson:motion' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const button = motionButton();
      if (!button.disabled && (button.getAttribute('aria-pressed') === 'true') !== event.data.paused) button.click();
    }
  });
  window.addEventListener('load', () => {
    publish();
    send({ type: 'ordzson:ready' });
  });
})();
