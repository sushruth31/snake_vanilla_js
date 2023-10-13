# Snake — the classic game in dependency-free vanilla JavaScript

[![ci](https://github.com/sushruth31/snake_vanilla_js/actions/workflows/ci.yml/badge.svg)](https://github.com/sushruth31/snake_vanilla_js/actions/workflows/ci.yml)

A browser Snake with no framework, no bundler and no dependencies — ES modules load
straight from a static server. The interesting part is not the game, it is the seam:
all the rules live in a module that has never heard of the DOM, so the whole rule set
is unit-tested in Node without a headless browser, and the renderer only ever paints
the handful of cells a tick actually changed.

## Stack

- **Vanilla ES modules** — native `import`/`export`, served as-is. No build step, so
  what you read in `src/` is exactly what the browser runs.
- **`node:test` + `node:assert`** — the test runner ships with Node 20. Adding Vitest
  or Jest would mean a `node_modules/` and a lockfile in a project whose entire premise
  is having neither.
- **CSS grid** driven by two custom properties the renderer sets, so board dimensions
  live in one JavaScript constant and the layout follows.

## Running it

No install, no configuration, no environment variables — it is a static page.

```bash
git clone https://github.com/sushruth31/snake_vanilla_js.git
cd snake_vanilla_js
npm run serve            # python3 -m http.server 8000
# then open http://localhost:8000
```

Any static server works (`npx serve`, VS Code Live Server). Opening `index.html`
straight off the filesystem does **not** work — `file://` origins block ES module
imports under CORS.

Arrow keys or WASD to steer. Buttons for start, pause and restart.

## Architecture

```
index.html ──> src/main.js ──> src/game.js ──> src/direction.js
  styles.css        │                              ▲
                    └────> src/renderer.js ────────┘
```

| Module         | Responsibility                                                        | Touches the DOM |
| -------------- | --------------------------------------------------------------------- | --------------- |
| `direction.js` | Four frozen unit vectors, reversal check, key→direction map            | no              |
| `game.js`      | All rules: movement, collision, growth, food, win/lose, speed ramp     | no              |
| `renderer.js`  | Builds the grid once; repaints cells from a change record              | yes             |
| `main.js`      | Composition root: keyboard, buttons, timer, overlay                    | yes             |

The dependency graph is acyclic and points one way, toward the pure core. `game.step()`
returns a change record — `{ status, head, neck, tail, food, score }` — which is the
only thing the renderer consumes.

## Design notes

- **Cells are integers, not `"row-col"` strings.** A cell is `row * cols + col`, so
  self-collision is an O(1) `Set.has`, and the renderer indexes the same flat array of
  `<div>`s directly. It also removes a `split`/`parseInt` from every step. The catch is
  that index arithmetic wraps silently across row edges — cell 4 minus 1 is cell 3, a
  legal index in the row above — so bounds are checked on the decoded `(row, col)`, never
  on the index. Two tests exist purely to pin that down.
- **Chasing your own tail is legal; the naive check says otherwise.** On a non-growth
  tick the tail vacates in the same tick the head arrives, so a head entering the tail's
  cell is valid play. Testing membership against the whole body — what the first version
  did — reports a false game over. `#collides()` exempts the vacating cell, but only when
  the snake is not growing that tick.
- **Food placement is a draw from a maintained free set, not rejection sampling.**
  Picking random cells until one misses the snake costs an expected `1/p` attempts and is
  unbounded as the board fills; done recursively, as it originally was, it blows the
  stack near the end of a game. Instead the game keeps a `Set` of free cells updated by
  the two or three cells that change each tick, and one meal costs a single O(free) walk.
  This also makes winning representable: `free.size === 0` after growth is a win, not a
  hang.
- **The renderer repaints at most four cells per tick.** The board is 20×20, and the
  original loop rewrote inline styles on all 400 cells every tick — about 4,000 style
  mutations per second at the 100 ms speed cap. The change record names the new head, the
  old head, the vacated tail and the food, which is a 100× reduction in DOM writes, and
  styling moved to CSS classes so the visual language lives in one file.
- **Turns are validated when buffered, against the last pending turn.** Two keypresses
  inside one tick — up then down while heading right — would otherwise reverse the snake
  into its own neck. The buffer is capped at two, so mashing keys cannot queue turns
  seconds into the future, which is the failure mode of an unbounded input queue.
- **The loop is a self-rescheduling `setTimeout`, not a `setInterval`.** Each meal shaves
  40 ms off the tick (400 ms → 100 ms floor); with an interval that means tearing down
  and rebuilding a timer mid-tick, while a timeout simply reads the current interval when
  it schedules the next one. Listeners are bound once in the controller constructor — the
  earlier version re-registered them on every restart, so handlers multiplied with each
  new game.

## Tests

```bash
npm test     # node --test test/
npm run check    # node --check on every module
```

25 tests over the pure modules, all of which name the edge case they defend:

- wall collisions on all four sides, including the "moving left from column 0 must not
  wrap to the previous row" index bug
- head entering the vacating tail is legal; head entering any other body cell is not
- eating leaves the tail in place, raises the score, and draws the next meal from the
  free pool
- filling the final free cell is a win, not a stall with nowhere to place food
- reversals rejected against both the current heading and a queued turn; buffer capped
- buffered turns applied one per tick rather than collapsed
- steps after game over are inert; `reset()` restores position, score and heading
- a 3,000-tick randomised run asserting the invariants that matter: body cells stay
  unique, food never lands on the snake, and the tick interval stays within its bounds

`renderer.js` and `main.js` are deliberately untested — they hold no rules, only DOM
writes and timer plumbing, and testing them would mean pulling in a headless DOM.
