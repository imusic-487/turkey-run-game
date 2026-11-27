// All canvas drawing: the autumn farm, the kitchen, the turkey, the farmer,
// the obstacles and pickups, the HUD, and the title / end screens. Every
// sprite is drawn from paths here — no image files, no network requests.
import { GOAL_METRES, GROUND_Y, STAGES, VIEW } from './config.js';
import { currentScore } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

const SKY = ['#f7b267', '#f4845f', '#e85d75'];
const INK = '#2b1a12';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, size, colour, align = 'center', weight = 'bold') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function drawCloud(ctx, x, y, scale) {
  ctx.fillStyle = 'rgba(255, 244, 224, 0.9)';
  ellipse(ctx, x, y, 34 * scale, 18 * scale);
  ellipse(ctx, x + 26 * scale, y + 4 * scale, 26 * scale, 14 * scale);
  ellipse(ctx, x - 28 * scale, y + 5 * scale, 24 * scale, 13 * scale);
}

function drawHills(ctx, stage, t) {
  ctx.fillStyle = stage === 2 ? '#5c3a21' : '#7a9e4b';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW.width; x += 20) {
    ctx.lineTo(x, GROUND_Y - 52 - Math.sin((x + t * 30) * 0.008) * 16 - Math.sin(x * 0.02) * 8);
  }
  ctx.lineTo(VIEW.width, GROUND_Y);
  ctx.closePath();
  ctx.fill();
}

function drawBarn(ctx, x, y, scale) {
  ctx.fillStyle = '#a93226';
  ctx.fillRect(x, y, 150 * scale, 100 * scale);
  ctx.fillStyle = '#7e241a';
  ctx.beginPath();
  ctx.moveTo(x - 10 * scale, y);
  ctx.lineTo(x + 75 * scale, y - 55 * scale);
  ctx.lineTo(x + 160 * scale, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f5e6c8';
  ctx.lineWidth = 4 * scale;
  ctx.beginPath();
  ctx.moveTo(x + 75 * scale, y + 4 * scale);
  ctx.lineTo(x + 75 * scale, y + 96 * scale);
  ctx.moveTo(x + 4 * scale, y + 50 * scale);
  ctx.lineTo(x + 146 * scale, y + 50 * scale);
  ctx.stroke();
  ctx.fillStyle = '#f5e6c8';
  ctx.fillRect(x + 58 * scale, y + 58 * scale, 34 * scale, 38 * scale);
}

function drawPumpkin(ctx, x, y, r) {
  ctx.fillStyle = '#e67e22';
  ellipse(ctx, x, y, r, r * 0.82);
  ctx.fillStyle = '#d35400';
  ellipse(ctx, x - r * 0.4, y, r * 0.45, r * 0.8);
  ellipse(ctx, x + r * 0.4, y, r * 0.45, r * 0.8);
  ctx.fillStyle = '#e67e22';
  ellipse(ctx, x, y, r * 0.5, r * 0.82);
  ctx.fillStyle = '#5d8a3a';
  ctx.fillRect(x - 2, y - r - 4, 5, 9);
}

function drawKitchenBack(ctx, t) {
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(0, 0, VIEW.width, GROUND_Y);
  ctx.fillStyle = '#744a28';
  for (let x = 0; x < VIEW.width; x += 96) ctx.fillRect(x, 0, 4, GROUND_Y);
  ctx.fillStyle = '#3d2b1f';
  ctx.fillRect(0, 96, VIEW.width, 10);
  // Hanging pans and a shelf of jars.
  for (let i = 0; i < 5; i += 1) {
    const x = 60 + i * 190;
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 106);
    ctx.lineTo(x, 128);
    ctx.stroke();
    ctx.fillStyle = i % 2 ? '#4a4a4a' : '#6b6b6b';
    ellipse(ctx, x, 150, 26, 20);
  }
  ctx.fillStyle = '#f5e6c8';
  ctx.font = '16px Trebuchet MS, Verdana, sans-serif';
  ctx.fillText('The oven is lit. The carving knife is out. Run!', 24, 78);
}

