import { getGameState, setPlayerName } from "../../modules/gameState.js";
import { ensureAmbientAudioState } from "../../modules/audioManager.js";

const DANGEROUS_CHARACTERS_REGEX = /[<>"'`{}[\]\\]/;

export function renderP02(container) {
  const state = getGameState();
  const initialName = state.playerName ?? "";
  ensureAmbientAudioState();

  container.innerHTML = `
    <section class="screen screen--p02">
      <article class="p02-card">
        <p class="menu-stage">REGISTRO</p>
        <h2 class="p02-title">¿Cómo te<br />llamas,<br />explorador?</h2>
        <p class="p02-subtitle">Registro para certificado de expedición</p>

        <label class="name-label" for="playerNameInput">Nombre del explorador</label>
        <input
          class="name-input"
          id="playerNameInput"
          name="playerName"
          type="text"
          maxlength="50"
          value="${initialName}"
          placeholder="Tu nombre..."
          autocomplete="name"
        />
        <p class="name-feedback" id="nameFeedback"></p>

        <p class="p02-info">
          Tu nombre se guardará solo en esta sesión y se usará exclusivamente para
          generar tu certificado PDF. No se envía a ningún servidor.
        </p>

        <div class="p02-actions">
          <button class="btn btn--primary" id="goP03" type="button" disabled>Comenzar</button>
          <button class="btn btn--secondary p02-back-button" id="goBackP01" type="button">Volver</button>
        </div>
      </article>
    </section>
  `;

  const playerNameInput = container.querySelector("#playerNameInput");
  const nameFeedback = container.querySelector("#nameFeedback");
  const goP03Button = container.querySelector("#goP03");

  const updateUiFromName = () => {
    const inputValue = playerNameInput?.value ?? "";
    const cleanName = inputValue.trim().replace(/\s+/g, " ");

    if (!cleanName) {
      if (nameFeedback) {
        nameFeedback.textContent = "Ingresa tu nombre para continuar.";
      }
      if (goP03Button) {
        goP03Button.disabled = true;
      }
      return;
    }

    if (DANGEROUS_CHARACTERS_REGEX.test(cleanName)) {
      if (nameFeedback) {
        nameFeedback.textContent =
          "Tu nombre contiene caracteres no permitidos. Usa solo letras, números y espacios.";
      }
      if (goP03Button) {
        goP03Button.disabled = true;
      }
      return;
    }

    if (nameFeedback) {
      nameFeedback.textContent = `Nombre listo: ${cleanName}`;
    }
    if (goP03Button) {
      goP03Button.disabled = false;
    }
  };

  playerNameInput?.addEventListener("input", updateUiFromName);
  updateUiFromName();

  container.querySelector("#goBackP01")?.addEventListener("click", () => {
    window.location.hash = "#/p01";
  });

  container.querySelector("#goP03")?.addEventListener("click", () => {
    const cleanName = (playerNameInput?.value ?? "").trim().replace(/\s+/g, " ");
    if (!cleanName || DANGEROUS_CHARACTERS_REGEX.test(cleanName)) {
      return;
    }

    setPlayerName(cleanName);
    window.location.hash = "#/p03";
  });
}
