// The run itself: spawning fences, hay bales, ovens and carving knives,
// handing out corn, keeping score and distance, and deciding when the
// turkey is caught or gets away. Deterministic from its seed.
import {
  GOAL_METRES, GROUND_Y, METRES_PER_PX, POINTS, SPAWN, STAGES,
  TURKEY, VIEW, stageFor, worldSpeed,
} from './config.js';
import { makeRandom, pick, range } from './random.js';
import { makeTurkey, stepTurkey, knockTurkey } from './turkey.js';
import { makeFarmer, stepFarmer, windFarmer, farmerCatch, resetFarmer } from './farmer.js';

export const EVENT_OVER = 1;
export const EVENT_HIT = 2;
export const EVENT_PICKUP = 4;
export const EVENT_GOLD = 8;
export const EVENT_STAGE = 16;
export const EVENT_CAUGHT = 32;

export function makeWorld(seed = 1) {
  return {
    seed,
    random: makeRandom(seed),
    time: 0,
    distance: 0,
    score: 0,
    scoreBonus: 0,
    lives: TURKEY.maxLives,
    stage: 0,
    turkey: makeTurkey(),
    farmer: makeFarmer(),
    obstacles: [],
    particles: [],
    banners: [],
    spawnIn: 1.2,
    knifeIn: 4.5,
    cornIn: 0.8,
    over: null,
    overReason: '',
    escaped: false,
    nearMiss: 0,
    caughtCount: 0,
    best: 0,
  };
}

export function resetWorld(world, seed) {
  const fresh = makeWorld(seed ?? world.seed);
  fresh.best = world.best;
  Object.keys(fresh).forEach((key) => { world[key] = fresh[key]; });
  world.random = makeRandom(world.seed);
}

function addBanner(world, text, sub = '') {
  world.banners.push({ text, sub, time: 0, life: 2.4 });
}

function burst(world, x, y, colour, count, speed = 160) {
  for (let i = 0; i < count; i += 1) {
    const angle = world.random() * Math.PI * 2;
    const v = range(world.random, speed * 0.3, speed);
    world.particles.push({
      x, y, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v - 60,
      life: range(world.random, 0.4, 0.9), max: 0.9, colour,
      size: range(world.random, 3, 7),
    });
  }
}

function spawnObstacle(world) {
  const stage = world.stage;
  const roll = world.random();
  let kind = 'fence';
  if (stage === 0) kind = roll < 0.45 ? 'fence' : roll < 0.8 ? 'hay' : 'cornRow';
  else if (stage === 1) kind = roll < 0.35 ? 'fence' : roll < 0.6 ? 'hay' : roll < 0.85 ? 'knifeRow' : 'cornRow';
  else kind = roll < 0.3 ? 'oven' : roll < 0.55 ? 'fence' : roll < 0.8 ? 'knifeRow' : 'hay';
  const x = VIEW.width + 40;

  // Fair spacing: never stack two deadly ground hazards closer than a
  // jump apart. A jump lasts ~0.9 s, so a second fence inside ~300 px of
  // the first would land the turkey on it with no time to jump again.
  if (kind === 'fence' || kind === 'oven' || kind === 'hay') {
    for (const item of world.obstacles) {
      if ((item.kind === 'fence' || item.kind === 'oven' || item.kind === 'hay') && item.x > 700) {
        kind = 'cornRow';
        break;
      }
    }
  }

  if (kind === 'fence') {
    world.obstacles.push({ kind, x, y: GROUND_Y - 46, width: 26, height: 46, deadly: true });
  } else if (kind === 'hay') {
    world.obstacles.push({ kind, x, y: GROUND_Y - 88, width: 64, height: 88, deadly: false });
  } else if (kind === 'oven') {
    world.obstacles.push({ kind, x, y: GROUND_Y - 64, width: 72, height: 64, deadly: true });
  } else if (kind === 'knifeRow') {
    // Knives skim low along the ground, so the turkey jumps them — the
    // same verb as fences and ovens, at a different speed. Nothing flies
    // at jump height, so a jump for a fence never carries the turkey into
    // a knife by surprise.
    const y = range(world.random, 425, 455);
    world.obstacles.push({ kind: 'knife', x, y, width: 56, height: 14, deadly: true, spin: world.random() * Math.PI });
  } else {
    for (let i = 0; i < 3; i += 1) {
      world.obstacles.push({
        kind: world.random() < 0.12 ? 'goldCorn' : 'corn',
        x: x + i * 46, y: GROUND_Y - 120 - (i === 1 ? 46 : 0),
        width: 30, height: 30, deadly: false,
      });
    }
  }
}