function drawFarmBack(ctx, world, t) {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, SKY[0]);
  grad.addColorStop(0.6, SKY[1]);
  grad.addColorStop(1, SKY[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, GROUND_Y);
  // Low autumn sun.
  ctx.fillStyle = '#ffe9a8';
  ellipse(ctx, 830, 92, 42, 42);
  ctx.fillStyle = '#ffdf7e';
  ellipse(ctx, 830, 92, 30, 30);
  drawCloud(ctx, 150 + t * 6 % 200, 70, 1);
  drawCloud(ctx, 480, 110, 0.8);
  drawCloud(ctx, 700 - (t * 4 % 150), 52, 0.7);
  drawHills(ctx, world.stage, t);
  drawBarn(ctx, 60, GROUND_Y - 150, 0.9);
  drawPumpkin(ctx, 300, GROUND_Y - 12, 16);
  drawPumpkin(ctx, 330, GROUND_Y - 10, 12);
  drawPumpkin(ctx, 880, GROUND_Y - 12, 15);
  // Fence posts scrolling past.
  ctx.fillStyle = '#8a5a33';
  const offset = (t * 130) % 90;
  for (let x = -offset; x < VIEW.width; x += 90) {
    ctx.fillRect(x, GROUND_Y - 66, 8, 66);
    ctx.fillRect(x - 4, GROUND_Y - 66, 16, 6);
  }
  ctx.fillStyle = '#a06a3b';
  ctx.fillRect(0, GROUND_Y - 46, VIEW.width, 5);
}

function drawWoodsBack(ctx, t) {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, '#2d6a4f');
  grad.addColorStop(0.6, '#40916c');
  grad.addColorStop(1, '#74c69d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, GROUND_Y);
  ctx.fillStyle = '#ffe9a8';
  ellipse(ctx, 830, 92, 42, 42);
  drawCloud(ctx, 150, 70, 1);
  drawCloud(ctx, 480, 110, 0.8);
  // Pine trees, near and far.
  for (let i = 0; i < 7; i += 1) {
    const x = 30 + i * 140 + (i % 2) * 40;
    const h = 150 + (i % 3) * 40;
    drawPineBig(ctx, x, GROUND_Y, h);
  }
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
  ctx.fillStyle = '#40916c';
  ctx.fillRect(0, GROUND_Y, VIEW.width, 6);
  text(ctx, 'THE WOODS — SAFE AT LAST', VIEW.width / 2, 446, 22, '#fff');
}

