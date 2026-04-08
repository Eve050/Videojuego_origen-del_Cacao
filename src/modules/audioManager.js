const AUDIO_ELEMENT_ID = "globalAmbientAudio";
const AUDIO_UNLOCK_KEY = "enigma_audio_unlocked";
const AUDIO_ENABLED_KEY = "enigma_audio_enabled";
const DEFAULT_VOLUME = 0.35;
const AMBIENT_ZONE_PROFILES = [
  { volumeMul: 1.0, rate: 1.0 }, // Selva / Palanda
  { volumeMul: 0.92, rate: 0.985 }, // Andes
  { volumeMul: 0.96, rate: 1.015 }, // Colombia/Panamá
  { volumeMul: 0.94, rate: 0.99 }, // Mesoamérica
  { volumeMul: 0.9, rate: 0.97 }, // Europa
];
let restoreAmbientTimer = null;
let ambientBaseVolume = DEFAULT_VOLUME;

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
  audio.volume = ambientBaseVolume;
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

export function applyAmbientZoneProfile(zoneIndex = 0, opts = {}) {
  const audio = getAmbientAudioElement();
  const idx = Math.max(0, Math.min(AMBIENT_ZONE_PROFILES.length - 1, zoneIndex));
  const profile = AMBIENT_ZONE_PROFILES[idx];
  ambientBaseVolume = Math.max(0.05, Math.min(1, DEFAULT_VOLUME * profile.volumeMul));
  if (!audio) return;
  audio.playbackRate = Math.max(0.75, Math.min(1.25, profile.rate));
  if (opts.instant) {
    audio.volume = ambientBaseVolume;
    return;
  }
  const from = Number.isFinite(audio.volume) ? audio.volume : ambientBaseVolume;
  const to = ambientBaseVolume;
  const steps = 6;
  const stepMs = 55;
  let i = 0;
  const iv = setInterval(() => {
    i += 1;
    const t = i / steps;
    audio.volume = from + (to - from) * t;
    if (i >= steps) clearInterval(iv);
  }, stepMs);
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
    const to = ambientBaseVolume;
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
