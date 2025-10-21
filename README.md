# Soundboard Application

Lightweight browser soundboard that serves static assets over a minimal Node server, renders a shortcut-enabled button grid, and plays audio clips without overlapping playback.

## Requirements

- Node.js 22+
- npm (bundled with Node)
- Audio files placed under `public/sounds/` matching filenames from `src/constants.js`

## Getting Started

```bash
npm install
```

### Run the Dev Server

```bash
npm run dev
```

Open `http://localhost:3000` to load the soundboard. Each button displays its label and keyboard shortcut. Press the shortcut or click the button to play the associated clip. The UI shows a pressed state while the clip is active, and playback stops automatically when the tab becomes hidden.

### Required Audio Assets

Populate the `public/sounds/` directory with your clips before launching the app. Default metadata expects:

| ID           | File               | Shortcut |
| ------------ | ------------------ | -------- |
| airhorn      | `airhorn.mp3`      | `A`      |
| rimshot      | `rimshot.mp3`      | `S`      |
| sad-trombone | `sad-trombone.mp3` | `D`      |

Feel free to edit `src/constants.js` to adjust clips, filenames, or shortcuts.

## Scripts

| Command              | Description                                |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Start the static server with file watching |
| `npm run lint`       | Run ESLint across the project              |
| `npm run test`       | Execute Vitest unit tests                  |
| `npm run format`     | Check formatting with Prettier             |
| `npm run format:fix` | Format files in-place using Prettier       |

## Project Layout

```
.
├── public/            # Browser entry point, HTML, styles, audio assets
├── src/               # Shared constants, audio helpers, DOM utilities, server
└── test/              # Vitest unit tests for pure modules
```

## Extending the Soundboard

- Add or remove clips by editing `SOUND_CLIPS` in `src/constants.js`.
- Tweak volume, fade, or overlap behavior in `AUDIO_OPTIONS`.
- Expand DOM/view logic in `src/dom.js` or style rules in `public/styles.css`.
- Introduce additional settings modules following the Single Responsibility Principle to keep shared logic testable.
