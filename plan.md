# Soundboard Implementation Plan

## Goal

Build a browser-based soundboard that serves static assets, renders an accessible button grid, and plays audio clips without overlapping playback, following SRP and DRY principles.

## Prerequisites

- Node.js 22 LTS installed locally.
- Audio assets (mp3/ogg) placed under `public/sounds/`.
- npm scripts configured in `package.json` for dev server, linting, testing, and formatting.

## Project Layout

```
.
├── package.json
├── plan.md
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── sounds/
│   └── app.js
├── src/
│   ├── constants.js
│   ├── audio.js
│   ├── dom.js
│   └── server.js
└── test/
    └── audio.test.js
```

## Implementation Steps

1. **Define Shared Constants (`src/constants.js`)**
   - Export immutable `SOUND_CLIPS`, `AUDIO_OPTIONS`, and `DOM_SELECTORS`.
   - Ensure objects are serializable and frozen to preserve immutability.

2. **Implement Audio Helpers (`src/audio.js`)**
   - `createAudioElement(clip, options)` returns a configured `<audio>` element (no DOM side effects).
   - `playClip(audioElement)` returns a Promise resolved when playback ends, handling overlap rules.
   - `stopClip(audioElement)` gracefully stops playback and resets state.

3. **Create DOM Utilities (`src/dom.js`)**
   - `renderSoundButtons(container, clips)` builds a `DocumentFragment` of buttons with `aria-pressed`.
   - `bindSoundboardEvents({ container, clips, audioMap, onPlay })` wires click/keyboard listeners and updates UI state.
   - Keep DOM queries centralized via `DOM_SELECTORS`.

4. **Browser Entry Point (`public/app.js`)**
   - Import constants and helpers.
   - Instantiate the audio map, render buttons into the container, and invoke event binding.
   - Provide optional development hooks under `if (process.env.NODE_ENV !== 'production')`.

5. **Markup and Styles**
   - `public/index.html`: semantic structure with `<main>` container and instructions.
   - `public/styles.css`: CSS custom properties, button grid layout, pressed-state styling.

6. **Static Server (`src/server.js`)**
   - Implement an Express or Node `http` server serving `public/`.
   - Add caching headers for `/sounds/:file`.
   - Expose `npm run dev` to launch the server (optionally via `nodemon`).

7. **Tooling Setup**
   - Configure ESLint (functional style rules), Prettier, and unit test runner (Vitest/Jest).
   - Implement npm scripts: `dev`, `lint`, `test`, `format`.

8. **Unit Tests (`test/audio.test.js`)**
   - Mock `HTMLAudioElement` to test `createAudioElement`, `playClip`, and `stopClip`.
   - Cover overlap prevention, promise resolution, and state cleanup.

## Testing & Validation

- Run `npm run lint`, `npm run test`, and manual browser checks via `npm run dev`.
- Verify keyboard shortcuts trigger correct clip playback and UI feedback.
- Ensure repeated presses do not overlap playback unless `AUDIO_OPTIONS.allowOverlap` is true.

## Future Enhancements

- Settings modal to adjust volume or overlap behavior.
- Persist favorites or custom keyboard mappings with a dedicated persistence module.
- Add integration tests for DOM event handling.