function drawPineBig(ctx, x, baseY, h) {
  ctx.fillStyle = '#1b4332';
  ctx.beginPath();
  ctx.moveTo(x, baseY - h);
  ctx.lineTo(x - h * 0.28, baseY);
  ctx.lineTo(x + h * 0.28, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2d6a4f';
  ctx.beginPath();
  ctx.moveTo(x, baseY - h * 0.72);
  ctx.lineTo(x - h * 0.2, baseY - h * 0.2);
  ctx.lineTo(x + h * 0.2, baseY - h * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6d4c41';
  ctx.fillRect(x - 5, baseY - 14, 10, 14);
}

export function drawBackground(ctx, world, t) {
  if (world.stage === 2) drawKitchenBack(ctx, t);
  else drawFarmBack(ctx, world, t);
  // Ground.
  ctx.fillStyle = world.stage === 2 ? '#7a4a26' : '#8a6a3b';
  ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
  ctx.fillStyle = world.stage === 2 ? '#96622f' : '#a37c46';
  ctx.fillRect(0, GROUND_Y, VIEW.width, 6);
  if (world.stage !== 2) {
    ctx.fillStyle = '#6f8f3e';
    for (let x = 12; x < VIEW.width; x += 46) {
      ctx.fillRect(x, GROUND_Y + 34, 14, 4);
      ctx.fillRect(x + 20, GROUND_Y + 52, 10, 4);
    }
  } else {
    // Kitchen checker floor.
    ctx.fillStyle = '#5d3a1e';
    for (let x = 0; x < VIEW.width; x += 60) {
      if ((x / 60) % 2 === 0) ctx.fillRect(x, GROUND_Y + 12, 60, VIEW.height - GROUND_Y - 12);
    }
  }
}

export function drawTurkey(ctx, turkey, t) {
  const { x, y, width: w, height: h } = turkey;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const blink = turkey.invulnerable > 0 && Math.floor(t * 14) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;
  const legSwing = Math.sin(turkey.runPhase) * (turkey.onGround ? 8 : 3);
  // Legs.
  ctx.strokeStyle = '#e67e22';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 14);
  ctx.lineTo(cx - 8 + legSwing, cy + 20 - (turkey.onGround ? 0 : 6));
  ctx.moveTo(cx + 8, cy + 14);
  ctx.lineTo(cx + 8 - legSwing, cy + 20 - (turkey.onGround ? 0 : 6));
  ctx.stroke();
  // Tail feather fan.
  const feathers = ['#c0392b', '#e67e22', '#f1c40f', '#7a9e4b', '#8e44ad'];
  ctx.save();
  ctx.translate(cx - 16, cy + 2);
  feathers.forEach((colour, i) => {
    const angle = -0.9 + i * 0.45;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = colour;
    ellipse(ctx, -16, 0, 15, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ellipse(ctx, -22, -1, 4, 2.5);
    ctx.restore();
  });
  ctx.restore();
  // Body.
  ctx.fillStyle = '#7b4a21';
  ellipse(ctx, cx, cy, 22, 17);
  ctx.fillStyle = '#8d5a2b';
  ellipse(ctx, cx + 2, cy - 3, 17, 12);
  // Wing.
  const flap = turkey.onGround ? Math.sin(turkey.runPhase * 0.5) * 2 : -8;
  ctx.fillStyle = '#5d3a17';
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy + 2 + flap, 13, 8, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // Head, beak, wattle, eye.
  ctx.fillStyle = '#7b4a21';
  ellipse(ctx, cx + 18, cy - 14, 10, 10);
  ctx.fillStyle = '#e67e22';
  ctx.beginPath();
  ctx.moveTo(cx + 26, cy - 16);
  ctx.lineTo(cx + 36, cy - 12);
  ctx.lineTo(cx + 26, cy - 9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ellipse(ctx, cx + 22, cy - 5, 3, 5);
  ctx.fillStyle = '#fff';
  ellipse(ctx, cx + 21, cy - 17, 3, 3);
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, cx + 22, cy - 17, 1.6, 1.6);
  if (turkey.dashTime > 0) {
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy - 8);
    ctx.lineTo(cx - 40, cy - 8);
    ctx.moveTo(cx - 24, cy + 4);
    ctx.lineTo(cx - 44, cy + 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (turkey.hidden) {
    text(ctx, 'HIDDEN', cx, cy - 34, 12, '#7ec850');
  }
}

export function drawFarmer(ctx, farmer, t) {
  const { x, y, width: w, height: h } = farmer;
  const cx = x + w / 2;
  const legSwing = Math.sin(farmer.runPhase) * 10;
  // Legs and boots.
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 8, y + h - 26);
  ctx.lineTo(cx - 8 + legSwing, GROUND_Y);
  ctx.moveTo(cx + 8, y + h - 26);
  ctx.lineTo(cx + 8 - legSwing, GROUND_Y);
  ctx.stroke();
  // Overalls and shirt.
  ctx.fillStyle = '#c0392b';
  roundRect(ctx, cx - 17, y + 22, 34, 30, 6);
  ctx.fill();
  ctx.fillStyle = '#2e5fa3';
  ctx.fillRect(cx - 15, y + 40, 30, 18);
  ctx.fillRect(cx - 15, y + 24, 7, 22);
  ctx.fillRect(cx + 8, y + 24, 7, 22);
  // Arms reaching forward, one holding a net.
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx + 12, y + 30);
  ctx.lineTo(cx + 30, y + 22);
  ctx.stroke();
  ctx.strokeStyle = '#8a5a33';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx + 28, y + 20);
  ctx.lineTo(cx + 46, y + 6);
  ctx.stroke();
  ctx.strokeStyle = '#d5dbdb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx + 52, y + 2, 12, 9, 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 44, y - 4);
  ctx.lineTo(cx + 60, y + 8);
  ctx.moveTo(cx + 60, y - 4);
  ctx.lineTo(cx + 44, y + 8);
  ctx.stroke();
  // Head, beard, straw hat.
  ctx.fillStyle = '#f0c8a0';
  ellipse(ctx, cx + 4, y + 12, 12, 12);
  ctx.fillStyle = '#fff';
  ellipse(ctx, cx + 4, y + 20, 10, 6);
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, cx + 9, y + 9, 2, 2);
  ctx.fillStyle = '#e8c832';
  ctx.beginPath();
  ctx.ellipse(cx + 4, y + 2, 17, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(cx - 7, y - 12, 22, 12);
  if (farmer.state === 'search') {
    text(ctx, '?', cx + 4, y - 26, 22, '#fff');
  }
  if (farmer.state === 'winded') {
    text(ctx, '...', cx + 4, y - 24, 18, '#fff');
  }
}

