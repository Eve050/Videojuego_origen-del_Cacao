import { ensureAmbientAudioState } from "../../modules/audioManager.js";

export function renderP05() {
  ensureAmbientAudioState();
  window.location.hash = "#/p04";
}
