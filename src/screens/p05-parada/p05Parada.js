import { ensureAmbientAudioState } from "../../modules/audioManager.js";
import { renderP04 } from "../p04-mapa/p04Mapa.js";

/**
 * P05 no es una pantalla propia: muestra el mapa (P04) y sincroniza la URL.
 * Así el #app nunca queda vacío si hashchange no dispara a tiempo.
 */
export function renderP05(container) {
  ensureAmbientAudioState();
  if (window.location.hash === "#/p05") {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#/p04`);
  }
  renderP04(container);
}
