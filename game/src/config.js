// Gobble Run — tuning constants. One place for every number that shapes
// how the escape feels: speeds, sizes, the goal distance, stage cut-offs.
export const VIEW = { width: 960, height: 540 };
export const GROUND_Y = 470;
// How far right the turkey can run: hazards spawn just past this edge, so
// holding right pins the turkey where they arrive with the least warning.
export const PLAY_RIGHT_EDGE = 700;
export const STEP = 1 / 60;
export const GOAL_METRES = 500;
export const METRES_PER_PX = 0.025;

export const TURKEY = {
  width: 46,
  height: 40,
  runSpeed: 300,
  accel: 2400,
  jumpSpeed: 700,
  flapSpeed: 580,
  gravity: 1500,
  dashSpeed: 560,
  dashTime: 0.32,
  dashCooldown: 1.4,
  maxLives: 3,
};

export const FARMER = {
  width: 52,
  height: 78,
  catchDistance: 54,
  windedTime: 1.4,
  searchTime: 1.6,
};

// World scroll speed (px/s) by distance: the run gets faster as the turkey
// gets closer to the woods.
export function worldSpeed(distance) {
  return Math.min(300, 130 + distance * 0.34);
}

export const STAGES = [
  { name: 'THE FARMYARD', from: 0, banner: 'THE FARMYARD — run, Gobble, run!' },
  { name: 'THE BARN', from: 200, banner: 'THE BARN — knives are flying now!' },
  { name: 'THE KITCHEN', from: 400, banner: 'THE KITCHEN — the oven is lit!' },
];

export function stageFor(distance) {
  let stage = 0;
  for (let i = 0; i < STAGES.length; i += 1) {
    if (distance >= STAGES[i].from) stage = i;
  }
  return stage;
}

export const POINTS = { corn: 10, goldCorn: 50, pie: 25 };
export const SPAWN = { baseGap: 1.35, minGap: 0.85, knifeGap: 3.0 };
