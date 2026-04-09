/** Evento emitido por Game2Scene cuando no hay vidas (host = pantalla HTML sobre el canvas). */
export const RUNNER_GAME_OVER_EVENT = "enigma-runner-game-over";

/**
 * Muestra GAME OVER con botones HTML (evita fallos de input con Phaser SCALE_FIT).
 * @param {HTMLElement} container — típicamente #app
 * @param {{ sectionSelector: string; wrapSelector: string; onRetry: () => void; onExitMap: () => void }} opts
 */
export function bindRunnerGameOverUI(container, { sectionSelector, wrapSelector, onRetry, onExitMap }) {
  const section = container.querySelector(sectionSelector);
  if (!section) return;

  section.addEventListener(RUNNER_GAME_OVER_EVENT, (ev) => {
    const wrap = container.querySelector(wrapSelector);
    if (!wrap) return;

    const d = ev.detail || {};
    wrap.querySelector(".mission-arcade-runner-gameover")?.remove();

    const overlay = document.createElement("div");
    overlay.className = "mission-arcade-runner-gameover";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Fin de partida");
    overlay.innerHTML = `
        <div class="mission-arcade-runner-gameover-card">
          <h2 class="mission-arcade-runner-go-title">GAME OVER</h2>
          <p class="mission-arcade-runner-go-sub">Sin vidas</p>
          <div class="mission-arcade-runner-go-stats">
            <p>Puntos: <strong>${Number(d.points ?? 0)}</strong></p>
            <p>Vasijas: <strong>${Number(d.vainas ?? 0)}</strong></p>
            <p>Datos: <strong>${Number(d.datos ?? 0)}</strong> / 5</p>
          </div>
          <p class="mission-arcade-runner-go-hint">Elige qué quieres hacer ahora:</p>
          <div class="mission-arcade-runner-go-actions">
            <button type="button" class="mission-arcade-runner-go-btn mission-arcade-runner-go-btn--primary" data-runner-retry>
              VOLVER A JUGAR
            </button>
            <p class="mission-arcade-runner-go-micro">Solo el minijuego del viaje del cacao: nueva partida al instante.</p>
            <button type="button" class="mission-arcade-runner-go-btn" data-runner-map>
              VOLVER AL MAPA
            </button>
            <p class="mission-arcade-runner-go-micro">Sales del minijuego y vuelves al mapa principal de la expedición.</p>
          </div>
        </div>
      `;
    wrap.appendChild(overlay);

    overlay.querySelector("[data-runner-retry]")?.addEventListener("click", () => {
      overlay.remove();
      onRetry();
    });
    overlay.querySelector("[data-runner-map]")?.addEventListener("click", onExitMap);
  });
}
