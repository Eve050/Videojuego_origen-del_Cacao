import { ensureAmbientAudioState } from "../../modules/audioManager.js";
import { areAllMissionsComplete, getGameState } from "../../modules/gameState.js";

export function renderP09(container) {
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

  const playerName = (state.playerName || "Explorador").trim();

  container.innerHTML = `
    <section class="screen screen--p09" aria-label="Revelacion de la reliquia">
      <article class="p09-card">
        <p class="menu-stage">DESENLACE</p>
        <h1 class="p09-headline">Reliquia encontrada</h1>
        <p class="p09-lead">
          ${playerName}, la expedicion en la Ruta Origenes del Cacao llega a su punto algido.
        </p>

        <div class="p09-relic-stage" aria-hidden="true">
          <div class="p09-relic-glow"></div>
          <div class="p09-relic-figure">
            <span class="p09-relic-emoji" aria-hidden="true">🏺</span>
            <p class="p09-relic-caption">Vasija ceremonial Mayo-Chinchipe</p>
          </div>
        </div>

        <p class="p09-story">
          En Santa Ana-La Florida, esta pieza ceramica confirma el vinculo ancestral entre el cacao
          ritual y las comunidades que habitaron Palanda. Es parte del patrimonio que protege
          la memoria del Ecuador amazonico.
        </p>

        <div class="p09-actions">
          <button class="btn btn--primary p09-cert-btn" id="p09ToCertificate" type="button">
            Recibir mi certificado
          </button>
          <button class="btn btn--secondary p09-map-btn" id="p09BackMap" type="button">
            Volver al mapa
          </button>
        </div>
      </article>
    </section>
  `;

  container.querySelector("#p09ToCertificate")?.addEventListener("click", () => {
    window.location.hash = "#/p10";
  });

  container.querySelector("#p09BackMap")?.addEventListener("click", () => {
    window.location.hash = "#/p04";
  });
}
