import { bindRunnerGameOverUI } from "../../modules/runnerGameOverUI.js";
import { startPhaserGame, destroyPhaserGame } from "../../phaser/phaserHost.js";

/**
 * Ruta #/phaser — motor según propuesta técnica del mismo documento.
 */
export function renderP11PhaserLab(container) {
  destroyPhaserGame();
  document.body.classList.add("enigma-lock-scroll");
  document.documentElement.classList.add("enigma-lock-scroll");

  container.innerHTML = `
    <section class="screen screen--phaser-lab" aria-label="Minijuegos Phaser">
      <header class="phaser-lab-bar">
        <p class="phaser-lab-title">PROPUESTA DE MINIJUEGOS EDUCATIVOS | El Enigma de Santa Ana – La Florida</p>
        <button type="button" class="btn btn--secondary phaser-lab-back" id="phaserLabBack">
          Volver al mapa
        </button>
      </header>
      <div class="phaser-lab-canvas-wrap" id="phaserMount"></div>
      <p class="phaser-lab-foot">
        Contenido alineado al documento del cliente (v1.0, marzo 2026). Plan Binacional Ecuador–Perú • Proyecto Palanda.
      </p>
    </section>
  `;

  const exitLab = () => {
    destroyPhaserGame();
    window.location.hash = "#/p04";
  };

  container.querySelector("#phaserLabBack")?.addEventListener("click", exitLab);

  bindRunnerGameOverUI(container, {
    sectionSelector: ".screen--phaser-lab",
    wrapSelector: "#phaserMount",
    onRetry: () => {
      import("../../phaser/phaserHost.js").then(({ destroyPhaserGame, startPhaserGame }) => {
        destroyPhaserGame();
        const m = container.querySelector("#phaserMount");
        if (!m) return;
        m.replaceChildren();
        const inner = document.createElement("div");
        inner.id = "phaser-root";
        inner.className = "phaser-root";
        m.appendChild(inner);
        startPhaserGame(inner, { directRunner: true });
      });
    },
    onExitMap: exitLab,
  });

  const mount = container.querySelector("#phaserMount");
  if (mount) {
    const inner = document.createElement("div");
    inner.id = "phaser-root";
    inner.className = "phaser-root";
    mount.appendChild(inner);
    startPhaserGame(inner);
  }
}
