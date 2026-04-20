import { ensureAmbientAudioState } from "../../modules/audioManager.js";
import {
  EXPEDITION_MISSION_TOTAL,
  getActiveStopIndexForMissions,
  getGameState,
  getPostRestartRoute,
  markScreenVisited,
  restartExpedition,
  setSelectedStopIndex,
} from "../../modules/gameState.js";

const ROUTE_STOPS = [
  {
    id: "loja",
    label: "Loja",
    country: "Ecuador",
    x: 14,
    y: 12,
    description: "Inicio de la expedición en la sierra sur del Ecuador.",
    tagline: "Sierra sur y orígenes del cacao",
    difficulty: "Explorador",
    mystery: "Reliquia I",
    image: "",
  },
  {
    id: "vilcabamba",
    label: "Vilcabamba",
    country: "Ecuador",
    x: 26,
    y: 23,
    description:
      "Conocido como el valle de la longevidad: clima suave y pistas ancestrales del cacao en la cordillera.",
    tagline: "Valle de la longevidad",
    difficulty: "Explorador",
    mystery: "Reliquia II",
    image: "",
  },
  {
    id: "valladolid",
    label: "Valladolid",
    country: "Ecuador",
    x: 36,
    y: 38,
    description: "Zona intermedia con glifos antiguos y coordenadas ocultas.",
    tagline: "Glifos y coordenadas",
    difficulty: "Explorador",
    mystery: "Reliquia III",
    image: "",
  },
  {
    id: "palanda",
    label: "Palanda",
    country: "Ecuador",
    x: 47,
    y: 52,
    description: "Epicentro arqueológico vinculado al origen del cacao.",
    tagline: "Epicentro del cacao",
    difficulty: "Explorador",
    mystery: "Reliquia IV",
    image: "",
  },
  {
    id: "santa-ana",
    label: "Santa Ana-La Florida",
    country: "Ecuador",
    x: 59,
    y: 64,
    description: "Lugar clave para encontrar el rastro de la reliquia.",
    tagline: "Sitio Mayo-Chinchipe",
    difficulty: "Explorador",
    mystery: "Reliquia V",
    image: "",
  },
  {
    id: "zumba",
    label: "Zumba",
    country: "Ecuador",
    x: 70,
    y: 75,
    description: "Conexión fronteriza antes del tramo binacional final.",
    tagline: "Antes de la frontera",
    difficulty: "Explorador",
    mystery: "Reliquia VI",
    image: "",
  },
  {
    id: "san-ignacio",
    label: "San Ignacio",
    country: "Perú",
    x: 81,
    y: 84,
    description: "Parada binacional con pistas de intercambio cultural.",
    tagline: "Intercambio binacional",
    difficulty: "Explorador",
    mystery: "Reliquia VII",
    image: "",
  },
  {
    id: "jaen",
    label: "Jaen",
    country: "Perú",
    x: 91,
    y: 90,
    description: "Destino final de la ruta. Aquí culmina la expedición.",
    tagline: "Cierre de la expedición",
    difficulty: "Explorador",
    mystery: "Reliquia VIII",
    image: "",
  },
];

const TOTAL_MISSIONS = EXPEDITION_MISSION_TOTAL;

function getStopState(index, activeIndex) {
  if (index < activeIndex) {
    return "completed";
  }
  if (index === activeIndex) {
    return "active";
  }
  return "locked";
}

