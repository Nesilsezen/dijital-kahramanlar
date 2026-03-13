# Repository Guidelines

## Project Structure & Module Organization
This project is a Vite + React classroom game app wrapped with Electron.

- `src/App.jsx`: main game flow (intro, balloon, worm, puzzle, winner), timers, turn progression, scoring.
- `src/data/`: JSON content and defaults (`defaultSession.json`, `questions.json`, `wormQuestions.json`).
- `src/styles.css`: global UI styles and pixel-themed components.
- `src/assets/audio/`: game audio files and `SOURCES.md` license/source notes.
- `electron/`: desktop shell (`main.js`, `preload.js`) and local persistence bridge.
- `scripts/prepare-pages.mjs`: prepares static output for Cloudflare Pages.
- `dist/`, `release/`, `cloudflare-pages/`: generated artifacts; do not edit manually.

## Build, Test, and Development Commands
- `npm run dev`: run Vite dev server on `5173`.
- `npm run electron`: run Vite + Electron together for desktop development.
- `npm run build`: production web build to `dist/`.
- `npm run build:pages`: build and prepare `cloudflare-pages/` output.
- `npm run build:appimage`: Linux AppImage package.
- `npm run build:win`, `npm run build:win:portable`, `npm run build:win:all`: Windows packages.
- `npm run build:mac`: macOS package build (best run on macOS CI/host).

## Coding Style & Naming Conventions
Use React function components and existing state-flow patterns.

- JavaScript: 2-space indentation, semicolons, double quotes.
- Naming: `PascalCase` for components, `camelCase` for helpers/state functions.
- Keep gameplay logic in `App.jsx` cohesive; avoid parallel state systems.
- Reuse existing pixel button/layout classes before adding new variants.

## Testing Guidelines
No automated suite is configured yet. Minimum pre-PR checks:
1. `npm run build` passes.
2. Manual smoke test covers intro/start, A/B turn switching, timer end behavior, non-negative scoring, randomized balloon/worm question order, and audio transitions.

If adding tests, prefer Vitest + React Testing Library under `src/__tests__/` with `*.test.jsx` naming.

## Commit & Pull Request Guidelines
Recent history includes inconsistent messages (`ra`, `bug fix`, etc.). Use clear, imperative commits going forward, e.g. `Fix worm wrong-answer score clamp`.

PRs should include:
- concise behavior summary,
- screenshots/GIFs for UI changes,
- manual test steps and build result,
- notes for data/schema, packaging, or asset/license updates.