function drawFence(ctx, item) {
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(item.x, item.y, 6, item.height);
  ctx.fillRect(item.x + item.width - 6, item.y, 6, item.height);
  ctx.fillStyle = '#a06a3b';
  ctx.fillRect(item.x - 4, item.y + 8, item.width + 8, 7);
  ctx.fillRect(item.x - 4, item.y + 26, item.width + 8, 7);
}

function drawHay(ctx, item, t) {
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.ellipse(item.x + item.width / 2, item.y + item.height, item.width / 2, 14, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#e8b64c';
  ctx.beginPath();
  ctx.ellipse(item.x + item.width / 2, item.y + item.height - 30, item.width / 2 - 4, 34, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#b98a2e';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(item.x + item.width / 2 + i * 10, item.y + 6);
    ctx.lineTo(item.x + item.width / 2 + i * 12, item.y + item.height - 6);
    ctx.stroke();
  }
  text(ctx, 'HIDE', item.x + item.width / 2, item.y - 12, 11, '#fff');
}

function drawOven(ctx, item, t) {
  const glow = 0.6 + Math.sin(t * 6) * 0.25;
  ctx.fillStyle = '#2b2b2b';
  roundRect(ctx, item.x - 4, item.y - 8, item.width + 8, item.height + 8, 6);
  ctx.fill();
  ctx.fillStyle = `rgba(255, 110, 20, ${glow})`;
  roundRect(ctx, item.x + 8, item.y + 8, item.width - 16, item.height - 22, 4);
  ctx.fill();
  ctx.fillStyle = '#ffd27e';
  roundRect(ctx, item.x + 16, item.y + 16, item.width - 32, item.height - 38, 3);
  ctx.fill();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(item.x + 12, item.y + 2);
  ctx.lineTo(item.x + item.width - 12, item.y + 2);
  ctx.stroke();
  // Heat waves.
  ctx.strokeStyle = `rgba(255, 140, 40, ${0.5 + glow * 0.3})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    const hx = item.x + 14 + i * 22;
    ctx.beginPath();
    ctx.moveTo(hx, item.y - 10);
    ctx.quadraticCurveTo(hx + 5, item.y - 20, hx, item.y - 28);
    ctx.stroke();
  }
  text(ctx, 'HOT!', item.x + item.width / 2, item.y - 34, 12, '#ff6b35');
}

function drawKnife(ctx, item) {
  ctx.save();
  ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
  ctx.rotate(item.spin * 0.15);
  ctx.fillStyle = '#dfe6e9';
  ctx.beginPath();
  ctx.moveTo(-28, -5);
  ctx.lineTo(14, -7);
  ctx.lineTo(28, 0);
  ctx.lineTo(14, 7);
  ctx.lineTo(-28, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(-26, -2, 34, 2);
  ctx.fillStyle = '#5d3a17';
  ctx.fillRect(-28, -5, 12, 10);
  ctx.restore();
}

function drawCorn(ctx, item, golden) {
  ctx.fillStyle = golden ? '#ffd700' : '#f5c542';
  ellipse(ctx, item.x + 15, item.y + 15, 10, 13);
  ctx.strokeStyle = golden ? '#e6b800' : '#d4a017';
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(item.x + 15 + i * 5, item.y + 4);
    ctx.lineTo(item.x + 15 + i * 5, item.y + 26);
    ctx.stroke();
  }
  ctx.fillStyle = '#5d8a3a';
  ctx.beginPath();
  ctx.moveTo(item.x + 5, item.y + 26);
  ctx.lineTo(item.x + 15, item.y + 14);
  ctx.lineTo(item.x + 25, item.y + 26);
  ctx.closePath();
  ctx.fill();
}

export function drawObstacles(ctx, world, t) {
  for (const item of world.obstacles) {
    if (item.kind === 'fence') drawFence(ctx, item);
    else if (item.kind === 'hay') drawHay(ctx, item, t);
    else if (item.kind === 'oven') drawOven(ctx, item, t);
    else if (item.kind === 'knife') drawKnife(ctx, item);
    else if (item.kind === 'corn') drawCorn(ctx, item, false);
    else if (item.kind === 'goldCorn') drawCorn(ctx, item, true);
  }
}

export function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.colour;
    ellipse(ctx, p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawPine(ctx, x, y) {
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.moveTo(x, y - 12);
  ctx.lineTo(x - 9, y + 4);
  ctx.lineTo(x + 9, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x - 7, y + 8);
  ctx.lineTo(x + 7, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6d4c41';
  ctx.fillRect(x - 2, y + 8, 4, 5);
}

function drawHeart(ctx, x, y, filled) {
  ctx.fillStyle = filled ? '#e74c3c' : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  ctx.bezierCurveTo(x - 9, y - 2, x - 5, y - 10, x, y - 4);
  ctx.bezierCurveTo(x + 5, y - 10, x + 9, y - 2, x, y + 6);
  ctx.fill();
}

export function drawHUD(ctx, world, muted, paused) {
  ctx.fillStyle = 'rgba(30, 16, 8, 0.55)';
  roundRect(ctx, 12, 10, 936, 52, 10);
  ctx.fill();
  // Lives.
  for (let i = 0; i < 3; i += 1) drawHeart(ctx, 40 + i * 26, 36, i < world.lives);
  text(ctx, 'SCORE', 130, 24, 12, '#f5c542', 'left');
  text(ctx, String(currentScore(world)), 130, 44, 22, '#fff', 'left');
  // Distance progress: farm on the left, woods on the right.
  const barX = 300;
  const barW = 380;
  text(ctx, 'DISTANCE', barX, 24, 12, '#f5c542', 'left');
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, barX, 34, barW, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#7ec850';
  const progress = Math.min(1, world.distance / GOAL_METRES);
  roundRect(ctx, barX, 34, Math.max(12, barW * progress), 12, 6);
  ctx.fill();
  drawPine(ctx, barX + barW + 14, 40);
  text(ctx, `${Math.floor(world.distance)} / ${GOAL_METRES} m`, barX + barW / 2, 40, 13, '#fff');
  text(ctx, 'STAGE', 730, 24, 12, '#f5c542', 'left');
  text(ctx, STAGES[world.stage].name, 730, 44, 16, '#fff', 'left');
  text(ctx, muted ? 'MUTED (M)' : 'SOUND (M)', 900, 24, 13, '#fff');
  text(ctx, paused ? 'PAUSED' : 'PAUSE (P)', 900, 44, 13, '#fff');

  if (world.farmer.gained && !world.over) {
    const pulse = 0.5 + Math.sin(world.time * 8) * 0.5;
    ctx.fillStyle = `rgba(192, 57, 43, ${0.25 + pulse * 0.3})`;
    ctx.fillRect(0, 0, 10, VIEW.height);
    text(ctx, 'RUN! HE IS RIGHT BEHIND YOU!', VIEW.width / 2, 84, 20, '#ff6b35');
  }
  for (const banner of world.banners) {
    const alpha = Math.min(1, (banner.life - banner.time) / 0.6, banner.time / 0.2 + 0.2);
    ctx.globalAlpha = Math.max(0, alpha);
    text(ctx, banner.text, VIEW.width / 2, 150, 30, '#fff');
    if (banner.sub) text(ctx, banner.sub, VIEW.width / 2, 182, 16, '#ffe9a8');
    ctx.globalAlpha = 1;
  }
}

export function drawTitle(ctx, world, best, t) {
  ctx.fillStyle = 'rgba(30, 10, 4, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawTurkey(ctx, { x: VIEW.width / 2 - 23, y: 60, width: 46, height: 40, onGround: true, runPhase: 0, invulnerable: 0, dashTime: 0, hidden: false }, t);
  text(ctx, 'GOBBLE RUN', VIEW.width / 2, 168, 64, '#ffd700');
  text(ctx, 'THE GREAT TURKEY ESCAPE', VIEW.width / 2, 212, 24, '#fff');
  text(ctx, 'Thanksgiving is coming. The farmer is coming faster.', VIEW.width / 2, 246, 17, '#ffe9a8');
  text(ctx, 'Outrun the farmer, dodge the carving knives, leap the fences', VIEW.width / 2, 270, 17, '#ffe9a8');
  text(ctx, 'and the roaring oven — and reach the woods 500 m away.', VIEW.width / 2, 292, 17, '#ffe9a8');
  text(ctx, '← → / A D move    ↑ / W / SPACE jump — again in the air to flap (twice)    SHIFT dash', VIEW.width / 2, 332, 16, '#fff');
  text(ctx, 'Hide behind hay bales to lose the farmer. Grab corn for points.', VIEW.width / 2, 356, 16, '#fff');
  text(ctx, 'Hold RIGHT to outrun the farmer — and jump the hazards coming in.', VIEW.width / 2, 380, 15, '#ffb3a0');
  if (best > 0) text(ctx, `BEST SCORE: ${best}`, VIEW.width / 2, 392, 18, '#7ec850');
  return { x: VIEW.width / 2 - 130, y: 414, width: 260, height: 56 };
}

export function drawStartButton(ctx, rect, hover) {
  ctx.fillStyle = hover ? '#f39c12' : '#e67e22';
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 12);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 12);
  ctx.stroke();
  text(ctx, 'START THE ESCAPE', rect.x + rect.width / 2, rect.y + rect.height / 2 + 1, 22, '#fff');
}

function drawEndPanel(ctx, world, best, t) {
  const escaped = world.over === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(20, 60, 20, 0.55)' : 'rgba(40, 8, 4, 0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = escaped ? '#2ecc71' : '#e74c3c';
  roundRect(ctx, VIEW.width / 2 - 330, 92, 660, 300, 16);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, VIEW.width / 2 - 330, 92, 660, 300, 16);
  ctx.fill();
  text(ctx, escaped ? 'ESCAPED!' : 'CAUGHT!', VIEW.width / 2, 140, 44, '#fff');
  text(ctx, world.overReason, VIEW.width / 2, 190, 18, '#ffe9a8');
  text(ctx, `SCORE  ${currentScore(world)}      DISTANCE  ${Math.floor(world.distance)} m`, VIEW.width / 2, 232, 20, '#fff');
  text(ctx, `CORN BONUS  +${world.scoreBonus}      BEST  ${Math.max(best, currentScore(world))}`, VIEW.width / 2, 264, 16, '#fff');
  text(ctx, escaped
    ? 'No Thanksgiving dinner this year. The woods are yours, Gobble.'
    : 'The farmer is already preheating the oven. Try again, Gobble.', VIEW.width / 2, 300, 16, '#fff');
  text(ctx, 'Press R or click below to run again', VIEW.width / 2, 330, 15, '#fff');
  const rect = { x: VIEW.width / 2 - 130, y: 352, width: 260, height: 52 };
  ctx.fillStyle = '#f5f5f5';
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 12);
  ctx.fill();
  text(ctx, 'RUN AGAIN', rect.x + rect.width / 2, rect.y + rect.height / 2 + 1, 20, '#2b1a12');
  return rect;
}

export function drawScreen(ctx, world, screen, best, t, hoverButton) {
  if (screen === SCREEN_OVER && world.over === 'escaped') drawWoodsBack(ctx, t);
  else drawBackground(ctx, world, t);
  if (!(screen === SCREEN_OVER && world.over === 'escaped')) drawObstacles(ctx, world, t);
  if (screen !== SCREEN_TITLE) drawFarmer(ctx, world.farmer, t);
  drawTurkey(ctx, world.turkey, t);
  drawParticles(ctx, world);
  let button = null;
  if (screen === SCREEN_PLAY) {
    drawHUD(ctx, world, false, false);
  } else if (screen === SCREEN_TITLE) {
    button = drawTitle(ctx, world, best, t);
    drawStartButton(ctx, button, hoverButton);
  } else if (screen === SCREEN_OVER) {
    drawHUD(ctx, world, false, false);
    button = drawEndPanel(ctx, world, best, t);
  }
  return button;
}