function spawnKnife(world) {
  const y = range(world.random, 425, 455);
  world.obstacles.push({
    kind: 'knife', x: VIEW.width + 60, y, width: 56, height: 14,
    deadly: true, spin: world.random() * Math.PI,
  });
}

function overlaps(a, b, shrink = 6) {
  return a.x + shrink < b.x + b.width - shrink && a.x + a.width - shrink > b.x + shrink
    && a.y + shrink < b.y + b.height - shrink && a.y + a.height - shrink > b.y + shrink;
}

function hitObstacle(world, item) {
  const turkey = world.turkey;
  if (turkey.invulnerable > 0 || world.over) return 0;
  if (item.kind === 'hay') {
    // A hay bale only trips a turkey that runs straight into it low.
    if (turkey.onGround && turkey.vx > 60) {
      turkey.stumble = 0.7;
      turkey.vx = -120;
      burst(world, turkey.x + 20, turkey.y + 10, '#d9a441', 8, 120);
      return EVENT_HIT;
    }
    return 0;
  }
  world.lives -= 1;
  knockTurkey(turkey, item.x);
  // A stumble lets the farmer close in — hits are expensive.
  world.farmer.threat = Math.max(40, world.farmer.threat - 90);
  burst(world, turkey.x + 20, turkey.y + 10, '#fff', 14);
  burst(world, turkey.x + 20, turkey.y + 10, '#c0392b', 10);
  world.nearMiss = 0;
  if (world.lives <= 0) {
    world.over = 'caught';
    world.overReason = item.kind === 'oven'
      ? 'The oven got you — dinner is served.'
      : item.kind === 'knife'
        ? 'A carving knife found its mark.'
        : 'You tripped, and the farmer was right there.';
    world.caughtCount += 1;
    return EVENT_OVER | EVENT_CAUGHT;
  }
  return EVENT_HIT;
}

