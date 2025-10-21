import { SOUND_CLIPS, AUDIO_OPTIONS, DOM_SELECTORS } from '../src/constants.js';
import { createAudioElement, playClip, stopClip } from '../src/audio.js';
import { renderSoundButtons, bindSoundboardEvents } from '../src/dom.js';

const ensureContainer = (selector) => {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Element not found for selector: ${selector}`);
  }

  return element;
};

const root = ensureContainer(DOM_SELECTORS.root);
const grid = root.querySelector(DOM_SELECTORS.grid);

if (!grid) {
  throw new Error(`Grid element not found using selector ${DOM_SELECTORS.grid}`);
}

const audioMap = new Map();

SOUND_CLIPS.forEach((clip) => {
  const audioElement = createAudioElement(clip, AUDIO_OPTIONS, { documentRef: document });
  audioMap.set(clip.id, audioElement);
});

const buttonsFragment = renderSoundButtons(grid, SOUND_CLIPS, { documentRef: document });
grid.appendChild(buttonsFragment);

const onPlay = (clip, audioElement) =>
  playClip(audioElement).catch((error) => {
    console.error(`Playback failed for clip "${clip.id}":`, error);
    throw error;
  });

const unbindEvents = bindSoundboardEvents({
  container: grid,
  clips: SOUND_CLIPS,
  audioMap,
  onPlay,
  documentRef: document,
});

const stopAllClips = () =>
  Promise.all(
    Array.from(audioMap.values()).map((audioElement) => stopClip(audioElement)),
  );

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAllClips().catch((error) => {
      console.error('Failed to stop audio on visibility change:', error);
    });
  }
});

window.addEventListener('beforeunload', () => {
  unbindEvents();
  stopAllClips().catch(() => {});
});

const isDev = typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production';

if (typeof window !== 'undefined' && isDev) {
  window.soundboard = {
    clips: SOUND_CLIPS,
    audioMap,
    playClip,
    stopClip,
    unbindEvents,
    stopAllClips,
  };
}
