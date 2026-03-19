import { acceptMission, getGameState } from "../../modules/gameState.js";
import { ensureAmbientAudioState } from "../../modules/audioManager.js";

export function renderP03(container) {
  const state = getGameState();
  ensureAmbientAudioState();
  const playerName = state.playerName || "Explorador/a";
  const slides = [
    {
      chapter: "CAPITULO I",
      titleMain: "La Reliquia",
      titleAccent: "Perdida",
      text: "En la selva de Palanda, una reliquia Mayo-Chinchipe desaparecio durante la noche.",
    },
    {
      chapter: "PISTA 1",
      titleMain: "Ruta Origenes",
      titleAccent: "del Cacao",
      text: `${playerName}, tu mision inicia en la Ruta Origenes del Cacao. Debes seguir las pistas.`,
    },
    {
      chapter: "PISTA 2",
      titleMain: "Tres",
      titleAccent: "Desafios",
      text: "Supera tres misiones educativas para desbloquear el mapa completo del recorrido.",
    },
    {
      chapter: "OBJETIVO",
      titleMain: "Recuperar",
      titleAccent: "la reliquia",
      text: "Acepta la mision y avanza al mapa para encontrar la reliquia perdida.",
    },
  ];

  const playerNameDisplay = playerName.toUpperCase();

  container.innerHTML = `
    <section class="screen screen--p03">
      <article class="p03-card">
        <aside class="p03-illustration">
          <div class="p03-identity-wrap">
            <div class="p03-avatar">
              <img
                class="p03-avatar-icon"
                src="https://img.icons8.com/fluency/96/compass.png"
                alt="Icono de brujula"
                loading="lazy"
              />
            </div>
            <span class="p03-avatar-badge">TU EXPLORADOR</span>
            <p class="p03-avatar-name">${playerNameDisplay}</p>
          </div>

          <div class="p03-left-progress">
            <span class="p03-left-progress-label">PROGRESO DE HISTORIA</span>
            <div class="p03-left-progress-row">
              <div class="p03-progress-track p03-progress-track--left">
                <span class="p03-progress-fill" id="p03ProgressFillLeft"></span>
              </div>
              <span class="p03-progress-count" id="p03ProgressCountLeft"></span>
            </div>
          </div>
        </aside>

        <section class="p03-content">
          <p class="p03-chapter" id="p03Chapter"></p>
          <h2 class="p03-title" id="p03Title">
            <span class="p03-title-main" id="p03TitleMain"></span>
            <span class="p03-title-accent" id="p03TitleAccent"></span>
          </h2>
          <p class="p03-text" id="p03Text"></p>

          <div class="p03-actions">
            <button class="btn btn--primary p03-next-button" id="p03NextButton" type="button">
              Siguiente →
            </button>
            <div class="p03-actions-row">
              <button class="btn btn--secondary p03-skip-button" id="p03SkipButton" type="button">
                Saltar introduccion
              </button>
              <button class="btn btn--secondary p03-back-button" id="p03BackButton" type="button">
                Volver a registro
              </button>
            </div>
          </div>
        </section>
      </article>
    </section>
  `;

  const chapterElement = container.querySelector("#p03Chapter");
  const titleMainElement = container.querySelector("#p03TitleMain");
  const titleAccentElement = container.querySelector("#p03TitleAccent");
  const textElement = container.querySelector("#p03Text");
  const progressCountElement = container.querySelector("#p03ProgressCountLeft");
  const progressFillElement = container.querySelector("#p03ProgressFillLeft");
  const nextButton = container.querySelector("#p03NextButton");
  const skipButton = container.querySelector("#p03SkipButton");
  const backButton = container.querySelector("#p03BackButton");
  let currentSlide = 0;

  if (!state.playerName) {
    window.location.hash = "#/p02";
    return;
  }

  const goToP04 = () => {
    acceptMission();
    window.location.hash = "#/p04";
  };

  const renderSlide = () => {
    const slide = slides[currentSlide];
    const slideNumber = currentSlide + 1;
    const progressPercent = (slideNumber / slides.length) * 100;

    if (chapterElement) {
      chapterElement.textContent = slide.chapter;
    }
    if (titleMainElement) {
      titleMainElement.textContent = slide.titleMain;
    }
    if (titleAccentElement) {
      titleAccentElement.textContent = slide.titleAccent;
    }
    if (textElement) {
      textElement.textContent = slide.text;
    }
    if (progressCountElement) {
      progressCountElement.textContent = `${slideNumber}/${slides.length}`;
    }
    if (progressFillElement) {
      progressFillElement.style.width = `${progressPercent}%`;
    }
    if (nextButton) {
      nextButton.textContent = slideNumber === slides.length ? "Continuar al mapa →" : "Siguiente →";
    }
  };

  nextButton?.addEventListener("click", () => {
    const isLastSlide = currentSlide === slides.length - 1;
    if (isLastSlide) {
      goToP04();
      return;
    }

    currentSlide += 1;
    renderSlide();
  });

  skipButton?.addEventListener("click", goToP04);
  backButton?.addEventListener("click", () => {
    window.location.hash = "#/p02";
  });

  renderSlide();
}
