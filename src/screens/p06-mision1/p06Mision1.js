import { ensureAmbientAudioState } from "../../modules/audioManager.js";
import { completeActiveMission, getGameState } from "../../modules/gameState.js";

const PASS_SCORE = 3;

const QUESTIONS = [
  {
    question: "¿Aproximadamente cuántos años de antigüedad tiene el uso temprano del cacao en la región?",
    options: [
      { label: "A", text: "1.200 años", isCorrect: false },
      { label: "B", text: "5.300 años", isCorrect: true },
      { label: "C", text: "9.000 años", isCorrect: false },
    ],
    fact: "Evidencias arqueológicas vinculan el cacao a más de 5.000 años en esta zona andino-amazónica.",
  },
  {
    question: "¿Qué cultura está asociada al sitio Santa Ana-La Florida?",
    options: [
      { label: "A", text: "Inca", isCorrect: false },
      { label: "B", text: "Mayo-Chinchipe", isCorrect: true },
      { label: "C", text: "Moche", isCorrect: false },
    ],
    fact: "La cultura Mayo-Chinchipe destaca por sus aportes tempranos al cultivo y uso ceremonial del cacao.",
  },
  {
    question: "¿Dónde se localiza el sitio arqueológico Santa Ana-La Florida?",
    options: [
      { label: "A", text: "Palanda, Ecuador", isCorrect: true },
      { label: "B", text: "Quito, Ecuador", isCorrect: false },
      { label: "C", text: "Cusco, Perú", isCorrect: false },
    ],
    fact: "Palanda, en Zamora Chinchipe, es un punto clave para estudiar el origen del cacao domesticado.",
  },
  {
    question: "¿Por qué es importante la Ruta Orígenes del Cacao?",
    options: [
      { label: "A", text: "Solo por su turismo de aventura", isCorrect: false },
      { label: "B", text: "Porque conecta historia, arqueología y biodiversidad del cacao", isCorrect: true },
      { label: "C", text: "Porque es la ruta más corta hacia la costa", isCorrect: false },
    ],
    fact: "La ruta integra patrimonio cultural y natural para comprender el origen y valor del cacao.",
  },
];

function playFeedbackSound(isCorrect) {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = isCorrect ? 840 : 220;

    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(context.destination);

    const now = context.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (isCorrect ? 0.22 : 0.28));

    oscillator.start(now);
    oscillator.stop(now + (isCorrect ? 0.24 : 0.3));
  } catch {
    // Ignore audio failures silently.
  }
}

