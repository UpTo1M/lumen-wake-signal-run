# lumen-wake-signal-run

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/upto1m/lumen-wake-signal-run/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/upto1m/lumen-wake-signal-run/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Lumen Wake: Signal Run is a neon salvage arcade game about steering a light skiff through a flooded city, banking signal motes at a beacon, and spending pulse energy to escape the tide's sentinels.

## Run it

```sh
node serve.ts
```

Open http://localhost:8080 in a desktop browser. No install or build step is needed; all game assets and synthesized audio work offline.

Bank 2,400 points within 78 seconds. Gather signals and return to the gold beacon on the left. Carrying several at once earns a convoy bonus, but a collision loses your unbanked cargo. Banking replenishes pulse energy and grants a short protection window. Six banked signals earn a refit choice: tractor range, speed, or a one-hit shield. Red hunters pursue your skiff; later interceptors predict your movement. Dashed circles warn before arrivals.

Controls: WASD or arrows to steer, Space for a directional dash and nearby sentinel blast, P to pause, M to mute, Enter to start or restart. Press 1–3 or click to choose a refit. Best score is stored locally when browser storage is available.

## Competition artifact

Run `MAKEFUN_OUTPUT_DIR=out node main.ts` to package the static game, four real browser screenshots, and the dossier. The unchanged `vendor/makefun-game.ts` is the official kit helper. All game code, vector art, and synthesized sound were authored fresh in the post-open session.

The screenshots show an actual keyboard-driven run, including its earned refit and victory; no screenshot-only state overrides are shipped. Browser QA may inspect a read-only copy of game state through `window.lumenSnapshot()`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=vwc8bzmr&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
