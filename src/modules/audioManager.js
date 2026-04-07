const AUDIO_ELEMENT_ID = "globalAmbientAudio";
const AUDIO_UNLOCK_KEY = "enigma_audio_unlocked";
const AUDIO_ENABLED_KEY = "enigma_audio_enabled";
const DEFAULT_VOLUME = 0.35;
let restoreAmbientTimer = null;

function getOrCreateAudioElement() {
  let audio = document.getElementById(AUDIO_ELEMENT_ID);

  if (audio) {
    return audio;
  }

  audio = document.createElement("audio");
  audio.id = AUDIO_ELEMENT_ID;
  audio.loop = true;
  audio.preload = "auto";
  audio.src = "/assets/audio/selva-loop.mp3";
  audio.volume = DEFAULT_VOLUME;
  document.body.appendChild(audio);

  return audio;
}

function getAmbientAudioElement() {
  return document.getElementById(AUDIO_ELEMENT_ID);
}

export function isAudioEnabled() {
  return window.localStorage.getItem(AUDIO_ENABLED_KEY) === "on";
}

export function setAudioEnabled(enabled) {
  window.localStorage.setItem(AUDIO_ENABLED_KEY, enabled ? "on" : "off");
}

export function isAudioUnlocked() {
  return window.sessionStorage.getItem(AUDIO_UNLOCK_KEY) === "true";
}

export function unlockAudio() {
  window.sessionStorage.setItem(AUDIO_UNLOCK_KEY, "true");
}

export async function playAmbientAudio() {
  if (!isAudioEnabled()) {
    return false;
  }

  const audio = getOrCreateAudioElement();
  audio.volume = DEFAULT_VOLUME;
  await audio.play();
  unlockAudio();
  return true;
}

export function pauseAmbientAudio(resetTime = false) {
  const audio = document.getElementById(AUDIO_ELEMENT_ID);
  if (!audio) {
    return;
  }

  audio.pause();
  if (resetTime) {
    audio.currentTime = 0;
  }
}

export function ensureAmbientAudioState() {
  if (!isAudioEnabled()) {
    pauseAmbientAudio(false);
    return;
  }

  if (!isAudioUnlocked()) {
    return;
  }

  playAmbientAudio().catch(() => {});
}

/**
 * Baja temporalmente la música ambiente para destacar SFX importantes.
 * @param {{duckTo?: number, holdMs?: number, restoreMs?: number}} opts
 */
export function duckAmbientAudio(opts = {}) {
  const audio = getAmbientAudioElement();
  if (!audio || !isAudioEnabled()) return;
  if (restoreAmbientTimer) {
    clearTimeout(restoreAmbientTimer);
    restoreAmbientTimer = null;
  }

  const duckTo = Math.max(0, Math.min(1, opts.duckTo ?? 0.14));
  const holdMs = Math.max(0, opts.holdMs ?? 1100);
  const restoreMs = Math.max(120, opts.restoreMs ?? 900);
  const startVol = Number.isFinite(audio.volume) ? audio.volume : DEFAULT_VOLUME;
  const targetVol = Math.max(0.02, Math.min(startVol, duckTo));
  audio.volume = targetVol;

  restoreAmbientTimer = setTimeout(() => {
    const from = Number.isFinite(audio.volume) ? audio.volume : targetVol;
    const to = DEFAULT_VOLUME;
    const steps = 8;
    const stepMs = Math.max(40, Math.round(restoreMs / steps));
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      const t = i / steps;
      audio.volume = from + (to - from) * t;
      if (i >= steps) {
        clearInterval(iv);
      }
    }, stepMs);
    restoreAmbientTimer = null;
  }, holdMs);
}
