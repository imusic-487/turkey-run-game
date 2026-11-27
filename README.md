[![Rank](https://make.fun/badge/turkey-run-game-01/imusic-487/turkey-run-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![Reward](https://make.fun/badge/turkey-run-game-01/imusic-487/turkey-run-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01)
[![Turkey Run Game](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)

# Gobble Run — The Great Turkey Escape

Thanksgiving is coming, and Gobble the turkey is on the menu. Outrun the
farmer, jump the fences, dodge the carving knives, leap the roaring oven —
and reach the woods 500 m away, or become dinner.

A complete, original turkey escape game for
[make.fun's turkey-run-game-01 bounty](https://make.fun/bounty/turkey-run-game-01).
It runs in a desktop browser from static files, with no network requests:
open `game/index.html` (or `node serve.ts` and visit
http://localhost:8080) and play with keyboard and mouse.

## How to play

| Key | Action |
| --- | --- |
| ← → / A D | Run left / right |
| ↑ / W / Space | Jump — press again in the air to flap (twice per jump) |
| Shift | Wing-burst dash |
| ↓ / S (in the air) | Drop fast |
| P / Esc | Pause |
| M | Mute |
| R / Enter | Restart after the end |

- **The farmer** chases on a pressure meter: run hard right and he falls
  behind; dawdle, stumble or get hit and he closes in. Jump clean over him
  when he is right on your tail to put him behind you again.
- **Hay bales** break his line of sight — hide behind one and he loses
  the trail and searches.
- **Fences, ovens and carving knives** are jumped, never touched. Knives
  skim low along the ground; ovens glow in the kitchen.
- **Corn** is points (golden corn is worth 50). Near-misses on knives
  pay a little extra.
- **Three stages** — the farmyard, the barn, the kitchen — get faster and
  denser as the 500 m to the woods tick down. Three lives. Get caught
  and it is Thanksgiving dinner; reach the woods and Gobble lives.

## Files

- `game/index.html` — the page; everything else is under `game/src/`
- `game/src/config.js` — all tuning: speeds, sizes, the 500 m goal
- `game/src/random.js` — seeded random, so a screenshot seed replays
- `game/src/audio.js` — synthesised WebAudio sounds (gobbles, flaps,
  dings); no audio files
- `game/src/input.js` — keyboard and mouse
- `game/src/turkey.js` — the turkey: run, jump, flap, dash
- `game/src/farmer.js` — the farmer: chase pressure, winded, search
- `game/src/world.js` — spawning, collisions, score, distance, stages
- `game/src/render.js` — all canvas art (farm, kitchen, turkey, farmer,
  HUD, title and end screens); no image files
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=start|
  play|end|win&seed=N`) played forward by an autopilot from the real rules
- `game/src/main.js` — the game loop and screen flow
- `main.ts` — the hand-in program (Node 22): copies `game/` and
  `screenshots/` to the output directory and writes `dossier.json`
- `screenshots/` — 4 real renders of the game's own code: title, a
  kitchen-stage chase, caught, and escaped
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## Screenshots

1. `1-start.jpg` — the title screen over a live farmyard
2. `2-play.jpg` — mid-run in the kitchen: the oven, a knife, the farmer
   closing in, HUD with score, distance, lives and stage
3. `3-end.jpg` — caught: Thanksgiving dinner is served
4. `4-win.jpg` — escaped: the woods, 500 m, Gobble lives

## License

MIT — see [LICENSE](LICENSE).