// One fixed step. `input` is {left,right,down,jumpPressed,dashPressed}.
// Returns a bitmask of events for sound and feedback.
export function stepWorld(world, input, dt) {
  if (world.over) return 0;
  let events = 0;
  world.time += dt;
  const speed = worldSpeed(world.distance);
  world.distance += speed * dt * METRES_PER_PX;
  world.score = Math.floor(world.distance) + world.scoreBonus;

  const stage = stageFor(world.distance);
  if (stage !== world.stage) {
    world.stage = stage;
    addBanner(world, STAGES[stage].banner);
    events |= EVENT_STAGE;
  }

  stepTurkey(world.turkey, input, dt);
  stepFarmer(world.farmer, world.turkey, world.obstacles, world.distance, dt);

  // The farmer catches the turkey.
  if (world.turkey.invulnerable <= 0 && farmerCatch(world.farmer, world.turkey)) {
    world.lives -= 1;
    if (world.lives <= 0) {
      world.over = 'caught';
      world.overReason = 'The farmer grabbed you by the drumstick!';
      world.caughtCount += 1;
      burst(world, world.turkey.x + 20, world.turkey.y + 10, '#fff', 18);
      return EVENT_OVER | EVENT_CAUGHT;
    }
    knockTurkey(world.turkey, world.farmer.x);
    windFarmer(world.farmer);
    addBanner(world, 'CAUGHT — but you wriggled free!', 'One life gone. RUN!');
    events |= EVENT_HIT;
  }

  // Spawning.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    spawnObstacle(world);
    const gap = Math.max(SPAWN.minGap, SPAWN.baseGap - world.distance * 0.0011);
    world.spawnIn = gap * range(world.random, 0.8, 1.3);
  }
  world.knifeIn -= dt;
  if (world.knifeIn <= 0) {
    spawnKnife(world);
    world.knifeIn = Math.max(1.8, SPAWN.knifeGap - world.distance * 0.0012) * range(world.random, 0.85, 1.25);
  }
  world.cornIn -= dt;
  if (world.cornIn <= 0) {
    world.obstacles.push({
      kind: world.random() < 0.1 ? 'goldCorn' : 'corn',
      x: VIEW.width + 40, y: range(world.random, GROUND_Y - 200, GROUND_Y - 70),
      width: 30, height: 30, deadly: false,
    });
    world.cornIn = range(world.random, 1.6, 3.2);
  }

  // Move and collide with obstacles.
  const turkey = world.turkey;
  for (let i = world.obstacles.length - 1; i >= 0; i -= 1) {
    const item = world.obstacles[i];
    item.x -= speed * dt * (item.kind === 'knife' ? 1.6 : 1);
    if (item.kind === 'knife') item.spin += dt * 9;
    if (item.x + item.width < -80) {
      world.obstacles.splice(i, 1);
      continue;
    }
    if (item.deadly && overlaps(turkey, item)) {
      const result = hitObstacle(world, item);
      events |= result;
      if (result & EVENT_OVER) return events;
      if (result & EVENT_HIT) {
        if (item.kind === 'knife') world.obstacles.splice(i, 1);
        continue;
      }
    } else if (!item.deadly && (item.kind === 'corn' || item.kind === 'goldCorn' || item.kind === 'pie')) {
      if (overlaps(turkey, item, 2)) {
        const points = item.kind === 'goldCorn' ? POINTS.goldCorn : item.kind === 'pie' ? POINTS.pie : POINTS.corn;
        world.scoreBonus += points;
        burst(world, item.x + 15, item.y + 15, item.kind === 'goldCorn' ? '#ffd700' : '#f5c542', 10);
        world.obstacles.splice(i, 1);
        events |= item.kind === 'goldCorn' ? EVENT_GOLD : EVENT_PICKUP;
        continue;
      }
    } else if (item.kind === 'hay' && overlaps(turkey, item, 10)) {
      const result = hitObstacle(world, item);
      events |= result;
    }
    // Near-miss bonus: a knife that passes close without touching.
    if (item.kind === 'knife' && !item.counted && item.x + item.width < turkey.x - 4
      && Math.abs((item.y + 7) - (turkey.y + 20)) < 60) {
      item.counted = true;
      world.scoreBonus += 5;
      world.nearMiss += 1;
    }
  }

  // Escape!
  if (world.distance >= GOAL_METRES) {
    world.over = 'escaped';
    world.escaped = true;
    world.overReason = 'You made it to the woods — no Thanksgiving dinner this year!';
    burst(world, turkey.x + 20, turkey.y, '#7ec850', 26, 220);
    burst(world, turkey.x + 20, turkey.y, '#ffd700', 18, 180);
    return events | EVENT_OVER;
  }

  for (let i = world.particles.length - 1; i >= 0; i -= 1) {
    const p = world.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 420 * dt;
    p.life -= dt;
    if (p.life <= 0) world.particles.splice(i, 1);
  }
  for (let i = world.banners.length - 1; i >= 0; i -= 1) {
    world.banners[i].time += dt;
    if (world.banners[i].time >= world.banners[i].life) world.banners.splice(i, 1);
  }
  return events;
}

// The score shown on the HUD: distance metres plus pickup bonuses.
export function currentScore(world) {
  return Math.floor(world.distance) + world.scoreBonus;
}

export function initWorldScore(world) {
  world.scoreBonus = 0;
  world.score = 0;
}
