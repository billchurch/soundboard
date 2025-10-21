const SOUND_CLIPS_INTERNAL = [
  {
    id: 'airhorn',
    label: 'Air Horn',
    file: 'airhorn.mp3',
    shortcut: 'KeyA',
  },
  {
    id: 'rimshot',
    label: 'Rimshot',
    file: 'rimshot.mp3',
    shortcut: 'KeyS',
  },
  {
    id: 'sad-trombone',
    label: 'Sad Trombone',
    file: 'sad-trombone.mp3',
    shortcut: 'KeyD',
  },
  {
    id: 'katie',
    label: 'Katie',
    file: 'katie.mp3',
    shortcut: 'KeyK',
  },
  {
    id: 'tpir-losing',
    label: 'TPIR Losing',
    file: 'tpir-loosing.mp3',
    shortcut: 'KeyL',
  },
  {
    id: 'tpir-winner',
    label: 'TPIR Winning',
    file: 'tpir-winner.mp3',
    shortcut: 'KeyT',
  },
  {
    id: 'hounds',
    label: 'Hounds',
    file: 'hounds.mp3',
    shortcut: 'KeyH',
  },
  {
    id: 'wait',
    label: 'Wait',
    file: 'wait.mp3',
    shortcut: 'KeyW',
  },
];

const AUDIO_OPTIONS_INTERNAL = {
  volume: 0.8,
  allowOverlap: true,
  fadeMs: 120,
};

const DOM_SELECTORS_INTERNAL = {
  root: '#soundboard',
  grid: '[data-soundboard-grid]',
  button: '[data-clip-id]',
};

const freezeDeep = (value) => {
  if (Array.isArray(value)) {
    value.forEach((item) => freezeDeep(item));
  } else if (value !== null && typeof value === 'object') {
    Object.values(value).forEach((item) => freezeDeep(item));
  }

  return Object.freeze(value);
};

export const SOUND_CLIPS = freezeDeep(SOUND_CLIPS_INTERNAL.slice());
export const AUDIO_OPTIONS = freezeDeep({ ...AUDIO_OPTIONS_INTERNAL });
export const DOM_SELECTORS = freezeDeep({ ...DOM_SELECTORS_INTERNAL });
