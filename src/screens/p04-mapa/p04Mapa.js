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
    description: "Inicio de la expedicion en la sierra sur del Ecuador.",
  },
  {
    id: "vilcabamba",
    label: "Vilcabamba",
    country: "Ecuador",
    x: 26,
    y: 23,
    description: "Parada cultural para reunir pistas sobre el cacao ancestral.",
  },
  {
    id: "valladolid",
    label: "Valladolid",
    country: "Ecuador",
    x: 36,
    y: 38,
    description: "Zona intermedia con glifos antiguos y coordenadas ocultas.",
  },
  {
    id: "palanda",
    label: "Palanda",
    country: "Ecuador",
    x: 47,
    y: 52,
    description: "Epicentro arqueologico vinculado al origen del cacao.",
  },
  {
    id: "santa-ana",
    label: "Santa Ana-La Florida",
    country: "Ecuador",
    x: 59,
    y: 64,
    description: "Lugar clave para encontrar el rastro de la reliquia.",
  },
  {
    id: "zumba",
    label: "Zumba",
    country: "Ecuador",
    x: 70,
    y: 75,
    description: "Conexion fronteriza antes del tramo binacional final.",
  },
  {
    id: "san-ignacio",
    label: "San Ignacio",
    country: "Peru",
    x: 81,
    y: 84,
    description: "Parada binacional con pistas de intercambio cultural.",
  },
  {
    id: "jaen",
    label: "Jaen",
    country: "Peru",
    x: 91,
    y: 90,
    description: "Destino final de la ruta. Aqui culmina la expedicion.",
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
          <p class="p04-progress-title">PROGRESO DE EXPEDICION</p>
          <p class="p04-progress-value">${missionsCompleted} de ${TOTAL_MISSIONS} misiones</p>
          <div class="p04-progress-track">
            <span class="p04-progress-fill" style="width: ${progressPercent}%"></span>
          </div>
        </article>

        <button class="p04-help-button" id="p04HelpButton" type="button">?</button>
      </header>

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
        </article>

        <aside class="p04-focus-card">
          <p class="p04-focus-chip" id="p04FocusChip">MISION ACTIVA</p>
          <h2 class="p04-focus-title" id="p04FocusTitle">${activeStop.label}</h2>
          <p class="p04-focus-country" id="p04FocusCountry">${activeStop.country}</p>
          <p class="p04-focus-description" id="p04FocusDescription">${activeStop.description}</p>
          <button class="btn btn--primary p04-start-button" id="p04StartButton" type="button">
            Iniciar mision
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

      <div class="p04-stop-modal is-hidden" id="p04StopModal" role="dialog" aria-label="Panel de parada">
        <article class="p04-stop-modal-card">
          <button class="p04-stop-modal-close" id="p04ModalClose" type="button">✕</button>
          <p class="p04-stop-modal-chip" id="p04ModalStateChip">DISPONIBLE</p>
          <h3 class="p04-stop-modal-title" id="p04ModalTitle">${activeStop.label}</h3>
          <p class="p04-stop-modal-country" id="p04ModalCountry">${activeStop.country}</p>
          <p class="p04-stop-modal-description" id="p04ModalDescription">${activeStop.description}</p>
          <button class="btn btn--primary p04-modal-action" id="p04ExploreZoneButton" type="button">
            Explorar zona
          </button>
          <button class="btn btn--secondary p04-modal-back" id="p04ModalBackToMap" type="button">
            Cerrar
          </button>
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
  const exploreZoneButton = container.querySelector("#p04ExploreZoneButton");

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
          ? "MISION ACTIVA"
          : stopState === "completed"
            ? "PARADA COMPLETADA"
            : "PARADA BLOQUEADA";
    }
    if (startButton) {
      if (stopState === "locked") {
        startButton.disabled = true;
        startButton.textContent = "Mision bloqueada";
      } else if (stopState === "completed") {
        startButton.disabled = false;
        startButton.textContent = "Repetir expedicion";
      } else {
        startButton.disabled = false;
        startButton.textContent = "Iniciar mision";
      }
    }
    if (modalTitle) {
      modalTitle.textContent = stop.label;
    }
    if (modalCountry) {
      modalCountry.textContent = stop.country;
    }
    if (modalDescription) {
      modalDescription.textContent = stop.description;
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
        ? `Explorar zona (Mision ${Math.min(missionsCompleted + 1, 3)})`
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
          "¿Repetir la expedicion desde el principio?\n\nSe borrara el progreso de las misiones. Conservamos tu nombre; luego acepta la mision otra vez en la introduccion.",
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

  container.querySelector("#p04HelpButton")?.addEventListener("click", () => {
    window.location.hash = "#/p01";
  });

  renderSelection();
}
