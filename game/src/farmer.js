// The farmer: he chases the turkey, gets winded after a catch, and loses
// the trail when a hay bale stands between him and his dinner.
//
// The chase is a pressure meter, not a footrace across the screen: `threat`
// is how close he is behind the turkey. Running hard right pushes him back,
// standing still or stumbling lets him close in, and every hit costs a big
// chunk of room. The turkey's screen position is free for dodging — there
// is no corner to get trapped in — and jumping clean over the farmer when
// he is right behind puts him behind the turkey again.
import { FARMER, GROUND_Y } from './config.js';

export function makeFarmer() {
  return {
    x: -70,
    y: GROUND_Y - FARMER.height,
    width: FARMER.width,
    height: FARMER.height,
    state: 'chase',
    stateTime: 0,
    runPhase: 0,
    threat: 290,
    lastSeenX: 220,
    lastSeenY: GROUND_Y - 40,
    lookDir: 1,
    gained: false,
    lastSide: -1,
  };
}

function hayBetween(farmer, turkey, obstacles) {
  for (const item of obstacles) {
    if (item.kind !== 'hay' || item.passed) continue;
    const left = Math.min(farmer.x, turkey.x);
    const right = Math.max(farmer.x + farmer.width, turkey.x + turkey.width);
    if (item.x > left && item.x < right && item.y + item.height > GROUND_Y - 120) return true;
  }
  return false;
}

export function stepFarmer(farmer, turkey, obstacles, distance, dt) {
  farmer.stateTime += dt;
  const hidden = hayBetween(farmer, turkey, obstacles);
  turkey.hidden = hidden && farmer.state !== 'chase';

  if (farmer.state === 'winded') {
    if (farmer.stateTime >= FARMER.windedTime) {
      farmer.state = 'chase';
      farmer.stateTime = 0;
    }
  } else if (farmer.state === 'search') {
    // He has lost the trail: the gap opens while he looks around.
    farmer.threat = Math.min(700, farmer.threat + 26 * dt);
    farmer.lookDir = farmer.stateTime < FARMER.searchTime / 2 ? 1 : -1;
    if (farmer.stateTime >= FARMER.searchTime) {
      farmer.state = 'chase';
      farmer.stateTime = 0;
    }
  } else {
    // Chase: the meter moves with how the turkey is running. Hard running
    // pushes him back; cruising holds him; dawdling or backing up lets him
    // in — and he never quits, so the grind grows with distance.
    const pace = turkey.vx;
    if (pace > 200) farmer.threat += 40 * dt;
    else if (pace > 60) farmer.threat += 0;
    else if (pace >= 0) farmer.threat -= 15 * dt;
    else farmer.threat -= 30 * dt;
    farmer.threat -= (8 + distance * 0.02) * dt;
    farmer.threat = Math.max(30, Math.min(700, farmer.threat));
    farmer.lookDir = 1;

    if (hidden && farmer.threat < 420) {
      farmer.state = 'search';
      farmer.stateTime = 0;
      farmer.lastSeenX = turkey.x;
      farmer.lastSeenY = turkey.y;
    }
  }

  // Jumping clean over the farmer puts him behind the turkey again.
  const turkeyCentre = turkey.x + turkey.width / 2;
  const farmerCentre = farmer.x + farmer.width / 2;
  const side = turkeyCentre < farmerCentre ? -1 : 1;
  if (farmer.lastSide === -1 && side === 1 && turkey.y + turkey.height < farmer.y + 34
    && farmer.threat < 130 && farmer.state !== 'winded') {
    farmer.threat = 230;
    farmer.state = 'winded';
    farmer.stateTime = 0;
  }
  farmer.lastSide = side;

  farmer.x = turkey.x - farmer.threat;
  farmer.y = GROUND_Y - farmer.height;
  farmer.runPhase += dt * (farmer.state === 'winded' ? 0 : 14);
  farmer.gained = farmer.threat < 150;
}

export function windFarmer(farmer) {
  farmer.state = 'winded';
  farmer.stateTime = 0;
  farmer.threat = Math.min(700, farmer.threat + 130);
}

export function farmerCatch(farmer, turkey) {
  if (farmer.threat > FARMER.catchDistance) return false;
  // A turkey high in the air is sailing over him, not caught.
  return turkey.y + turkey.height > farmer.y + 24;
}

export function resetFarmer(farmer) {
  farmer.x = -70;
  farmer.y = GROUND_Y - FARMER.height;
  farmer.state = 'chase';
  farmer.stateTime = 0;
  farmer.threat = 290;
  farmer.gained = false;
  farmer.lastSide = -1;
}
