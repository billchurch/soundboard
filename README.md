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

### Run the Vite Dev Server

```bash
npm run dev
```

Open the URL printed by Vite (default `http://localhost:5173`) to load the soundboard. Each button displays its label and keyboard shortcut. Press the shortcut or click the button to play the associated clip. The UI shows a pressed state while the clip is active, and playback stops automatically when the tab becomes hidden.

### Required Audio Assets

Populate the `public/sounds/` directory with your clips before launching the app. Default metadata expects:

| ID           | File               | Shortcut |
| ------------ | ------------------ | -------- |
| airhorn      | `airhorn.mp3`      | `A`      |
| rimshot      | `rimshot.mp3`      | `S`      |
| sad-trombone | `sad-trombone.mp3` | `D`      |

Feel free to edit `src/constants.js` to adjust clips, filenames, or shortcuts.

## Scripts

| Command              | Description                                       |
| -------------------- | ------------------------------------------------- |
| `npm run dev`        | Launch Vite dev server                            |
| `npm run build`      | Produce a production bundle in `dist/`            |
| `npm run preview`    | Preview the production build locally via Vite     |
| `npm run serve`      | Serve the static assets with the Node http server |
| `npm run lint`       | Run ESLint across the project                     |
| `npm run test`       | Execute Vitest unit tests                         |
| `npm run format`     | Check formatting with Prettier                    |
| `npm run format:fix` | Format files in-place using Prettier              |

## Project Layout

```
.
├── index.html         # Root HTML entry consumed by Vite
├── public/            # Static assets copied as-is (audio clips)
├── src/               # Browser entry, shared helpers, styles, Node server
└── test/              # Vitest unit tests for pure modules
```

## Extending the Soundboard

- Add or remove clips by editing `SOUND_CLIPS` in `src/constants.js`.
- Tweak volume, fade, or overlap behavior in `AUDIO_OPTIONS`.
- Expand DOM/view logic in `src/dom.js` or style rules in `src/styles.css`.
- Introduce additional settings modules following the Single Responsibility Principle to keep shared logic testable.
