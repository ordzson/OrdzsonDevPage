const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

// A small, bounded circle simulation. Keep positions here (including pointer
// forces), so no visual offset can move a bubble through its neighbours.
export class AeroPhysics {
  constructor(particles, width, height, size, mobile, random) {
    this.width = width;
    this.height = height;
    this.random = random;
    this.gap = Math.min(2, Math.min(width, height) * .005);
    this.bodies = particles.map(p => ({
      x: 0, y: 0,
      r: Math.min((12 + p.depth ** 2 * 72) * (.2 + size / 65) * (mobile ? .65 : 1), Math.min(width, height) * .24),
      vx: Math.sin(p.a) * (3 + p.depth * 4), vy: -(4 + p.speed * 11),
      drift: Math.sin(p.a) * (3 + p.depth * 4), rise: 4 + p.speed * 11,
      source: p
    }));
    // Place the largest first. Crowded size/density combinations reduce only
    // circles that cannot fit, rather than starting with intersecting bubbles.
    const placed = [];
    for (const body of [...this.bodies].sort((a, b) => b.r - a.r)) {
      let fits = false;
      while (!fits) {
        for (let attempt = 0; attempt < 100; attempt++) {
          const p = body.source;
          const u = attempt === 0 ? (p.v > .52 ? p.u : p.side) : random();
          const v = attempt === 0 ? p.v : random();
          const inset = body.r + this.gap;
          body.x = inset + u * (width - inset * 2);
          body.y = inset + v * (height - inset * 2);
          fits = placed.every(other => Math.hypot(body.x - other.x, body.y - other.y) >= body.r + other.r + this.gap + .1);
          if (fits) break;
        }
        if (!fits) body.r *= .85;
      }
      placed.push(body);
    }
  }

  bounds(body) {
    const inset = body.r + this.gap;
    if (body.x < inset) { body.x = inset; body.vx = Math.abs(body.vx); body.drift = Math.abs(body.drift); }
    if (body.x > this.width - inset) { body.x = this.width - inset; body.vx = -Math.abs(body.vx); body.drift = -Math.abs(body.drift); }
  }

  recycle(body) {
    // Leave the frame completely before rejoining below it. Find a free entry
    // lane; a crowded bottom queues bubbles offscreen instead of overlapping.
    const inset = body.r + this.gap;
    const others = this.bodies.filter(other => other !== body).sort((a, b) => a.y - b.y);
    let bestX = body.x, bestY = Infinity;
    for (let attempt = 0; attempt < 12; attempt++) {
      const x = attempt ? inset + this.random() * (this.width - inset * 2) : body.x;
      let y = this.height + inset;
      for (const other of others) {
        const clearance = body.r + other.r + this.gap + .1;
        const dx = x - other.x;
        if (Math.abs(dx) >= clearance) continue;
        const dy = Math.sqrt(clearance ** 2 - dx ** 2);
        if (Math.abs(y - other.y) < dy) y = other.y + dy;
      }
      if (y < bestY) { bestX = x; bestY = y; }
      if (bestY === this.height + inset) break;
    }
    body.x = bestX; body.y = bestY;
    body.vx = body.drift; body.vy = -body.rise;
  }

  step(delta, pointerX = 0, pointerY = 0) {
    // Fixed maximum travel per step prevents tunnelling, including at 100% speed.
    const steps = Math.ceil(delta * 60);
    if (!steps) return;
    const dt = delta / steps, bodies = this.bodies;
    for (let step = 0; step < steps; step++) {
      // Finish every reentry before taking the shared, non-overlapping snapshot.
      for (const body of bodies) if (body.y < -body.r - this.gap) this.recycle(body);
      for (const body of bodies) {
        body.previousX = body.x; body.previousY = body.y;
        // Collisions may deflect a bubble down briefly; buoyancy restores its
        // own upward speed smoothly, even under sustained pointer forces.
        body.vx = clamp(body.vx + ((body.drift - body.vx) * .35 + pointerX * 5) * dt, -20, 20);
        body.vy = clamp(body.vy + ((-body.rise - body.vy) * 1.6 + pointerY * 4) * dt, -22, 22);
        body.x += body.vx * dt; body.y += body.vy * dt;
        this.bounds(body);
      }
      // Resolve chains of contacts as well as isolated collisions. A slight
      // clearance keeps the painted rims separate at fractional pixel positions.
      for (let pass = 0; pass < 8; pass++) {
        let contacts = 0;
        for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], b = bodies[j], dx = b.x - a.x, dy = b.y - a.y;
          const minimum = a.r + b.r + this.gap;
          const squared = dx * dx + dy * dy;
          if (squared >= minimum * minimum) continue;
          const distance = Math.sqrt(squared);
          const nx = distance ? dx / distance : 1, ny = distance ? dy / distance : 0;
          const weight = b.r ** 2 / (a.r ** 2 + b.r ** 2);
          const correction = minimum - distance + .001;
          a.x -= nx * correction * weight; a.y -= ny * correction * weight;
          b.x += nx * correction * (1 - weight); b.y += ny * correction * (1 - weight);
          const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (approach < 0) {
            const impulse = approach * 1.96;
            a.vx += impulse * nx * weight; a.vy += impulse * ny * weight;
            b.vx -= impulse * nx * (1 - weight); b.vy -= impulse * ny * (1 - weight);
          }
          contacts++;
        }
        for (const body of bodies) this.bounds(body);
        if (!contacts) break;
      }
      // A packed contact chain can exhaust the solver. Translating the last
      // valid layout upward preserves clearance and lets the cluster leave
      // through the open top instead of freezing every bubble in place.
      if (this.overlaps()) {
        const ascent = bodies.reduce((slowest, body) => Math.min(slowest, body.rise), Infinity) * dt;
        for (const body of bodies) {
          body.x = body.previousX; body.y = body.previousY - ascent;
        }
      }
    }
  }

  overlaps() {
    for (let i = 0; i < this.bodies.length; i++) for (let j = i + 1; j < this.bodies.length; j++) {
      const a = this.bodies[i], b = this.bodies[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + this.gap - .0001) return true;
    }
    return false;
  }
}