export function renderP04(container) {
  ensureAmbientAudioState();
  markScreenVisited("p04Visited");

  const state = getGameState();

  if (!state.missionAccepted) {
    window.location.hash = "#/p03";
    return;
  }

  const missionsCompleted = Math.max(0, Math.min(TOTAL_MISSIONS, state.missionsCompleted || 0));
  const activeStopIndex = getActiveStopIndexForMissions(missionsCompleted);
  const progressPercent = (missionsCompleted / TOTAL_MISSIONS) * 100;
  const activeStop = ROUTE_STOPS[activeStopIndex];

  container.innerHTML = `
    <section class="screen screen--p04" aria-label="Mapa principal de la ruta">
      <header class="p04-header">
        <article class="p04-progress-card">
          <p class="p04-progress-title">PROGRESO DE EXPEDICIÓN</p>
          <p class="p04-progress-value">${missionsCompleted} de ${TOTAL_MISSIONS} misiones</p>
          <div class="p04-progress-track">
            <span class="p04-progress-fill" style="width: ${progressPercent}%"></span>
          </div>
        </article>

        <button class="p04-intro-button" id="p04IntroButton" type="button" aria-label="Volver a introducción">↩</button>
        <button class="p04-help-button" id="p04HelpButton" type="button" aria-label="Ver información del juego">?</button>
      </header>

      ${
        missionsCompleted >= TOTAL_MISSIONS
          ? `
      <article class="p04-finale-banner" aria-label="Expedición completada">
        <div class="p04-finale-copy">
          <p class="p04-finale-kicker">Misión cumplida</p>
          <p class="p04-finale-title">Tres misiones completadas</p>
          <p class="p04-finale-sub">Obtén tu certificado digital y, si quieres, revisa la revelación final de la reliquia.</p>
        </div>
        <button class="btn btn--primary p04-finale-btn" id="p04FinaleBtn" type="button">
          Ver certificado
        </button>
      </article>
      `
          : ""
      }

      <div class="p04-layout">
        <article class="p04-map-board">
          <svg class="p04-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M 14 12 C 20 18, 25 20, 26 23 C 30 30, 33 34, 36 38 C 40 45, 44 49, 47 52 C 52 58, 56 61, 59 64 C 63 69, 67 72, 70 75 C 74 79, 78 82, 81 84 C 85 87, 88 89, 91 90"
              class="p04-route-line"
            ></path>
          </svg>

          ${ROUTE_STOPS.map((stop, index) => {
            const stopState = getStopState(index, activeStopIndex);
            return `
              <button
                class="p04-stop p04-stop--${stopState}"
                data-stop-index="${index}"
                style="left: ${stop.x}%; top: ${stop.y}%;"
                type="button"
                aria-label="Parada ${stop.label}: ${stopState}"
                ${stopState === "locked" ? "disabled" : ""}
              >
                <span class="p04-stop-pin"></span>
                <span class="p04-stop-label">${stop.label}</span>
              </button>
            `;
          }).join("")}

          <div class="p04-info-modal is-hidden" id="p04InfoModal" role="dialog" aria-modal="true" aria-label="Información del juego">
            <article class="p04-info-modal-card">
              <button class="p04-info-close" id="p04InfoClose" type="button" aria-label="Cerrar información">✕</button>
              <h3 class="p04-info-title">Información del juego</h3>
              <p class="p04-info-text">
                Guía rápida para jugar y completar la expedición:
              </p>
              <ul class="p04-info-list">
                <li><strong>Misión 1 — Origen del Cacao:</strong> explora Santa Ana, encuentra 3 objetos y completa el quiz arqueológico.</li>
                <li><strong>Misión 2 — Viaje del Cacao:</strong> salta obstáculos (↑ / W / ESPACIO), recolecta vasijas y desbloquea datos históricos.</li>
                <li><strong>Misión 3 — Cacao Maze:</strong> recolecta orbes ancestrales, evita guardianes y supera el laberinto cultural.</li>
              </ul>
              <p class="p04-info-text">
                <strong>Cómo iniciar:</strong> selecciona la parada activa del mapa y pulsa <em>Iniciar misión</em>.
              </p>
              <p class="p04-info-text">
                Al completar las 3 misiones, se habilita la fase final para ver y descargar tu certificado.
              </p>
            </article>
          </div>
        </article>

        <aside class="p04-focus-card">
          <p class="p04-focus-chip" id="p04FocusChip">MISIÓN ACTIVA</p>
          <h2 class="p04-focus-title" id="p04FocusTitle">${activeStop.label}</h2>
          <p class="p04-focus-country" id="p04FocusCountry">${activeStop.country}</p>
          <p class="p04-focus-description" id="p04FocusDescription">${activeStop.description}</p>
          <button class="btn btn--primary p04-start-button" id="p04StartButton" type="button">
            Iniciar misión
          </button>
        </aside>
      </div>

      <article class="p04-route-strip" aria-label="Lista de paradas de la ruta">
        ${ROUTE_STOPS.map((stop, index) => {
          const stopState = getStopState(index, activeStopIndex);
          return `
            <button
              class="p04-step-card p04-step-card--${stopState}"
              data-stop-index="${index}"
              type="button"
            >
              <span class="p04-step-label">Paso ${index + 1}</span>
              <span class="p04-step-name">${stop.label}</span>
              <span class="p04-step-state">${
                stopState === "active"
                  ? "En curso"
                  : stopState === "completed"
                    ? "Completado"
                    : "Bloqueado"
              }</span>
            </button>
          `;
        }).join("")}
      </article>

      <div class="p04-stop-modal is-hidden" id="p04StopModal" role="dialog" aria-modal="true" aria-label="Panel de parada">
        <article class="p04-stop-modal-card">
          <button class="p04-stop-modal-close" id="p04ModalClose" type="button" aria-label="Cerrar panel">✕</button>
          <div class="p04-stop-modal-hero" id="p04ModalHero">
            <img class="p04-stop-modal-img" id="p04ModalHeroImg" alt="" loading="lazy" hidden />
            <span class="p04-stop-modal-chip p04-stop-modal-chip--active" id="p04ModalStateChip">DISPONIBLE</span>
          </div>
          <div class="p04-stop-modal-body">
            <p class="p04-stop-modal-kicker" id="p04ModalKicker">PARADA ACTIVA</p>
            <h3 class="p04-stop-modal-title" id="p04ModalTitle">${activeStop.label}</h3>
            <p class="p04-stop-modal-country" id="p04ModalCountry">${activeStop.country}</p>
            <p class="p04-stop-modal-description" id="p04ModalDescription">${activeStop.description}</p>
            <div class="p04-stop-modal-stats" aria-label="Datos de la parada">
              <div class="p04-stop-stat">
                <span class="p04-stop-stat-icon" aria-hidden="true">🧭</span>
                <span class="p04-stop-stat-label">Dificultad</span>
                <span class="p04-stop-stat-value" id="p04ModalDifficulty">Explorador</span>
              </div>
              <div class="p04-stop-stat">
                <span class="p04-stop-stat-icon" aria-hidden="true">📜</span>
                <span class="p04-stop-stat-label">Misterio</span>
                <span class="p04-stop-stat-value" id="p04ModalMystery">Reliquia I</span>
              </div>
            </div>
            <button class="p04-modal-explore" id="p04ExploreZoneButton" type="button">
              Explorar zona
            </button>
            <button type="button" class="p04-modal-later" id="p04ModalMaybeLater">Tal vez luego</button>
            <button type="button" class="p04-modal-dismiss" id="p04ModalBackToMap">Cerrar</button>
          </div>
        </article>
      </div>

    </section>
  `;
  let selectedStopIndex = activeStopIndex;
  setSelectedStopIndex(selectedStopIndex);

  const focusChip = container.querySelector("#p04FocusChip");
  const focusTitle = container.querySelector("#p04FocusTitle");
  const focusCountry = container.querySelector("#p04FocusCountry");
  const focusDescription = container.querySelector("#p04FocusDescription");
  const startButton = container.querySelector("#p04StartButton");
  const stopModal = container.querySelector("#p04StopModal");
  const modalStateChip = container.querySelector("#p04ModalStateChip");
  const modalTitle = container.querySelector("#p04ModalTitle");
  const modalCountry = container.querySelector("#p04ModalCountry");
  const modalDescription = container.querySelector("#p04ModalDescription");
  const modalKicker = container.querySelector("#p04ModalKicker");
  const modalDifficulty = container.querySelector("#p04ModalDifficulty");
  const modalMystery = container.querySelector("#p04ModalMystery");
  const modalHero = container.querySelector("#p04ModalHero");
  const modalHeroImg = container.querySelector("#p04ModalHeroImg");
  const exploreZoneButton = container.querySelector("#p04ExploreZoneButton");
  const infoModal = container.querySelector("#p04InfoModal");

  const getMissionRouteForProgress = () => {
    if (missionsCompleted <= 0) {
      return "#/p06";
    }
    if (missionsCompleted === 1) {
      return "#/p07";
    }
    return "#/p08";
  };

  const renderSelection = () => {
    const stop = ROUTE_STOPS[selectedStopIndex];
    const stopState = getStopState(selectedStopIndex, activeStopIndex);

    if (focusTitle) {
      focusTitle.textContent = stop.label;
    }
    if (focusCountry) {
      focusCountry.textContent = stop.country;
    }
    if (focusDescription) {
      focusDescription.textContent = stop.description;
    }
    if (focusChip) {
      focusChip.textContent =
        stopState === "active"
          ? "MISIÓN ACTIVA"
          : stopState === "completed"
            ? "PARADA COMPLETADA"
            : "PARADA BLOQUEADA";
    }
    if (startButton) {
      if (stopState === "locked") {
        startButton.disabled = true;
        startButton.textContent = "Misión bloqueada";
      } else if (stopState === "completed") {
        startButton.disabled = false;
        startButton.textContent = "Repetir expedición";
      } else {
        startButton.disabled = false;
        startButton.textContent = "Iniciar misión";
      }
    }
    if (modalTitle) {
      modalTitle.textContent = stop.label;
    }
    if (modalCountry) {
      modalCountry.textContent = stop.country.toUpperCase();
    }
    if (modalDescription) {
      modalDescription.textContent = stop.description;
    }
    if (modalKicker) {
      const prefix =
        stopState === "active"
          ? "PARADA ACTIVA"
          : stopState === "completed"
            ? "PARADA COMPLETADA"
            : "PARADA BLOQUEADA";
      const tag = stop.tagline?.trim() || "";
      modalKicker.textContent = tag ? `${prefix} — ${tag}` : prefix;
    }
    if (modalDifficulty) {
      modalDifficulty.textContent = stop.difficulty || "Explorador";
    }
    if (modalMystery) {
      modalMystery.textContent = stop.mystery || `Pista ${selectedStopIndex + 1}`;
    }
    if (modalHero && modalHeroImg) {
      const src = typeof stop.image === "string" ? stop.image.trim() : "";
      if (src) {
        modalHeroImg.src = src;
        modalHeroImg.alt = `Imagen de la parada ${stop.label}`;
        modalHeroImg.hidden = false;
        modalHero.classList.add("p04-stop-modal-hero--has-img");
      } else {
        modalHeroImg.removeAttribute("src");
        modalHeroImg.alt = "";
        modalHeroImg.hidden = true;
        modalHero.classList.remove("p04-stop-modal-hero--has-img");
      }
      modalHero.dataset.stopId = stop.id;
    }
    if (modalStateChip) {
      modalStateChip.textContent =
        stopState === "active"
          ? "DISPONIBLE"
          : stopState === "completed"
            ? "COMPLETADO"
            : "BLOQUEADO";
      modalStateChip.className = `p04-stop-modal-chip p04-stop-modal-chip--${stopState}`;
    }

    if (exploreZoneButton) {
      const isActive = stopState === "active" && selectedStopIndex === activeStopIndex;
      exploreZoneButton.disabled = !isActive;
      exploreZoneButton.textContent = isActive
        ? `Explorar zona (Misión ${Math.min(missionsCompleted + 1, 3)})`
        : "Zona bloqueada";
    }

    container.querySelectorAll(".p04-step-card").forEach((button, index) => {
      button.classList.toggle("is-selected", index === selectedStopIndex);
    });
  };

  const openStopModal = () => {
    stopModal?.classList.remove("is-hidden");
  };

  const closeStopModal = () => {
    stopModal?.classList.add("is-hidden");
  };
  const openInfoModal = () => {
    infoModal?.classList.remove("is-hidden");
  };
  const closeInfoModal = () => {
    infoModal?.classList.add("is-hidden");
  };

  container.querySelectorAll(".p04-step-card, .p04-stop").forEach((button) => {
    button.addEventListener("click", () => {
      const nextIndex = Number(button.getAttribute("data-stop-index"));
      if (Number.isNaN(nextIndex)) {
        return;
      }

      selectedStopIndex = nextIndex;
      setSelectedStopIndex(selectedStopIndex);
      renderSelection();
    });
  });

  container.querySelectorAll(".p04-stop--active").forEach((button) => {
    button.addEventListener("click", () => {
      openStopModal();
    });
  });

  startButton?.addEventListener("click", () => {
    const stopState = getStopState(selectedStopIndex, activeStopIndex);
    if (stopState === "completed") {
      if (
        !window.confirm(
          "¿Repetir la expedición desde el principio?\n\nSe borrará el progreso de las misiones. Conservamos tu nombre; luego acepta la misión otra vez en la introducción.",
        )
      ) {
        return;
      }
      restartExpedition({ clearPlayerName: false });
      window.location.hash = getPostRestartRoute();
      return;
    }
    if (selectedStopIndex !== activeStopIndex || stopState !== "active") {
      return;
    }
    openStopModal();
  });

  exploreZoneButton?.addEventListener("click", () => {
    if (selectedStopIndex !== activeStopIndex) {
      return;
    }
    closeStopModal();
    window.location.hash = getMissionRouteForProgress();
  });

  stopModal?.addEventListener("click", (event) => {
    if (event.target === stopModal) {
      closeStopModal();
    }
  });

  container.querySelector("#p04ModalClose")?.addEventListener("click", closeStopModal);
  container.querySelector("#p04ModalBackToMap")?.addEventListener("click", closeStopModal);
  container.querySelector("#p04ModalMaybeLater")?.addEventListener("click", closeStopModal);

  container.querySelector("#p04HelpButton")?.addEventListener("click", openInfoModal);
  container.querySelector("#p04InfoClose")?.addEventListener("click", closeInfoModal);
  infoModal?.addEventListener("click", (event) => {
    if (event.target === infoModal) closeInfoModal();
  });
  container.querySelector("#p04IntroButton")?.addEventListener("click", () => {
    window.location.hash = "#/p03";
  });

  container.querySelector("#p04FinaleBtn")?.addEventListener("click", () => {
    window.location.hash = "#/p10";
  });

  renderSelection();
}
