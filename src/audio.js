const audioState = new WeakMap();
const fadeControllers = new WeakMap();

const getDocument = (documentRef) => {
  if (documentRef) {
    return documentRef;
  }

  if (typeof document !== 'undefined') {
    return document;
  }

  return undefined;
};

const clampVolume = (value) => {
  if (Number.isNaN(Number(value))) {
    return 1;
  }

  return Math.min(1, Math.max(0, Number(value)));
};

const clearFade = (audioElement) => {
  const timerId = fadeControllers.get(audioElement);

  if (typeof timerId !== 'undefined') {
    clearInterval(timerId);
    fadeControllers.delete(audioElement);
  }
};

const ensureManagedAudio = (audioElement) => {
  if (!audioState.has(audioElement)) {
    throw new Error('Audio element is not managed by soundboard utilities.');
  }

  return audioState.get(audioElement);
};

const createClonedAudioElement = (audioElement, state) => {
  const doc = audioElement?.ownerDocument ?? getDocument(undefined);

  if (!doc || typeof doc.createElement !== 'function') {
    return undefined;
  }

  const clone = doc.createElement('audio');

  clone.src = audioElement.src;
  clone.preload = audioElement.preload;
  clone.controls = audioElement.controls;
  clone.loop = audioElement.loop;
  clone.volume = state.volume;
  clone.muted = audioElement.muted ?? false;
  clone.defaultPlaybackRate = audioElement.defaultPlaybackRate ?? 1;
  clone.playbackRate = audioElement.playbackRate ?? 1;

  if (!clone.dataset) {
    clone.dataset = {};
  }

  clone.dataset.clipId = audioElement.dataset?.clipId ?? state.clipId ?? '';
  clone.dataset.shortcut = audioElement.dataset?.shortcut ?? '';

  const cloneState = {
    clipId: state.clipId,
    allowOverlap: false,
    fadeMs: state.fadeMs,
    volume: state.volume,
    parentElement: audioElement,
  };

  audioState.set(clone, cloneState);
  state.activeClones?.add(clone);

  return { clone, cloneState };
};

export const createAudioElement = (clip, options = {}, { documentRef } = {}) => {
  if (!clip || typeof clip.file !== 'string') {
    throw new Error('clip.file must be provided to create an audio element.');
  }

  const doc = getDocument(documentRef);

  if (!doc || typeof doc.createElement !== 'function') {
    throw new Error('A document reference with createElement is required.');
  }

  const audioElement = doc.createElement('audio');

  const basePath = options.basePath ?? './sounds/';
  const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const initialVolume = clampVolume(options.volume ?? 1);

  if (!audioElement.dataset) {
    audioElement.dataset = {};
  }

  audioElement.src = `${normalizedBasePath}${clip.file}`;
  audioElement.preload = 'auto';
  audioElement.controls = false;
  audioElement.loop = false;
  audioElement.volume = initialVolume;
  audioElement.dataset.clipId = clip.id ?? '';
  audioElement.dataset.shortcut = clip.shortcut ?? '';

  audioState.set(audioElement, {
    clipId: clip.id ?? '',
    allowOverlap: Boolean(options.allowOverlap),
    fadeMs: Number.isFinite(options.fadeMs) ? Number(options.fadeMs) : 0,
    volume: initialVolume,
    activeClones: new Set(),
  });

  return audioElement;
};

export const playClip = (audioElement) => {
  const state = ensureManagedAudio(audioElement);

  clearFade(audioElement);

  const playbackContext = (() => {
    if (state.allowOverlap && !audioElement.paused) {
      const cloneResult = createClonedAudioElement(audioElement, state);

      if (cloneResult) {
        return {
          element: cloneResult.clone,
          state: cloneResult.cloneState,
          isClone: true,
        };
      }

      audioElement.pause();
      audioElement.currentTime = 0;
    } else if (!state.allowOverlap && !audioElement.paused) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    return { element: audioElement, state, isClone: false };
  })();

  const { element: elementToPlay, state: elementState, isClone } = playbackContext;

  elementToPlay.volume = elementState.volume;

  const playbackAttempt = (() => {
    try {
      return elementToPlay.play();
    } catch (error) {
      return Promise.reject(error);
    }
  })();

  const ensurePromise =
    playbackAttempt instanceof Promise ? playbackAttempt : Promise.resolve();

  return new Promise((resolve, reject) => {
    const handleEnded = () => {
      cleanup();
      if (typeof elementToPlay.pause === 'function') {
        elementToPlay.pause();
      }
      elementToPlay.currentTime = 0;
      resolve();
    };

    const handleError = (event) => {
      cleanup();
      const errorEventConstructor =
        typeof globalThis !== 'undefined' && 'ErrorEvent' in globalThis
          ? globalThis.ErrorEvent
          : undefined;
      const isErrorEvent =
        Boolean(errorEventConstructor) && event instanceof errorEventConstructor;
      reject(
        isErrorEvent && event.error ? event.error : new Error('Audio playback error.'),
      );
    };

    const cleanup = () => {
      elementToPlay.removeEventListener('ended', handleEnded);
      elementToPlay.removeEventListener('error', handleError);

      if (isClone) {
        const parentState = audioState.get(audioElement);
        parentState?.activeClones?.delete(elementToPlay);
      }
    };

    elementToPlay.addEventListener('ended', handleEnded, { once: true });
    elementToPlay.addEventListener('error', handleError, { once: true });

    ensurePromise.catch((error) => {
      cleanup();
      reject(error instanceof Error ? error : new Error(String(error)));
    });
  });
};

export const stopClip = (audioElement) => {
  const state = ensureManagedAudio(audioElement);

  clearFade(audioElement);

  const finalize = () => {
    if (typeof audioElement.pause === 'function') {
      audioElement.pause();
    }
    audioElement.currentTime = 0;
    audioElement.volume = state.volume;

    if (state.parentElement) {
      const parentState = audioState.get(state.parentElement);
      parentState?.activeClones?.delete(audioElement);
    }
  };

  const cloneStops =
    state.activeClones && state.activeClones.size > 0
      ? Array.from(state.activeClones).map((clone) =>
          stopClip(clone)
            .catch(() => undefined)
            .finally(() => {
              state.activeClones?.delete(clone);
            }),
        )
      : [];

  if (!state.fadeMs) {
    const stopCurrent = Promise.resolve().then(() => {
      finalize();
    });

    return Promise.all([...cloneStops, stopCurrent]).then(() => undefined);
  }

  const startVolume = audioElement.volume;

  if (startVolume <= 0) {
    const stopCurrent = Promise.resolve().then(() => {
      finalize();
    });

    return Promise.all([...cloneStops, stopCurrent]).then(() => undefined);
  }

  const durationMs = state.fadeMs;
  const stepIntervalMs = 16;
  const totalSteps = Math.max(1, Math.floor(durationMs / stepIntervalMs));
  const stepState = { current: 0 };

  const fadePromise = new Promise((resolve) => {
    const timerId = setInterval(() => {
      stepState.current += 1;

      const progress = Math.min(stepState.current / totalSteps, 1);
      const nextVolume = startVolume * (1 - progress);
      audioElement.volume = nextVolume <= 0.01 ? 0 : nextVolume;

      if (progress >= 1) {
        clearFade(audioElement);
        finalize();
        resolve();
      }
    }, stepIntervalMs);

    fadeControllers.set(audioElement, timerId);
  });

  return Promise.all([...cloneStops, fadePromise]).then(() => undefined);
};
