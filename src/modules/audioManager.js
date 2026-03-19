const AUDIO_ELEMENT_ID = "globalAmbientAudio";
const AUDIO_UNLOCK_KEY = "enigma_audio_unlocked";
const AUDIO_ENABLED_KEY = "enigma_audio_enabled";
const DEFAULT_VOLUME = 0.35;

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

export function isAudioEnabled() {
  return window.localStorage.getItem(AUDIO_ENABLED_KEY) !== "off";
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
