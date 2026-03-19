import { ensureAmbientAudioState } from "../../modules/audioManager.js";
import {
  completeMissionByNumber,
  getGameState,
  isMissionUnlocked,
} from "../../modules/gameState.js";

const CORRECT_SEQUENCE = [
  "cosecha",
  "fermentacion",
  "secado",
  "tostado",
  "transformacion",
];

const STAGE_DATA = {
  cosecha: {
    title: "Cosecha",
    description: "Seleccion de frutos maduros de cacao.",
    icon: "🌱",
    tagline: "Primer encuentro con el fruto",
  },
  fermentacion: {
    title: "Fermentacion",
    description: "Desarrollo de precursores de sabor en cajones de madera.",
    icon: "⚗️",
    tagline: "La transformacion quimica silenciosa",
  },
  secado: {
    title: "Secado",
    description: "Reduccion de humedad bajo sol controlado.",
    icon: "☀️",
    tagline: "El sol consolida el alma del grano",
  },
  tostado: {
    title: "Tostado",
    description: "Activacion del aroma y notas del cacao.",
    icon: "🔥",
    tagline: "Fuego que libera la esencia oculta",
  },
  transformacion: {
    title: "Transformacion",
    description: "Molienda y refinado para crear chocolate puro.",
    icon: "✨",
    tagline: "El resultado final de la alquimia",
  },
};

function shuffledOrder() {
  const arr = [...CORRECT_SEQUENCE];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (arr.every((id, i) => id === CORRECT_SEQUENCE[i])) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

/** Pistas que orientan sin revelar la secuencia completa (progresivas en cada fallo). */
const FAILURE_HINTS = [
  "Pista: el ritual empieza donde nace el fruto, no donde se muele el grano.",
  "Pista: despues de recoger, el interior del cacao necesita cambiar en silencio (calor y humedad) antes de ir al sol.",
  "Pista: no tiene sentido tostar o transformar algo que aun no paso por el secado.",
  "Pista: la molienda y el chocolate vienen al final: es lo ultimo que le ocurre al cacao.",
  "Pista: si dos pasos consecutivos te suenan “al reves”, prueba intercambiarlos: fermentacion y secado suelen confundirse.",
];

function playShortTone(isCorrect) {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = isCorrect ? "triangle" : "sawtooth";
    osc.frequency.value = isCorrect ? 660 : 180;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(context.destination);
    const now = context.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.start(now);
    osc.stop(now + 0.24);
  } catch {
    // ignore audio failures
  }
}

