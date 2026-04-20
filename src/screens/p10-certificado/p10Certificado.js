import { downloadCertificatePdf } from "../../certificate/buildCertificatePdf.js";
import { ensureAmbientAudioState } from "../../modules/audioManager.js";
import {
  areAllMissionsComplete,
  getGameState,
  markCertificateDownloaded,
  restartExpedition,
} from "../../modules/gameState.js";

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCertDate() {
  const d = new Date();
  const months = [
    "ENE",
    "FEB",
    "MAR",
    "ABR",
    "MAY",
    "JUN",
    "JUL",
    "AGO",
    "SEP",
    "OCT",
    "NOV",
    "DIC",
  ];
  return `${d.getDate()} · ${months[d.getMonth()]} · ${d.getFullYear()}`;
}

export function renderP10(container) {
  ensureAmbientAudioState();

  const state = getGameState();
  if (!state.missionAccepted) {
    window.location.hash = "#/p03";
    return;
  }
  if (!areAllMissionsComplete()) {
    window.location.hash = "#/p04";
    return;
  }

  const playerName = (state.playerName || "").trim();
  if (!playerName) {
    window.location.hash = "#/p02";
    return;
  }

  const downloaded = Boolean(state.certificateDownloaded);
  const safeName = escapeHtml(playerName);
  const nameDisplay = escapeHtml(playerName.toUpperCase());
  const certDate = formatCertDate();

  container.innerHTML = `
    <section class="screen screen--p10" aria-label="Certificado digital">
      <article class="p10-stack">
        <header class="p10-hero">
          <p class="p10-hero-kicker">Expedición finalizada</p>
          <h1 class="p10-hero-title">¡Misterio resuelto!</h1>
        </header>

        <div class="p10-cert-shell">
          <div class="p10-cert-frame" aria-label="Certificado de honor">
            <span class="p10-corner p10-corner--tl" aria-hidden="true"></span>
            <span class="p10-corner p10-corner--tr" aria-hidden="true"></span>
            <span class="p10-corner p10-corner--bl" aria-hidden="true"></span>
            <span class="p10-corner p10-corner--br" aria-hidden="true"></span>

            <div class="p10-cert-inner">
              <p class="p10-cert-brand">El Enigma de Santa Ana</p>
              <p class="p10-cert-honor">Certificado de honor</p>
              <p class="p10-cert-name">${nameDisplay}</p>
              <p class="p10-cert-body">
                Este documento certifica que <strong>${safeName}</strong> ha completado con éxito la
                expedición por las tierras ancestrales, descifrando los secretos ocultos entre las
                sombras de la selva, y ha obtenido el rango honorífico de:
              </p>
              <p class="p10-cert-badge">
                <span class="p10-cert-badge-text">Explorador del Cacao</span>
              </p>

              <div class="p10-seal-block">
                <div class="p10-seal-art" aria-hidden="true">
                  <span class="p10-seal-icon">🫘</span>
                  <span class="p10-seal-icon p10-seal-icon--leaf">🌿</span>
                </div>
                <span class="p10-seal-label">Autenticidad ancestral</span>
              </div>

              <footer class="p10-cert-footer">
                <span class="p10-cert-sign">Ruta Orígenes del Cacao</span>
                <span class="p10-cert-date">${certDate}</span>
              </footer>
            </div>
          </div>
        </div>

        <p
          class="p10-status ${downloaded ? "is-done" : ""}"
          id="p10DownloadStatus"
          role="status"
        >
          ${
            downloaded
              ? "Certificado descargado. Gracias por completar la expedición."
              : "Genera tu PDF en un clic. Todo ocurre en tu navegador, sin enviar datos."
          }
        </p>

        <div class="p10-actions-row">
          <button class="p10-btn p10-btn--download" id="p10DownloadBtn" type="button">
            <svg class="p10-btn-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Descargar PDF
          </button>
          <button class="p10-btn p10-btn--replay" id="p10ReplayBtn" type="button">
            <span class="p10-btn-unicode" aria-hidden="true">↻</span>
            Jugar de nuevo
          </button>
        </div>

        <button class="p10-back-link" id="p10FinaleBtn" type="button">
          Volver a la revelación
        </button>
      </article>
    </section>
  `;

  const statusEl = container.querySelector("#p10DownloadStatus");

  container.querySelector("#p10DownloadBtn")?.addEventListener("click", () => {
    try {
      downloadCertificatePdf({ playerName });
      markCertificateDownloaded();
      if (statusEl) {
        statusEl.classList.add("is-done");
        statusEl.textContent = "Certificado descargado. ¡Gracias por explorar la ruta!";
      }
    } catch (err) {
      console.error(err);
      if (statusEl) {
        statusEl.classList.remove("is-done");
        statusEl.textContent = "No se pudo generar el PDF. Intenta de nuevo o usa otro navegador.";
      }
    }
  });

  container.querySelector("#p10ReplayBtn")?.addEventListener("click", () => {
    restartExpedition({ clearPlayerName: false });
    window.location.hash = "#/p01";
  });

  container.querySelector("#p10FinaleBtn")?.addEventListener("click", () => {
    window.location.hash = "#/p09";
  });
}
