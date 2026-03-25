import { startPhaserGame, destroyPhaserGame } from "../../phaser/phaserHost.js";

/**
 * Ruta #/phaser — motor según propuesta técnica del mismo documento.
 */
export function renderP11PhaserLab(container) {
  destroyPhaserGame();

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

  container.querySelector("#phaserLabBack")?.addEventListener("click", () => {
    destroyPhaserGame();
    window.location.hash = "#/p04";
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
