import { getGameState, markScreenVisited } from "../../modules/gameState.js";
import {
  ensureAmbientAudioState,
  isAudioEnabled,
  isAudioUnlocked,
  pauseAmbientAudio as pauseGlobalAmbientAudio,
  playAmbientAudio,
  setAudioEnabled,
} from "../../modules/audioManager.js";

const HELP_STEPS = [
  "Escribe tu nombre en la siguiente pantalla para registrar tu aventura.",
  "Lee la historia inicial y acepta la mision para desbloquear el mapa.",
  "Completa las tres misiones educativas para descubrir la reliquia.",
  "Al terminar, podras descargar tu certificado en PDF.",
];
export function renderP01(container) {
  const state = getGameState();
  const hasPlayerName = state.playerName.length > 0;
  const playLabel = "JUGAR";
  const explorerName = hasPlayerName ? state.playerName : "";
  const missionStatus = state.missionAccepted
    ? "Mision aceptada"
    : "Esperando mision";
  const audioPreviouslyUnlocked = isAudioUnlocked();
  const audioEnabledByDefault = isAudioEnabled();
  const audioOverlayClass = audioPreviouslyUnlocked
    || !audioEnabledByDefault
    ? "p01-audio-overlay is-hidden"
    : "p01-audio-overlay";

  markScreenVisited("p01Visited");

  container.innerHTML = `
    <section class="screen screen--p01" aria-label="Pantalla de inicio">
      <aside class="${audioOverlayClass}" id="audioOverlay">
        <div class="p01-audio-panel">
          <p class="p01-audio-title">Activar experiencia inmersiva</p>
          <p class="p01-audio-copy">Pulsa para iniciar la musica ambiental del juego.</p>
          <button class="btn btn--p01-primary" id="unlockAudioButton" type="button">
            ACTIVAR AUDIO
          </button>
        </div>
      </aside>

      <div class="p01-shell">
        <button class="btn p01-audio-toggle" id="audioToggleButton" type="button">
          MUSICA: ${audioEnabledByDefault ? "ON" : "OFF"}
        </button>

        <span class="p01-corner p01-corner--tl" aria-hidden="true"></span>
        <span class="p01-corner p01-corner--tr" aria-hidden="true"></span>
        <span class="p01-corner p01-corner--bl" aria-hidden="true"></span>
        <span class="p01-corner p01-corner--br" aria-hidden="true"></span>

        <header class="p01-topbar">
          <article class="p01-chip">
            <p class="p01-chip-title">EXPLORADOR</p>
            <p class="p01-chip-copy">${explorerName}</p>
          </article>

          <article class="p01-chip p01-chip--right">
            <p class="p01-chip-title">MISION <span class="p01-dot" aria-hidden="true"></span></p>
            <p class="p01-chip-copy">${missionStatus}</p>
          </article>
        </header>

        <header class="p01-hero">
          <h1 class="p01-title">
            <span class="p01-title-light">EL ENIGMA DE</span>
            <span class="p01-title-gold">SANTA ANA</span>
            <span class="p01-title-light p01-title-sub">LA FLORIDA</span>
          </h1>
        </header>

        <article class="p01-actions-box">
          <button class="btn btn--p01-primary" id="playButton" type="button">${playLabel}</button>
          <button class="btn btn--p01-secondary" id="helpButton" type="button">AYUDA</button>
          ${
            showRestart
              ? `<button class="btn btn--p01-secondary p01-restart-btn" id="p01RestartButton" type="button">NUEVA EXPEDICION</button>`
              : ""
          }
          <p class="audio-hint" id="audioStatus">Cargando musica ambiental...</p>
        </article>

        ${
          hasPlayerName
            ? `<p class="p01-reset-name"><button type="button" class="p01-reset-name-link" id="p01RestartFullButton">Usar otro nombre / borrar mi registro</button></p>`
            : ""
        }

        <footer class="screen-footer">VERSION 0.3.0 - PROTOTIPO P01</footer>
      </div>
    </section>

    <dialog class="help-modal" id="helpModal" aria-label="Instrucciones del juego">
      <div class="help-panel">
        <h2 class="help-title">Como jugar</h2>
        <ol class="help-list">
          ${HELP_STEPS.map((step) => `<li>${step}</li>`).join("")}
        </ol>
        <div class="help-actions">
          <button class="btn btn--secondary" id="closeHelpButton" type="button">Cerrar</button>
        </div>
      </div>
    </dialog>

  `;

  const playButton = container.querySelector("#playButton");
  const helpButton = container.querySelector("#helpButton");
  const closeHelpButton = container.querySelector("#closeHelpButton");
  const helpModal = container.querySelector("#helpModal");
  const audioStatus = container.querySelector("#audioStatus");
  const audioOverlay = container.querySelector("#audioOverlay");
  const unlockAudioButton = container.querySelector("#unlockAudioButton");
  const audioToggleButton = container.querySelector("#audioToggleButton");
  let audioEnabled = audioEnabledByDefault;

  playButton?.addEventListener("click", () => {
    window.location.hash = "#/p02";
  });

  helpButton?.addEventListener("click", () => {
    helpModal?.showModal();
  });

  closeHelpButton?.addEventListener("click", () => {
    helpModal?.close();
  });

  helpModal?.addEventListener("click", (event) => {
    const dialogBox = helpModal.getBoundingClientRect();
    const isOutside =
      event.clientX < dialogBox.left ||
      event.clientX > dialogBox.right ||
      event.clientY < dialogBox.top ||
      event.clientY > dialogBox.bottom;

    if (isOutside) {
      helpModal.close();
    }
  });

  const updateAudioToggleUi = () => {
    if (!audioToggleButton) {
      return;
    }

    audioToggleButton.textContent = `MUSICA ${audioEnabled ? "ON" : "OFF"}`;
    audioToggleButton.classList.toggle("is-off", !audioEnabled);
  };

  const stopAmbientAudio = () => {
    pauseGlobalAmbientAudio(true);
    if (audioStatus) {
      audioStatus.textContent = "Musica en OFF.";
    }
  };

  const startAmbientAudio = async () => {
    if (!audioEnabled) {
      stopAmbientAudio();
      audioOverlay?.classList.add("is-hidden");
      return;
    }

    try {
      await playAmbientAudio();
      if (audioStatus) {
        audioStatus.textContent = "Musica activada: ambiente de selva nocturna.";
      }
      audioOverlay?.classList.add("is-hidden");
    } catch {
      if (audioStatus) {
        audioStatus.textContent = "Pulsa Activar audio para iniciar la musica.";
      }
      audioOverlay?.classList.remove("is-hidden");
    }
  };

  unlockAudioButton?.addEventListener("click", () => {
    audioEnabled = true;
    setAudioEnabled(true);
    updateAudioToggleUi();
    void startAmbientAudio();
  });

  audioToggleButton?.addEventListener("click", () => {
    audioEnabled = !audioEnabled;
    setAudioEnabled(audioEnabled);
    updateAudioToggleUi();

    if (audioEnabled) {
      if (isAudioUnlocked()) {
        void startAmbientAudio();
      } else {
        audioOverlay?.classList.remove("is-hidden");
        if (audioStatus) {
          audioStatus.textContent = "Pulsa Activar audio para iniciar la musica.";
        }
      }
      return;
    }

    stopAmbientAudio();
    audioOverlay?.classList.add("is-hidden");
  });

  updateAudioToggleUi();
  ensureAmbientAudioState();
  void startAmbientAudio();
}
