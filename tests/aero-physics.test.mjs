import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AeroPhysics } from '../proposals/atlas/aero-physics.js';

function fixture(count, width = 1440, height = 690, size = 68) {
  let seed = 716023;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const particles = Array.from({ length: count }, () => ({
    u: random(), v: random(), a: random() * Math.PI * 2,
    depth: random(), speed: random(), side: random() < .5 ? random() * .23 : .77 + random() * .23
  }));
  return new AeroPhysics(particles, width, height, size, width <= 700, random);
}

function check(field) {
  for (let i = 0; i < field.bodies.length; i++) {
    const body = field.bodies[i], inset = body.r + field.gap;
    assert.ok([body.x, body.y, body.r, body.vx, body.vy].every(Number.isFinite));
    assert.ok(body.x >= inset - .0001 && body.x <= field.width - inset + .0001);
    // Vertical travel is open: bubbles leave above and may queue below.
    const queueHeight = field.bodies.reduce((height, other) => height + other.r * 2 + field.gap + 1, field.height);
    assert.ok(body.y >= -body.r - field.gap - 2 && body.y <= queueHeight);
    for (const other of field.bodies.slice(i + 1)) {
      assert.ok(Math.hypot(body.x - other.x, body.y - other.y) >= body.r + other.r + field.gap - .0001, 'Bubbles overlap');
    }
  }
}

test('initial layouts and moving bubbles stay separate at default and extreme settings', () => {
  for (const [width, height] of [[320, 650], [390, 650], [768, 660], [1440, 690]]) {
    for (const size of [0, 68, 100]) for (const density of [0, 42, 100]) {
      const count = Math.round((width <= 700 ? 31 : 45) * density / 100);
      const field = fixture(count, width, height, size);
      assert.equal(field.bodies.length, count);
      check(field);
      for (let frame = 0; frame < 240; frame++) {
        field.step(.05 * 100 / 28, Math.sin(frame / 20) * .5, Math.cos(frame / 20) * .5);
        check(field);
      }
    }
  }
});

test('approaching bubbles exchange velocity and bounce apart', () => {
  const field = fixture(2, 400, 300);
  Object.assign(field.bodies[0], { x: 150, y: 150, r: 20, vx: 15, vy: 0 });
  Object.assign(field.bodies[1], { x: 193, y: 150, r: 20, vx: -15, vy: 0 });
  for (let i = 0; i < 10; i++) { field.step(1 / 60); check(field); }
  assert.ok(field.bodies[0].vx < 0 && field.bodies[1].vx > 0);
});

test('a packed contact chain keeps rising when the collision solver exhausts its passes', () => {
  const field = fixture(3, 120 / .98, 300);
  field.bodies.forEach((body, index) => Object.assign(body, {
    x: 20 + field.gap + index * (40 + field.gap), y: 150, r: 20,
    vx: index === 0 ? 15 : -15, vy: -10, drift: 0, rise: 10
  }));
  for (let frame = 0; frame < 60; frame++) {
    const previous = field.bodies.map(body => body.y);
    field.step(1 / 60);
    check(field);
    field.bodies.forEach((body, index) => assert.ok(body.y < previous[index], 'A contact chain must never freeze the field'));
  }
  assert.ok(field.bodies.every(body => body.y < 141));
});

test('side walls reflect velocity while the top remains open', () => {
  const field = fixture(1, 400, 300), body = field.bodies[0];
  Object.assign(body, { x: 23, y: 23, r: 20, vx: -15, vy: -15 });
  field.step(.2);
  assert.ok(body.vx > 0 && body.vy < 0);
  assert.ok(body.y < 23, 'Bubbles keep rising at the upper edge');
  check(field);
  const position = [body.x, body.y];
  field.step(0, .5, .5);
  assert.deepEqual([body.x, body.y], position);
});

test('a downward collision deflection recovers its ascent even against the cursor', () => {
  const field = fixture(1, 400, 650), body = field.bodies[0];
  Object.assign(body, { x: 200, y: 300, vy: 20 });
  for (let i = 0; i < 180; i++) field.step(1 / 60, 0, .5);
  assert.ok(body.vy < -2, 'Buoyancy restores upward travel');
  assert.ok(body.y < 300, 'The bubble continues beyond the collision');
  check(field);
});

test('bubbles recycle only when fully out of view and reenter without overlap', () => {
  const field = fixture(3, 400, 300), [bubble, blocker, queued] = field.bodies;
  Object.assign(bubble, { x: 200, y: -19, r: 20, vy: -10 });
  Object.assign(blocker, { x: 200, y: 321.5, r: 20, vy: -10 });
  Object.assign(queued, { x: 200, y: 363, r: 20, vy: -10 });
  field.step(1 / 60);
  assert.ok(bubble.y < 0, 'Do not recycle while its rim is visible');
  bubble.y = -22;
  field.step(1 / 60);
  assert.ok(bubble.y > field.height + bubble.r, 'Reappear fully below the frame');
  check(field);
  for (let i = 0; i < 180; i++) { field.step(1 / 60); check(field); }
  assert.ok(bubble.y < field.height + bubble.r, 'Recycled bubbles enter the frame');
});

test('bubbles keep circulating at the published section sizes and high density', () => {
  for (const [width, height, count] of [[337, 495, 11], [390, 495, 11], [1440, 417, 17], [320, 495, 31], [768, 417, 45]]) {
    const field = fixture(count, width, height);
    const cycles = field.bodies.map(() => 0);
    for (let frame = 0; frame < 6000; frame++) {
      const previous = field.bodies.map(body => body.y);
      field.step(.1);
      check(field);
      field.bodies.forEach((body, i) => { if (body.y - previous[i] > height) cycles[i]++; });
    }
    assert.ok(cycles.every(count => count >= 2), `Every bubble must complete multiple ascents at ${width}px: ${cycles}`);
  }
});
