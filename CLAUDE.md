# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server at localhost:5173
npm run electron         # Vite + Electron together (desktop dev)
npm run build            # Production web build → dist/
npm run build:pages      # Web build + prepare cloudflare-pages/
npm run build:appimage   # Linux AppImage
npm run build:win        # Windows NSIS installer
npm run preview          # Preview production build locally
```

No test suite is configured. The only required check before any change is `npm run build` passing. Manual smoke test covers: intro → start, A/B turn switching, timer end, non-negative scoring, question randomization, and audio transitions.

## Architecture

**Single-file game logic:** All game phases, state machines, timers, turn progression, scoring, and every game component live in `src/App.jsx`. There is no router, no Redux, no separate component files.

**Session state machine:** The `data` state holds the entire session. `phase` drives what renders:
- `"intro"` → `IntroScreen`
- `"playing"` → one of `BalloonGame`, `WormGame`, `BridgeGame`, `JarGame`, `PuzzleGame` (based on `activeGame.id`)
- `"balloonTransition"` → `BalloonTransitionScreen`
- `"puzzleSetup"` → `PuzzleSetupScreen`
- `"winner"` → `WinnerScreen`

All mutations go through `persistSession()` which normalizes via `normalizeSession()` and saves to localStorage (`"dijital-kahramanlar-session"`) or Electron's `window.appAPI`.

**Session schema** is versioned (`schemaVersion` in `defaultSession.json`). If the stored version doesn't match, the session resets to defaults. When changing session shape, bump `schemaVersion` in `src/data/defaultSession.json`.

**Question banks:** Imported as static JSON at the top of `App.jsx`:
- `questions.json` → balloon (true/false per group A/B)
- `wormQuestions.json` → worm (flat list, split by index parity or first/second 25)
- `bridgeQuestions.json` → bridge fill-in-the-blank (grouped by A/B)
- `jarQuestions.json` → jar multiple-choice (grouped by A/B)

Custom questions added via Settings are stored in `session.settings.customQuestions` and merged with bank questions at render time inside `getQuestionsForGroup()`.

**Two teams, sequential turns:** Each game round: A plays → B plays → advance to next game (or transition). `activeGroup` alternates A→B, and after B finishes, `activeGameIndex` increments. The game order is defined by the `games` array in `defaultSession.json`.

**Puzzle images** come from `PUZZLE_IMAGE_POOLS` (per-team static imports) merged with any `settings.customPuzzles` data URLs.

**Audio** uses raw `Audio` objects (no Web Audio API). Three looping tracks switch based on phase/timer: `gameplay-loop`, `tension-loop` (last 15s), `winner-loop`. Audio unlocks on first pointer/key interaction.

**Developer mode:** Toggled in Settings. Shows `DeveloperQuickNav` (fixed overlay) with direct phase-jump buttons — useful for testing specific screens without playing through the full sequence.

## Key Patterns

- `clone(value)` = `JSON.parse(JSON.stringify(value))` — used before every session mutation
- `normalizeSession()` / `normalizeGroup()` / `normalizeQuestion()` — always run on load and before save to sanitize external/stored data
- `pickRandomQuestionWithoutRepeat()` — tracks asked IDs in turn state, resets when exhausted
- CSS uses pixel-art design system: `.pixel-button` with `clip-path` octagon shape, `--ink`, `--fg`, `--bg`, `--button`, `--button-dark` CSS vars. Reuse existing button modifier classes (`.true-answer-button`, `.small-button`, `.tiny-button`) before adding new ones.
- Pointer events (not mouse/touch) used throughout for cross-device drag support with `setPointerCapture`.
- `JarGame` uses global `window.addEventListener("pointermove/pointerup")` instead of element-level capture — required because the hook element moves during drag, which breaks element-level capture. Mutable refs (`draggingRef`, `caughtPaperIdRef`, `activeQuestionRef`) are used inside these handlers to avoid stale closures.
