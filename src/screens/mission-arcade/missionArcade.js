import { ensureAmbientAudioState } from "../../modules/audioManager.js";
import { getGameState, isMissionUnlocked } from "../../modules/gameState.js";
import { bindRunnerGameOverUI } from "../../modules/runnerGameOverUI.js";
import { startPhaserGame } from "../../phaser/phaserHost.js";

const CABIN_COPY = {
  1: {
    marquee: "CABINA I",
    title: "ORIGEN DEL CACAO",
    sub: "Exploración + quiz · Santa Ana",
  },
  2: {
    marquee: "CABINA II",
    title: "VIAJE DEL CACAO",
    sub: "Auto-runner histórico · 5 zonas",
  },
  3: {
    marquee: "CABINA III",
    title: "CACAO MAZE",
    sub: "Laberinto cultural · guardianes",
  },
};

/**
 * Misiones del mapa (P04): minijuego Phaser con marco tipo máquina arcade retro.
 * Secuencia: misión 1 → 2 → 3 (isMissionUnlocked en gameState).
 */
export function renderMissionArcade(container, missionNumber) {
  ensureAmbientAudioState();
  const state = getGameState();

  if (!state.missionAccepted) {
    window.location.hash = "#/p03";
    return;
  }
  if (!isMissionUnlocked(missionNumber)) {
    window.location.hash = "#/p04";
    return;
  }

  const copy = CABIN_COPY[missionNumber];
  if (!copy) {
    window.location.hash = "#/p04";
    return;
  }

  container.innerHTML = `
    <section class="mission-arcade" aria-label="Minijuego arcade misión ${missionNumber}">
      <div class="mission-arcade-vignette" aria-hidden="true"></div>
      <header class="mission-arcade-top">
        <p class="mission-arcade-brand">EL ENIGMA DE SANTA ANA · LA FLORIDA</p>
        <p class="mission-arcade-marquee">${copy.marquee}</p>
        <h1 class="mission-arcade-title">${copy.title}</h1>
        <p class="mission-arcade-sub">${copy.sub}</p>
        <p class="mission-arcade-coin">◆ MISION ${missionNumber} DE 3 — SUPERALA PARA DESBLOQUEAR LA SIGUIENTE ◆</p>
      </header>

      <div class="mission-arcade-machine">
        <div class="mission-arcade-bezel" aria-hidden="true">
          <span class="mission-arcade-screw mission-arcade-screw--tl"></span>
          <span class="mission-arcade-screw mission-arcade-screw--tr"></span>
          <span class="mission-arcade-screw mission-arcade-screw--bl"></span>
          <span class="mission-arcade-screw mission-arcade-screw--br"></span>
        </div>
        <div class="mission-arcade-screen-wrap">
          <div class="mission-arcade-crt">
            <div class="mission-arcade-scanlines" aria-hidden="true"></div>
            <div id="missionPhaserRoot" class="mission-arcade-phaser-host"></div>
          </div>
        </div>
        <footer class="mission-arcade-panel">
          <span class="mission-arcade-led">1UP</span>
          <span class="mission-arcade-led mission-arcade-led--blink">INSERT COIN</span>
          <button type="button" class="mission-arcade-exit" id="missionArcadeExit">Salir al mapa</button>
        </footer>
      </div>
    </section>
  `;

  const exitToMap = () => {
    import("../../phaser/phaserHost.js").then(({ destroyPhaserGame }) => {
      destroyPhaserGame();
      window.location.hash = "#/p04";
    });
  };

  container.querySelector("#missionArcadeExit")?.addEventListener("click", exitToMap);

  document.body.classList.add("enigma-lock-scroll");
  document.documentElement.classList.add("enigma-lock-scroll");

  if (missionNumber === 2) {
    bindRunnerGameOverUI(container, {
      sectionSelector: ".mission-arcade",
      wrapSelector: ".mission-arcade-screen-wrap",
      onRetry: () => {
        import("../../phaser/phaserHost.js").then(({ destroyPhaserGame, startPhaserGame }) => {
          destroyPhaserGame();
          const mount = container.querySelector("#missionPhaserRoot");
          if (mount) {
            startPhaserGame(mount, {
              expeditionMission: missionNumber,
              directRunner: true,
            });
          }
        });
      },
      onExitMap: exitToMap,
    });
  }

  const mount = container.querySelector("#missionPhaserRoot");
  if (mount) {
    startPhaserGame(mount, { expeditionMission: missionNumber });
  }
}
