import { ensureAmbientAudioState } from "../../modules/audioManager.js";

export function renderP08(container) {
  ensureAmbientAudioState();

  container.innerHTML = `
    <section class="screen screen--form">
      <article class="placeholder-card">
        <p class="menu-stage">P08 - MISION 3</p>
        <h2 class="help-title">Mision 3 en construccion</h2>
        <p class="form-copy">
          Esta mision sera implementada en el siguiente paso.
        </p>
        <div class="menu-actions" style="margin-top: 1rem;">
          <button class="btn btn--secondary" id="goBackP04" type="button">Volver al mapa</button>
        </div>
      </article>
    </section>
  `;

  container.querySelector("#goBackP04")?.addEventListener("click", () => {
    window.location.hash = "#/p04";
  });
}
