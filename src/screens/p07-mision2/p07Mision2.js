import { ensureAmbientAudioState } from "../../modules/audioManager.js";
import { completeActiveMission, getGameState } from "../../modules/gameState.js";

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
  },
  fermentacion: {
    title: "Fermentacion",
    description: "Desarrollo de precursores de sabor en cajones de madera.",
  },
  secado: {
    title: "Secado",
    description: "Reduccion de humedad bajo sol controlado.",
  },
  tostado: {
    title: "Tostado",
    description: "Activacion del aroma y notas del cacao.",
  },
  transformacion: {
    title: "Transformacion",
    description: "Molienda y refinado para crear chocolate puro.",
  },
};

function shuffledOrder() {
  const arr = [...CORRECT_SEQUENCE];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
  const missionsCompleted = Math.max(0, Math.min(3, state.missionsCompleted || 0));

  container.innerHTML = `
    <section class="screen screen--p07">
      <article class="p07-card">
        <p class="menu-stage">MISION 2 - ORDENAR PROCESO</p>
        <h2 class="p07-title">El ritual de la alquimia del cacao</h2>
        <p class="p07-subtitle">
          Ordena correctamente las etapas del cacao desde la cosecha hasta la transformacion.
        </p>

        <div class="p07-list" id="p07List"></div>

        <p class="p07-feedback" id="p07Feedback"></p>
        <p class="p07-fact" id="p07Fact"></p>

        <div class="p07-actions">
          <button class="btn btn--primary p07-confirm-button" id="p07ConfirmButton" type="button">
            Confirmar orden
          </button>
          <button class="btn btn--secondary p07-back-button" id="p07BackMap" type="button">
            Volver al mapa
          </button>
        </div>
      </article>
    </section>
  `;

  const listElement = container.querySelector("#p07List");
  const feedbackElement = container.querySelector("#p07Feedback");
  const factElement = container.querySelector("#p07Fact");
  const confirmButton = container.querySelector("#p07ConfirmButton");
  let order = shuffledOrder();
  let dragStartIndex = -1;

  if (missionsCompleted >= 2) {
    if (feedbackElement) {
      feedbackElement.textContent = "Mision 2 ya completada.";
      feedbackElement.className = "p07-feedback is-correct";
    }
    if (factElement) {
      factElement.textContent = "Puedes volver al mapa para continuar con la siguiente mision.";
    }
    if (confirmButton) {
      confirmButton.textContent = "Ir al mapa";
      confirmButton.addEventListener("click", () => {
        window.location.hash = "#/p04";
      });
    }
  } else {
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

    const renderList = () => {
      if (!listElement) {
        return;
      }

      listElement.innerHTML = order
        .map((stepId, index) => {
          const step = STAGE_DATA[stepId];
          return `
            <article class="p07-step" draggable="true" data-step-index="${index}">
              <div class="p07-step-main">
                <p class="p07-step-title">${index + 1}. ${step.title}</p>
                <p class="p07-step-desc">${step.description}</p>
              </div>
              <div class="p07-step-controls">
                <button class="p07-move-btn" data-move="up" data-step-index="${index}" type="button">↑</button>
                <button class="p07-move-btn" data-move="down" data-step-index="${index}" type="button">↓</button>
              </div>
            </article>
          `;
        })
        .join("");

      listElement.querySelectorAll(".p07-step").forEach((card) => {
        card.addEventListener("dragstart", () => {
          dragStartIndex = Number(card.getAttribute("data-step-index"));
        });
        card.addEventListener("dragover", (event) => {
          event.preventDefault();
        });
        card.addEventListener("drop", () => {
          const dropIndex = Number(card.getAttribute("data-step-index"));
          if (Number.isNaN(dragStartIndex) || Number.isNaN(dropIndex)) {
            return;
          }
          moveItem(dragStartIndex, dropIndex);
        });
      });

      listElement.querySelectorAll(".p07-move-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-step-index"));
          const direction = btn.getAttribute("data-move");
          if (direction === "up") {
            moveItem(idx, idx - 1);
          } else {
            moveItem(idx, idx + 1);
          }
        });
      });
    };

    const showCorrectOrderHint = () => {
      if (factElement) {
        factElement.textContent =
          "Orden correcto: Cosecha → Fermentacion → Secado → Tostado → Transformacion.";
      }
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
        feedbackElement.textContent = "Orden correcto. Mision completada.";
        feedbackElement.className = "p07-feedback is-correct";
        if (factElement) {
          factElement.textContent =
            "Dato educativo: la fermentacion y el secado son claves para formar los aromas del cacao.";
        }
        listElement?.classList.add("is-success");
        completeActiveMission();
        confirmButton.textContent = "Regresar al mapa";
        confirmButton.onclick = () => {
          window.location.hash = "#/p04";
        };
        return;
      }

      feedbackElement.textContent = "El orden aun no es correcto. Intentalo de nuevo.";
      feedbackElement.className = "p07-feedback is-wrong";
      showCorrectOrderHint();
    });

    renderList();
  }

  container.querySelector("#p07BackMap")?.addEventListener("click", () => {
    window.location.hash = "#/p04";
  });
}