export function renderP07(container) {
  ensureAmbientAudioState();
  const state = getGameState();

  if (!state.missionAccepted) {
    window.location.hash = "#/p03";
    return;
  }
  if (!isMissionUnlocked(2)) {
    window.location.hash = "#/p04";
    return;
  }

  container.innerHTML = `
    <section class="screen screen--p07">
      <article class="p07-shell">
        <header class="p07-hero">
          <span class="p07-badge">Mision 2</span>
          <h1 class="p07-title">El ritual de la alquimia del cacao</h1>
          <p class="p07-lead">
            Arrastra las tarjetas hasta ordenar el camino del cacao. Si fallas, recibiras una pista nueva cada vez.
          </p>
        </header>

        <div class="p07-grid">
          <aside class="p07-aside">
            <div class="p07-tip-card">
              <span class="p07-tip-icon" aria-hidden="true">💡</span>
              <h3 class="p07-tip-title">Sabiduria de campo</h3>
              <p class="p07-tip-text">
                La fermentacion es el paso que mas influye en el sabor final del chocolate. Sin ella, el cacao seria amargo y astringente.
              </p>
            </div>
            <div class="p07-progress-card">
              <p class="p07-progress-label">Tu progreso</p>
              <div class="p07-progress-bar">
                <span class="p07-progress-bar-fill" id="p07ProgressFill"></span>
              </div>
              <p class="p07-progress-meta" id="p07ProgressMeta">Ordena 5 etapas</p>
            </div>
          </aside>

          <div class="p07-main">
            <div class="p07-list-header">
              <span class="p07-list-title">Etapas del cacao</span>
              <span class="p07-list-hint">Arrastra para reordenar</span>
            </div>
            <div class="p07-list" id="p07List" role="list" aria-label="Etapas del cacao, reordena arrastrando"></div>

            <div class="p07-feedback-wrap">
              <p class="p07-feedback" id="p07Feedback"></p>
              <p class="p07-fact" id="p07Fact"></p>
            </div>

            <div class="p07-actions">
              <button class="p07-confirm-button" id="p07ConfirmButton" type="button">
                Confirmar orden
              </button>
              <button class="p07-back-button" id="p07BackMap" type="button">
                Volver al mapa
              </button>
            </div>
          </div>
        </div>
      </article>
    </section>
  `;

  const listElement = container.querySelector("#p07List");
  const feedbackElement = container.querySelector("#p07Feedback");
  const factElement = container.querySelector("#p07Fact");
  const confirmButton = container.querySelector("#p07ConfirmButton");
  const progressFill = container.querySelector("#p07ProgressFill");
  const progressMeta = container.querySelector("#p07ProgressMeta");
  let order = shuffledOrder();
  let dragStartIndex = -1;
  let wrongAttemptIndex = 0;

  const moveItem = (fromIndex, toIndex) => {
      if (toIndex < 0 || toIndex >= order.length || fromIndex === toIndex) {
        return;
      }
      const newOrder = [...order];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      order = newOrder;
      renderList();
    };

    const updateProgressUi = () => {
      const pct = Math.round((order.filter((id, i) => id === CORRECT_SEQUENCE[i]).length / CORRECT_SEQUENCE.length) * 100);
      if (progressFill) {
        progressFill.style.width = `${pct}%`;
      }
      if (progressMeta) {
        progressMeta.textContent = `${pct}% alineado con el orden ideal`;
      }
    };

    const renderList = () => {
      if (!listElement) {
        return;
      }

      listElement.innerHTML = order
        .map((stepId, index) => {
          const step = STAGE_DATA[stepId];
          return `
            <article class="p07-step" draggable="true" data-step-index="${index}" role="listitem" aria-grabbed="false">
              <span class="p07-step-drag" aria-hidden="true" title="Arrastra para mover esta etapa">⋮⋮</span>
              <span class="p07-step-icon" aria-hidden="true">${step.icon}</span>
              <div class="p07-step-main">
                <p class="p07-step-title">${step.title}</p>
                <p class="p07-step-tagline">${step.tagline}</p>
                <p class="p07-step-desc">${step.description}</p>
              </div>
            </article>
          `;
        })
        .join("");

      updateProgressUi();

      listElement.querySelectorAll(".p07-step").forEach((card) => {
        card.addEventListener("dragstart", (event) => {
          dragStartIndex = Number(card.getAttribute("data-step-index"));
          card.classList.add("is-dragging");
          card.setAttribute("aria-grabbed", "true");
          try {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(dragStartIndex));
          } catch {
            /* ignore */
          }
        });
        card.addEventListener("dragend", () => {
          card.classList.remove("is-dragging");
          card.setAttribute("aria-grabbed", "false");
          listElement.querySelectorAll(".p07-step").forEach((el) => el.classList.remove("is-drag-over"));
        });
        card.addEventListener("dragover", (event) => {
          event.preventDefault();
          try {
            event.dataTransfer.dropEffect = "move";
          } catch {
            /* ignore */
          }
          card.classList.add("is-drag-over");
        });
        card.addEventListener("dragleave", () => {
          card.classList.remove("is-drag-over");
        });
        card.addEventListener("drop", (event) => {
          event.preventDefault();
          card.classList.remove("is-drag-over");
          const dropIndex = Number(card.getAttribute("data-step-index"));
          if (Number.isNaN(dragStartIndex) || Number.isNaN(dropIndex)) {
            return;
          }
          moveItem(dragStartIndex, dropIndex);
        });
      });
    };

    const showNextFailureHint = () => {
      if (!factElement) {
        return;
      }
      const idx = wrongAttemptIndex % FAILURE_HINTS.length;
      factElement.textContent = FAILURE_HINTS[idx];
      wrongAttemptIndex += 1;
    };

    confirmButton?.addEventListener("click", () => {
      const isCorrect =
        order.length === CORRECT_SEQUENCE.length &&
        order.every((stepId, index) => stepId === CORRECT_SEQUENCE[index]);

      playShortTone(isCorrect);

      if (!feedbackElement) {
        return;
      }

      if (isCorrect) {
        const prevDone = getGameState().missionsCompleted || 0;
        completeMissionByNumber(2);
        const advanced = (getGameState().missionsCompleted || 0) > prevDone;
        feedbackElement.textContent = advanced
          ? "Orden correcto. Mision completada."
          : "Orden correcto. Buen repaso.";
        feedbackElement.className = "p07-feedback is-correct";
        if (factElement) {
          factElement.textContent = advanced
            ? "Dato educativo: la fermentacion y el secado son claves para formar los aromas del cacao."
            : "Puedes volver al mapa o practicar otra mision cuando quieras.";
        }
        listElement?.classList.add("is-success");
        confirmButton.textContent = "Regresar al mapa";
        confirmButton.onclick = () => {
          window.location.hash = "#/p04";
        };
        return;
      }

      feedbackElement.textContent = "El orden aun no es correcto. Intentalo de nuevo.";
      feedbackElement.className = "p07-feedback is-wrong";
      showNextFailureHint();
    });

  renderList();

  container.querySelector("#p07BackMap")?.addEventListener("click", () => {
    window.location.hash = "#/p04";
  });
}
