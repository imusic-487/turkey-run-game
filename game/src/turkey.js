// The turkey: a farm bird with a running jump, a mid-air flap and a
// wing-burst dash. Pure movement and timers; collisions live in world.js.
import { GROUND_Y, PLAY_RIGHT_EDGE, TURKEY, VIEW } from './config.js';

export function makeTurkey() {
  return {
    x: 220,
    y: GROUND_Y - TURKEY.height,
    vx: 0,
    vy: 0,
    approach: 0,
    width: TURKEY.width,
    height: TURKEY.height,
    onGround: true,
    flapsLeft: 2,
    dashTime: 0,
    dashCooldown: 0,
    invulnerable: 0,
    stumble: 0,
    runPhase: 0,
    face: 1,
    hidden: false,
  };
}

export function stepTurkey(turkey, input, dt) {
  const left = input.left ? -1 : 0;
  const right = input.right ? 1 : 0;
  const want = left + right;
  const dashing = turkey.dashTime > 0;
  const topSpeed = dashing ? TURKEY.dashSpeed : TURKEY.runSpeed;
  const slowed = turkey.stumble > 0 ? 0.45 : 1;

  if (want !== 0) {
    turkey.vx += want * TURKEY.accel * dt;
    turkey.face = want;
  } else {
    const drag = TURKEY.accel * 1.4 * dt;
    if (Math.abs(turkey.vx) <= drag) turkey.vx = 0;
    else turkey.vx -= Math.sign(turkey.vx) * drag;
  }
  turkey.vx = Math.max(-topSpeed * slowed, Math.min(topSpeed * slowed, turkey.vx));

  if (input.jumpPressed) {
    if (turkey.onGround) {
      turkey.vy = -TURKEY.jumpSpeed;
      turkey.onGround = false;
      turkey.flapsLeft = 2;
    } else if (turkey.flapsLeft > 0) {
      turkey.vy = -TURKEY.flapSpeed;
      turkey.flapsLeft -= 1;
      turkey.runPhase = 0;
    }
  }
  if (input.dashPressed && turkey.dashCooldown <= 0 && !dashing) {
    turkey.dashTime = TURKEY.dashTime;
    turkey.dashCooldown = TURKEY.dashCooldown;
  }

  turkey.vy += TURKEY.gravity * dt;
  if (input.down && !turkey.onGround) turkey.vy += TURKEY.gravity * 0.9 * dt;
  const prevX = turkey.x;
  turkey.x += turkey.vx * dt;
  turkey.y += turkey.vy * dt;
  turkey.x = Math.max(24, Math.min(PLAY_RIGHT_EDGE - turkey.width, turkey.x));
  // How fast the turkey is really closing on things ahead, after the screen
  // edge stops it: the autopilot times its jumps from this, not from the
  // speed the turkey wishes it had.
  turkey.approach = (turkey.x - prevX) / dt;

  const floor = GROUND_Y - turkey.height;
  if (turkey.y >= floor) {
    turkey.y = floor;
    turkey.vy = 0;
    turkey.onGround = true;
    turkey.flapsLeft = 2;
  }
  turkey.x = Math.max(24, Math.min(PLAY_RIGHT_EDGE - turkey.width, turkey.x));

  turkey.dashTime = Math.max(0, turkey.dashTime - dt);
  turkey.dashCooldown = Math.max(0, turkey.dashCooldown - dt);
  turkey.invulnerable = Math.max(0, turkey.invulnerable - dt);
  turkey.stumble = Math.max(0, turkey.stumble - dt);
  if (turkey.onGround && Math.abs(turkey.vx) > 20) turkey.runPhase += dt * Math.abs(turkey.vx) * 0.045;
  return dashing;
}

export function knockTurkey(turkey, fromX) {
  turkey.vy = -380;
  turkey.vx = (turkey.x >= fromX ? 1 : -1) * 260;
  turkey.onGround = false;
  turkey.invulnerable = 1.8;
  turkey.stumble = 0.7;
}
