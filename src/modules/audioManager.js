import { AMBIENT_LOOP_URL, SFX_VOL } from "./sfxVolumes.js";

const AUDIO_ELEMENT_ID = "globalAmbientAudio";
const AUDIO_UNLOCK_KEY = "enigma_audio_unlocked";
const AUDIO_ENABLED_KEY = "enigma_audio_enabled";
const DEFAULT_VOLUME = SFX_VOL.ambientBase;
/** Perfil por tramo del runner (índice = order en zonesConfig). Más contraste = cambio audible al cruzar zona. */
const AMBIENT_ZONE_PROFILES = [
  { volumeMul: 1.0, rate: 1.0 }, // 0 palanda — selva
  { volumeMul: 0.88, rate: 0.98 }, // 1 andes — más seco
  { volumeMul: 0.93, rate: 1.02 }, // 2 colombia-panamá
  { volumeMul: 0.86, rate: 0.99 }, // 3 mesoamérica
  { volumeMul: 0.82, rate: 0.965 }, // 4 europa — más tenue
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
  audio.src = AMBIENT_LOOP_URL;
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

  const duckTo = Math.max(0, Math.min(1, opts.duckTo ?? SFX_VOL.duckMissionTo));
  const holdMs = Math.max(0, opts.holdMs ?? SFX_VOL.duckMissionHoldMs);
  const restoreMs = Math.max(120, opts.restoreMs ?? SFX_VOL.duckMissionRestoreMs);
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
