const getDocument = (container, documentRef) => {
  if (documentRef) {
    return documentRef;
  }

  if (container && container.ownerDocument) {
    return container.ownerDocument;
  }

  if (typeof document !== 'undefined') {
    return document;
  }

  return undefined;
};

const formatShortcut = (shortcut) => {
  if (typeof shortcut !== 'string' || shortcut.length === 0) {
    return '';
  }

  if (shortcut.startsWith('Key') && shortcut.length === 4) {
    return shortcut.slice(3);
  }

  if (shortcut.startsWith('Digit') && shortcut.length === 6) {
    return shortcut.slice(5);
  }

  switch (shortcut) {
    case 'Space':
      return 'Space';
    case 'Enter':
      return 'Enter';
    default:
      return shortcut;
  }
};

const ensureClipIndex = (clips) => {
  const byId = new Map();
  const byShortcut = new Map();

  clips.forEach((clip) => {
    if (clip && clip.id) {
      byId.set(clip.id, clip);
    }

    if (clip && clip.shortcut) {
      byShortcut.set(clip.shortcut, clip);
    }
  });

  return { byId, byShortcut };
};

export const renderSoundButtons = (container, clips, { documentRef } = {}) => {
  const doc = getDocument(container, documentRef);

  if (!doc || typeof doc.createDocumentFragment !== 'function') {
    throw new Error('A valid document is required to render sound buttons.');
  }

  const fragment = doc.createDocumentFragment();

  clips.forEach((clip) => {
    if (!clip?.id) {
      return;
    }

    const button = doc.createElement('button');

    button.type = 'button';
    button.className = 'soundboard__button';
    button.dataset.clipId = clip.id;
    button.dataset.shortcut = clip.shortcut ?? '';
    button.setAttribute('aria-pressed', 'false');

    const shortcutLabel = formatShortcut(clip.shortcut);
    button.textContent = shortcutLabel ? `${clip.label} (${shortcutLabel})` : clip.label;

    fragment.appendChild(button);
  });

  return fragment;
};

export const bindSoundboardEvents = ({
  container,
  clips,
  audioMap,
  onPlay,
  documentRef,
}) => {
  if (!container) {
    throw new Error('A container element is required to bind events.');
  }

  if (!audioMap) {
    throw new Error('audioMap is required to bind events.');
  }

  const doc = getDocument(container, documentRef);

  if (!doc) {
    throw new Error('A document reference is required to bind events.');
  }

  const { byId, byShortcut } = ensureClipIndex(clips);

  const findButton = (clipId) => container.querySelector(`[data-clip-id="${clipId}"]`);

  const setPressedState = (clipId, isPressed) => {
    const button = findButton(clipId);
    if (!button) {
      return;
    }

    button.setAttribute('aria-pressed', isPressed ? 'true' : 'false');
    button.classList.toggle('is-active', isPressed);
  };

  const triggerPlayback = (clip) => {
    if (!clip) {
      return;
    }

    const audioElement = audioMap.get(clip.id);

    if (!audioElement || typeof onPlay !== 'function') {
      return;
    }

    setPressedState(clip.id, true);

    const playback = onPlay(clip, audioElement);
    const ensurePromise = playback instanceof Promise ? playback : Promise.resolve();

    ensurePromise
      .catch((error) => {
        console.error('Soundboard playback error:', error);
      })
      .finally(() => {
        setPressedState(clip.id, false);
      });
  };

  const handleClick = (event) => {
    const elementConstructor =
      typeof globalThis !== 'undefined' && globalThis.Element
        ? globalThis.Element
        : undefined;
    const target =
      elementConstructor && event.target instanceof elementConstructor
        ? event.target.closest('[data-clip-id]')
        : null;

    if (!target || !container.contains(target)) {
      return;
    }

    const clip = byId.get(target.dataset.clipId);
    triggerPlayback(clip);
  };

  const handleKeydown = (event) => {
    if (event.repeat) {
      return;
    }

    const clip = byShortcut.get(event.code);

    if (!clip) {
      return;
    }

    event.preventDefault();
    triggerPlayback(clip);
  };

  container.addEventListener('click', handleClick);
  doc.addEventListener('keydown', handleKeydown);

  return () => {
    container.removeEventListener('click', handleClick);
    doc.removeEventListener('keydown', handleKeydown);

    clips.forEach((clip) => {
      if (clip?.id) {
        setPressedState(clip.id, false);
      }
    });
  };
};