export function renderP06(container) {
  ensureAmbientAudioState();
  const state = getGameState();
  const missionsCompleted = Math.max(0, Math.min(3, state.missionsCompleted || 0));
  const stopNames = [
    "Loja",
    "Vilcabamba",
    "Valladolid",
    "Palanda",
    "Santa Ana-La Florida",
    "Zumba",
    "San Ignacio",
    "Jaén",
  ];
  const stopName = stopNames[Math.max(0, Math.min(stopNames.length - 1, state.selectedStopIndex || 0))];

  container.innerHTML = `
    <section class="screen screen--p06">
      <article class="p06-card">
        <p class="menu-stage">MISION 1 - QUIZ DE HISTORIA</p>
        <h2 class="p06-title">El secreto del cacao ancestral</h2>
        <p class="p06-subtitle">Parada activa: ${stopName}</p>

        <p class="p06-progress" id="p06Progress"></p>
        <p class="p06-question" id="p06Question"></p>
        <div class="p06-options" id="p06Options"></div>

        <p class="p06-feedback" id="p06Feedback"></p>
        <p class="p06-fact" id="p06Fact"></p>

        <div class="p06-actions">
          <button class="btn btn--primary p06-next-btn" id="p06NextButton" type="button" disabled>
            Siguiente pregunta
          </button>
          <button class="btn btn--secondary p06-back-btn" id="goBackP04" type="button">Volver al mapa</button>
        </div>
      </article>
    </section>
  `;

  const progressElement = container.querySelector("#p06Progress");
  const questionElement = container.querySelector("#p06Question");
  const optionsElement = container.querySelector("#p06Options");
  const feedbackElement = container.querySelector("#p06Feedback");
  const factElement = container.querySelector("#p06Fact");
  const nextButton = container.querySelector("#p06NextButton");
  let currentIndex = 0;
  let answeredCurrent = false;
  let correctCount = 0;

  if (missionsCompleted >= 1) {
    if (progressElement) {
      progressElement.textContent = "Mision 1 ya completada";
    }
    if (questionElement) {
      questionElement.textContent = "Ya superaste este quiz. Puedes volver al mapa para continuar.";
    }
    if (optionsElement) {
      optionsElement.innerHTML = "";
    }
    if (feedbackElement) {
      feedbackElement.textContent = "";
    }
    if (factElement) {
      factElement.textContent = "";
    }
    if (nextButton) {
      nextButton.disabled = false;
      nextButton.textContent = "Ir al mapa";
      nextButton.addEventListener("click", () => {
        window.location.hash = "#/p04";
      });
    }
  } else {
    const renderQuestion = () => {
      const questionData = QUESTIONS[currentIndex];
      answeredCurrent = false;

      if (progressElement) {
        progressElement.textContent = `Pregunta ${currentIndex + 1} de ${QUESTIONS.length}`;
      }
      if (questionElement) {
        questionElement.textContent = questionData.question;
      }
      if (feedbackElement) {
        feedbackElement.textContent = "";
        feedbackElement.className = "p06-feedback";
      }
      if (factElement) {
        factElement.textContent = "";
      }

      if (optionsElement) {
        optionsElement.innerHTML = questionData.options
          .map(
            (option, optionIndex) => `
            <button
              class="p06-option-btn"
              data-option-index="${optionIndex}"
              type="button"
            >
              <span class="p06-option-label">${option.label}</span>
              <span>${option.text}</span>
            </button>
          `,
          )
          .join("");
      }

      if (nextButton) {
        nextButton.disabled = true;
        nextButton.textContent =
          currentIndex === QUESTIONS.length - 1 ? "Finalizar mision" : "Siguiente pregunta";
      }

      container.querySelectorAll(".p06-option-btn").forEach((button) => {
        button.addEventListener("click", () => {
          if (answeredCurrent) {
            return;
          }

          answeredCurrent = true;
          const optionIndex = Number(button.getAttribute("data-option-index"));
          const selectedOption = questionData.options[optionIndex];
          const isCorrect = Boolean(selectedOption?.isCorrect);

          if (isCorrect) {
            correctCount += 1;
          }

          playFeedbackSound(isCorrect);

          container.querySelectorAll(".p06-option-btn").forEach((optionButton, index) => {
            const optionData = questionData.options[index];
            optionButton.disabled = true;

            if (optionData.isCorrect) {
              optionButton.classList.add("is-correct");
            } else if (index === optionIndex) {
              optionButton.classList.add("is-wrong");
            }
          });

          if (feedbackElement) {
            feedbackElement.textContent = isCorrect ? "Respuesta correcta" : "Respuesta incorrecta";
            feedbackElement.classList.add(isCorrect ? "is-correct" : "is-wrong");
          }
          if (factElement) {
            factElement.textContent = questionData.fact;
          }
          if (nextButton) {
            nextButton.disabled = false;
          }
        });
      });
    };

    const finishQuiz = () => {
      const passed = correctCount >= PASS_SCORE;

      if (progressElement) {
        progressElement.textContent = `Resultado final: ${correctCount} de ${QUESTIONS.length}`;
      }
      if (questionElement) {
        questionElement.textContent = passed
          ? "Mision completada. Has desbloqueado la siguiente parada."
          : "No alcanzaste el puntaje minimo. Necesitas al menos 3 respuestas correctas.";
      }
      if (optionsElement) {
        optionsElement.innerHTML = "";
      }
      if (factElement) {
        factElement.textContent = passed
          ? "Excelente trabajo. La siguiente parada ya esta disponible en el mapa."
          : "Revisa las pistas y vuelve a intentarlo para desbloquear la siguiente parada.";
      }
      if (feedbackElement) {
        feedbackElement.textContent = passed ? "Aprobado" : "Debes reintentar";
        feedbackElement.className = `p06-feedback ${passed ? "is-correct" : "is-wrong"}`;
      }

      if (nextButton) {
        nextButton.disabled = false;
        nextButton.textContent = passed ? "Regresar al mapa" : "Reintentar quiz";
        nextButton.onclick = () => {
          if (passed) {
            completeActiveMission();
            window.location.hash = "#/p04";
            return;
          }

          currentIndex = 0;
          correctCount = 0;
          renderQuestion();
        };
      }
    };

    nextButton?.addEventListener("click", () => {
      if (!answeredCurrent) {
        return;
      }

      const isLastQuestion = currentIndex === QUESTIONS.length - 1;
      if (isLastQuestion) {
        finishQuiz();
        return;
      }

      currentIndex += 1;
      renderQuestion();
    });

    renderQuestion();
  }

  container.querySelector("#goBackP04")?.addEventListener("click", () => {
    window.location.hash = "#/p04";
  });
}
