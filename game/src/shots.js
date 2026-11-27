// The screenshot scenes behind ?shot=start|play|end|win. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered
// by a simple autopilot, so the frame is what a real game looks like and the
// same seed always gives the same frame.
import { GROUND_Y, STEP, worldSpeed } from './config.js';
import { EVENT_OVER, resetWorld, stepWorld } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 6;
const PLAY_TARGET_METRES = 430;
const END_LIMIT_SECONDS = 600;
const WIN_LIMIT_SECONDS = 600;

function nearestThreat(world) {
  const turkey = world.turkey;
  let threat = null;
  for (const item of world.obstacles) {
    if (item.x < turkey.x - 20 || item.x > turkey.x + 300) continue;
    // Knives and ovens and fences hurt; hay bales only trip a turkey that
    // runs into them low, so they count as a jumpable threat too.
    if (!item.deadly && item.kind !== 'hay') continue;
    if (!threat || item.x < threat.x) threat = item;
  }
  return threat;
}

function nearestKnife(world) {
  const turkey = world.turkey;
  let knife = null;
  for (const item of world.obstacles) {
    if (item.kind !== 'knife' || item.x < turkey.x - 20 || item.x > turkey.x + 320) continue;
    if (!knife || item.x < knife.x) knife = item;
  }
  return knife;
}

function nearestCorn(world) {
  const turkey = world.turkey;
  let corn = null;
  for (const item of world.obstacles) {
    if (item.kind !== 'corn' && item.kind !== 'goldCorn') continue;
    if (item.x < turkey.x) continue;
    if (!corn || item.x < corn.x) corn = item;
  }
  return corn;
}

// A careful pilot: jumps ground hazards, ducks under knives, dashes when
// the farmer is close, and drifts toward corn when the way is clear.
export function autopilot(world) {
  const turkey = world.turkey;
  const farmer = world.farmer;
  const input = { left: false, right: false, down: false, jumpPressed: false, dashPressed: false };
  const threat = nearestThreat(world);
  const knife = nearestKnife(world);
  const corn = nearestCorn(world);
  const gap = turkey.x - farmer.x;
  const scroll = worldSpeed(world.distance);
  const approach = Math.max(0, turkey.approach || 0);

  if (gap < 200 && turkey.dashCooldown <= 0) input.dashPressed = true;
  // Jump clean over the farmer when he is right on the turkey's tail.
  if (gap < 72 && turkey.onGround) input.jumpPressed = true;
  // Default: keep running right. Standing still is how turkeys get caught.
  input.right = true;

  // Knives first: they fly at the turkey's height, so the dodge is
  // vertical — jump a low one, drop under a high one.
  if (knife) {
  const timeToKnife = (knife.x - turkey.x) / Math.max(60, 1.6 * scroll + approach);
    const knifeMid = knife.y + 7;
    const turkeyMid = turkey.y + 20;
    if (Math.abs(knifeMid - turkeyMid) < 50 && timeToKnife < 0.3) {
      if (knifeMid < turkeyMid && turkey.y + turkey.height < GROUND_Y - 4) input.down = true;
      else if (turkey.onGround) input.jumpPressed = true;
      else if (turkey.flapsLeft > 0) input.jumpPressed = true;
    }
  }

  // Ground hazards: jump when the hazard is about 0.3 s away. A jump
  // keeps the turkey above a fence for ~0.8 s, and a slow hazard at the
  // right edge takes ~0.5 s to pass underneath — jumping any earlier lands
  // the turkey right back on top of it. Time, not distance: at the right
  // edge the turkey is pinned and hazards arrive slowly, so a distance
  // trigger fires far too early. Already airborne over a second hazard,
  // flap over it — there are two flaps per jump for exactly this.
  if (threat && threat.kind !== 'knife') {
    const closing = threat.x - turkey.x;
    const timeToHit = closing / Math.max(60, scroll + approach);
    if (timeToHit < 0.3) {
      if (turkey.onGround) input.jumpPressed = true;
      else if (turkey.flapsLeft > 0) input.jumpPressed = true;
    }
  }
  if (corn) {
    // Only chase corn that is ahead and close; never run left for it while
    // the farmer is near.
    const centre = turkey.x + turkey.width / 2;
    const target = corn.x + 15;
    if (target > centre + 10) input.right = true;
    else if (target < centre - 10 && gap > 320) input.left = true;
    if (corn.y < turkey.y - 30 && turkey.onGround) input.jumpPressed = true;
  }
  return input;
}

// A hurried pilot: short sight, no dash, no corn-chasing — it gets caught,
// as a rushed player does.
export function carelessPilot(world) {
  const turkey = world.turkey;
  const input = { left: false, right: false, down: false, jumpPressed: false, dashPressed: false };
  const threat = nearestThreat(world);
  if (threat && (threat.kind === 'oven' || threat.kind === 'fence') && threat.x - turkey.x < 46 && turkey.onGround) {
    input.jumpPressed = true;
  }
  if (turkey.x < 200) input.right = true;
  return input;
}

function simulate(world, pilot, limitSeconds, stopAt) {
  const steps = Math.floor(limitSeconds / STEP);
  // Edge-detect the presses, exactly like the real keyboard path: holding
  // a jump decision across steps must not spend both flaps at once.
  let prevJump = false;
  let prevDash = false;
  for (let i = 0; i < steps; i += 1) {
    const raw = pilot(world);
    const input = {
      ...raw,
      jumpPressed: raw.jumpPressed && !prevJump,
      dashPressed: raw.dashPressed && !prevDash,
    };
    prevJump = raw.jumpPressed;
    prevDash = raw.dashPressed;
    const events = stepWorld(world, input, STEP);
    if (events & EVENT_OVER) break;
    if (stopAt && stopAt(world)) break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * start: the title over a live farmyard. play: a mid-run kitchen chase.
 * end: the caught screen. win: the escaped screen.
 */
export function stageShot(name, world, seed) {
  resetWorld(world, seed);
  if (name === 'win') {
    simulate(world, autopilot, WIN_LIMIT_SECONDS);
    return { screen: world.over === 'escaped' ? SCREEN_OVER : SCREEN_PLAY };
  }
  if (name === 'end') {
    simulate(world, carelessPilot, END_LIMIT_SECONDS);
    return { screen: world.over ? SCREEN_OVER : SCREEN_PLAY };
  }
  if (name === 'play') {
    simulate(world, autopilot, END_LIMIT_SECONDS, (w) => w.distance >= PLAY_TARGET_METRES);
    // Stage the drama: the farmer right on the turkey's tail, a knife and
    // an oven on screen at once.
    world.farmer.x = Math.max(0, world.turkey.x - 150);
    world.farmer.state = 'chase';
    world.farmer.stateTime = 0;
    world.obstacles.push({
      kind: 'oven', x: world.turkey.x + 260, y: GROUND_Y - 64,
      width: 72, height: 64, deadly: true,
    });
    world.obstacles.push({
      kind: 'knife', x: world.turkey.x + 420, y: world.turkey.y + 6,
      width: 56, height: 14, deadly: true, spin: 0.6,
    });
    return { screen: SCREEN_PLAY };
  }
  simulate(world, autopilot, START_SECONDS);
  return { screen: SCREEN_TITLE };
}
