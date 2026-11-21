# Harbour Spotter — Spot the Difference

[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/qsc985/spot-the-difference/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/qsc985/spot-the-difference/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

A complete, original spot-the-difference game for the [make.fun bounty](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451). It runs offline in a desktop browser from static files, with keyboard and mouse play.

## The game

Two pictures of the same sunny harbour sit side by side — but **8 things differ**:

1. Sunglasses on the sun
2. The sailboat's sail colour
3. A missing bird
4. The lighthouse's bands
5. A beach ball on the sand
6. Coconuts under the palm
7. A crab on the sand
8. The pier flag's colour

Click a difference in either picture to circle it in green on both. The counter in the header shows how many are left; find all 8 before the 3-minute timer runs out.

- **Mouse:** click straight on a difference. A wrong click costs 10 points and flashes a red X.
- **Keyboard:** arrow keys move the crosshair (Shift for fine steps), Enter/Space clicks where it stands.
- **Hints:** press H or the Hint button to ring one hidden difference for a few seconds (−25 points, 3 per game).
- **Pause / restart:** P pauses, R restarts. Best score is kept in the browser.
- **Sound:** a small WebAudio synth (chime on a find, buzz on a miss, arpeggio on a win) — no sound files.

## Play it

Serve `game/` with any static server and open `index.html`:

```sh
cd game && python3 -m http.server 8080
# open http://localhost:8080
```

No build step, no network request, no libraries — just `index.html` and its ES modules under `game/src/`.

## Screenshots

The four shots under `screenshots/` are real renders of the game's own code, staged with `?shot=start|play|play2|end&seed=1` (see `shots.json`):

- `1-start.jpg` — title screen over the harbour
- `2-play.jpg` — mid-game, 3 found, 5 left
- `3-play2.jpg` — mid-game with a hint ring, 5 found, 3 left
- `4-end.jpg` — all 8 found, win screen

## Entry

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `$MAKEFUN_OUTPUT_DIR` (default `/output`) and writes `dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
