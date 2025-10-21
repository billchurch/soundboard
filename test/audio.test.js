import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createAudioElement, playClip, stopClip } from '../src/audio.js';

class StubAudioElement {
  constructor(documentRef) {
    this.ownerDocument = documentRef ?? null;
    this.currentTime = 0;
    this.dataset = {};
    this.loop = false;
    this.paused = true;
    this.preload = 'auto';
    this.src = '';
    this.volume = 1;
    this.playCount = 0;
    this._listeners = new Map();
  }

  play() {
    this.paused = false;
    this.playCount += 1;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }

  addEventListener(type, handler) {
    const handlers = this._listeners.get(type) ?? new Set();
    handlers.add(handler);
    this._listeners.set(type, handlers);
  }

  removeEventListener(type, handler) {
    const handlers = this._listeners.get(type);

    if (!handlers) {
      return;
    }

    handlers.delete(handler);

    if (handlers.size === 0) {
      this._listeners.delete(type);
    }
  }

  dispatchEvent(type, detail) {
    const handlers = this._listeners.get(type);

    if (!handlers) {
      return;
    }

    handlers.forEach((handler) => handler(detail));
  }

  setAttribute(key, value) {
    this[key] = value;
  }

  removeAttribute(key) {
    delete this[key];
  }
}

const createDocumentStub = () => {
  const createdAudios = [];

  return {
    createdAudios,
    createElement(tag) {
      if (tag !== 'audio') {
        throw new Error(`Unsupported tag requested: ${tag}`);
      }

      const audio = new StubAudioElement(this);
      createdAudios.push(audio);
      return audio;
    },
  };
};

describe('audio helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a configured audio element instance', () => {
    const clip = { id: 'clip', label: 'Clip', file: 'clip.mp3', shortcut: 'KeyC' };
    const audioElement = createAudioElement(
      clip,
      { volume: 0.5, allowOverlap: false, fadeMs: 0, basePath: '/assets/' },
      { documentRef: createDocumentStub() },
    );

    expect(audioElement.src.endsWith('/assets/clip.mp3')).toBe(true);
    expect(audioElement.volume).toBeCloseTo(0.5);
    expect(audioElement.dataset.clipId).toBe('clip');
    expect(audioElement.dataset.shortcut).toBe('KeyC');
  });

  it('prevents overlapping playback when allowOverlap is false', async () => {
    const clip = { id: 'clip', label: 'Clip', file: 'clip.mp3' };
    const audioElement = createAudioElement(
      clip,
      { allowOverlap: false },
      { documentRef: createDocumentStub() },
    );

    audioElement.currentTime = 1;
    audioElement.paused = false;

    const playback = playClip(audioElement);

    expect(audioElement.currentTime).toBe(0);

    audioElement.dispatchEvent('ended');
    await expect(playback).resolves.toBeUndefined();
    expect(audioElement.paused).toBe(true);
  });

  it('resolves playback promise when audio ends', async () => {
    const clip = { id: 'clip', label: 'Clip', file: 'clip.mp3' };
    const audioElement = createAudioElement(
      clip,
      { allowOverlap: true },
      { documentRef: createDocumentStub() },
    );

    const playback = playClip(audioElement);
    audioElement.dispatchEvent('ended');

    await expect(playback).resolves.toBeUndefined();
  });

  it('allows overlapping playback for the same clip when allowed', async () => {
    const clip = { id: 'clip', label: 'Clip', file: 'clip.mp3' };
    const documentStub = createDocumentStub();
    const audioElement = createAudioElement(
      clip,
      { allowOverlap: true },
      { documentRef: documentStub },
    );

    const firstPlayback = playClip(audioElement);
    const createdCountBefore = documentStub.createdAudios.length;

    const overlappingPlayback = playClip(audioElement);

    expect(documentStub.createdAudios.length).toBe(createdCountBefore + 1);

    const overlappingElement =
      documentStub.createdAudios[documentStub.createdAudios.length - 1];

    expect(overlappingElement).not.toBe(audioElement);
    expect(audioElement.playCount).toBe(1);
    expect(overlappingElement.playCount).toBe(1);

    overlappingElement.dispatchEvent('ended');
    audioElement.dispatchEvent('ended');

    await expect(
      Promise.all([firstPlayback, overlappingPlayback]),
    ).resolves.toBeDefined();
    expect(audioElement.paused).toBe(true);
    expect(overlappingElement.paused).toBe(true);
  });

  it('stops playback immediately when fade is disabled', async () => {
    const clip = { id: 'clip', label: 'Clip', file: 'clip.mp3' };
    const audioElement = createAudioElement(
      clip,
      { fadeMs: 0 },
      { documentRef: createDocumentStub() },
    );

    audioElement.paused = false;
    audioElement.currentTime = 1;

    await expect(stopClip(audioElement)).resolves.toBeUndefined();
    expect(audioElement.paused).toBe(true);
    expect(audioElement.currentTime).toBe(0);
    expect(audioElement.volume).toBeCloseTo(1);
  });

  it('fades playback when fadeMs is provided', async () => {
    const clip = { id: 'clip', label: 'Clip', file: 'clip.mp3' };
    const audioElement = createAudioElement(
      clip,
      { fadeMs: 64 },
      { documentRef: createDocumentStub() },
    );

    audioElement.volume = 1;
    audioElement.paused = false;

    const fadePromise = stopClip(audioElement);

    vi.advanceTimersByTime(64);
    await expect(fadePromise).resolves.toBeUndefined();
    expect(audioElement.volume).toBeCloseTo(1);
  });
});
