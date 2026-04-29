import { ensureAmbientAudioState } from "../../modules/audioManager.js";
import { getGameState, isMissionUnlocked } from "../../modules/gameState.js";
import { bindRunnerGameOverUI } from "../../modules/runnerGameOverUI.js";
import { startPhaserGame } from "../../phaser/phaserHost.js";

const CABIN_COPY = {
  1: {
    marquee: "CABINA I",
    title: "ORIGEN DEL CACAO",
    sub: "Exploración + quiz · Santa Ana",
  },
  2: {
    marquee: "CABINA II",
    title: "VIAJE DEL CACAO",
    sub: "Auto-runner histórico · 5 zonas",
  },
  3: {
    marquee: "CABINA III",
    title: "CACAO MAZE",
    sub: "Laberinto cultural · guardianes",
  },
};

const MISSION_INTRO_COPY = {
  1: {
    title: "EL ORIGEN DEL CACAO",
    subtitle: "Santa Ana - La Florida, Palanda",
    bullets: [
      "Explora el mapa completo (mundo 3072×3072, rutas del diseño).",
      "Recolecta 4 muestras de cacao y 1 vasija ceremonial en los puntos señalados.",
      "Examina cada pieza con [E] / ACCIÓN; al tener todas, RESULTADO (Enter) cierra la cabina.",
    ],
  },
  2: {
    title: "EL VIAJE DEL CACAO",
    subtitle: "De Palanda hacia el mundo",
    bullets: [
      "Esquiva obstáculos y mantén el ritmo del recorrido.",
      "Recolecta vasijas y piezas especiales para sumar puntos.",
      "En celular, usa el botón SALTAR para avanzar.",
    ],
  },
  3: {
    title: "CACAO MAZE",
    subtitle: "Laberinto cultural",
    bullets: [
      "Recoge granos y piezas sin tocar a los guardianes.",
      "Usa el joystick táctil para moverte por el laberinto.",
      "Activa el poder ancestral y llega a la meta final.",
    ],
  },
};

/**
 * Misiones del mapa (P04): minijuego Phaser con marco tipo máquina arcade retro.
 * Secuencia: misión 1 → 2 → 3 (isMissionUnlocked en gameState).
 */
export function renderMissionArcade(container, missionNumber) {
  ensureAmbientAudioState();
  const state = getGameState();
  const isCoarsePointer = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const useMobileSplit = (missionNumber === 1 || missionNumber === 3) && isCoarsePointer;
  const useMobileMaze = false;
  const useMobileRunner = missionNumber === 2 && isCoarsePointer;
  const ensureTouchpadState = () => {
    if (typeof window === "undefined") return null;
    if (!window.__enigmaTouchpadState) {
      window.__enigmaTouchpadState = {
        up: false,
        down: false,
        left: false,
        right: false,
        action: false,
        actionPulse: false,
      };
    }
    return window.__enigmaTouchpadState;
  };
  const resetTouchpadState = () => {
    const s = ensureTouchpadState();
    if (!s) return;
    s.up = false;
    s.down = false;
    s.left = false;
    s.right = false;
    s.action = false;
    s.actionPulse = false;
  };

  if (!state.missionAccepted) {
    window.location.hash = "#/p03";
    return;
  }
  if (!isMissionUnlocked(missionNumber)) {
    window.location.hash = "#/p04";
    return;
  }

  const copy = CABIN_COPY[missionNumber];
  const intro = MISSION_INTRO_COPY[missionNumber];
  if (!copy) {
    window.location.hash = "#/p04";
    return;
  }

  container.innerHTML = `
    <section class="mission-arcade ${useMobileSplit ? "mission-arcade--mobile-split" : ""} ${useMobileRunner ? "mission-arcade--mobile-runner" : ""} ${useMobileMaze ? "mission-arcade--mobile-maze" : ""}" aria-label="Minijuego arcade misión ${missionNumber}">
      <div class="mission-arcade-vignette" aria-hidden="true"></div>
      <header class="mission-arcade-top">
        <p class="mission-arcade-brand">EL ENIGMA DE SANTA ANA · LA FLORIDA</p>
        <p class="mission-arcade-marquee">${copy.marquee}</p>
        <h1 class="mission-arcade-title">${copy.title}</h1>
        <p class="mission-arcade-sub">${copy.sub}</p>
        <p class="mission-arcade-coin">◆ MISIÓN ${missionNumber} DE 3 — SUPÉRALA PARA DESBLOQUEAR LA SIGUIENTE ◆</p>
      </header>

      <div class="mission-arcade-machine">
        <div class="mission-arcade-bezel" aria-hidden="true">
          <span class="mission-arcade-screw mission-arcade-screw--tl"></span>
          <span class="mission-arcade-screw mission-arcade-screw--tr"></span>
          <span class="mission-arcade-screw mission-arcade-screw--bl"></span>
          <span class="mission-arcade-screw mission-arcade-screw--br"></span>
        </div>
        <div class="mission-arcade-screen-wrap">
          <div class="mission-arcade-crt">
            <div class="mission-arcade-scanlines" aria-hidden="true"></div>
            <div class="mission-arcade-intro" id="missionIntroPanel">
              <div class="mission-arcade-intro-card">
                <p class="mission-arcade-intro-kicker">INTRODUCCIÓN</p>
                <h2 class="mission-arcade-intro-title">${intro?.title || copy.title}</h2>
                <p class="mission-arcade-intro-sub">${intro?.subtitle || copy.sub}</p>
                <div class="mission-arcade-intro-help is-hidden" id="missionIntroHelp">
                  <ul class="mission-arcade-intro-list">
                    ${(intro?.bullets || [])
                      .map((line) => `<li>${line}</li>`)
                      .join("")}
                  </ul>
                </div>
                <div class="mission-arcade-intro-actions">
                  <button type="button" class="mission-arcade-intro-btn mission-arcade-intro-btn--primary" id="missionIntroStart">
                    COMENZAR
                  </button>
                  <button type="button" class="mission-arcade-intro-btn" id="missionIntroInstructions">
                    INSTRUCCIONES
                  </button>
                  <button type="button" class="mission-arcade-intro-btn mission-arcade-intro-btn--secondary" id="missionIntroBack">
                    VOLVER AL MAPA
                  </button>
                </div>
              </div>
            </div>
            <div id="missionPhaserRoot" class="mission-arcade-phaser-host"></div>
            ${
              useMobileSplit
                ? `
            <div class="mission-arcade-touchpad is-hidden" id="missionTouchpad">
              ${
                missionNumber === 3
                  ? `
              <div class="mission-arcade-touch-stick" id="missionTouchStick" aria-label="Joystick táctil">
                <div class="mission-arcade-touch-stick-thumb" id="missionTouchThumb"></div>
              </div>
              `
                  : `
              <div class="mission-arcade-touchpad-grid">
                <button type="button" class="mission-arcade-touch-btn mission-arcade-touch-btn--up" data-touch-key="ArrowUp">↑</button>
                <button type="button" class="mission-arcade-touch-btn mission-arcade-touch-btn--left" data-touch-key="ArrowLeft">←</button>
                <button type="button" class="mission-arcade-touch-btn mission-arcade-touch-btn--right" data-touch-key="ArrowRight">→</button>
                <button type="button" class="mission-arcade-touch-btn mission-arcade-touch-btn--down" data-touch-key="ArrowDown">↓</button>
              </div>
              <button type="button" class="mission-arcade-touch-action" data-touch-key="KeyE">ACCION</button>
              `
              }
            </div>
            `
                : ""
            }
          </div>
        </div>
        <footer class="mission-arcade-panel">
          <span class="mission-arcade-led">1UP</span>
          <span class="mission-arcade-led mission-arcade-led--blink">INSERT COIN</span>
          <button type="button" class="mission-arcade-exit" id="missionArcadeExit">Salir al mapa</button>
        </footer>
      </div>
    </section>
  `;
  const sectionEl = container.querySelector(".mission-arcade");

  const exitToMap = () => {
    resetTouchpadState();
    if (typeof window !== "undefined" && window.__enigmaQuizVisibilityHandler) {
      window.removeEventListener("enigma-quiz-visibility", window.__enigmaQuizVisibilityHandler);
      window.__enigmaQuizVisibilityHandler = null;
    }
    import("../../phaser/phaserHost.js").then(({ destroyPhaserGame }) => {
      destroyPhaserGame();
      window.location.hash = "#/p04";
    });
  };

  container.querySelector("#missionArcadeExit")?.addEventListener("click", exitToMap);
  container.querySelector("#missionIntroBack")?.addEventListener("click", exitToMap);

  const introPanel = container.querySelector("#missionIntroPanel");
  const introHelp = container.querySelector("#missionIntroHelp");
  const introInstructionsBtn = container.querySelector("#missionIntroInstructions");
  const introStartBtn = container.querySelector("#missionIntroStart");
  const touchpad = container.querySelector("#missionTouchpad");

  document.body.classList.add("enigma-lock-scroll");
  document.documentElement.classList.add("enigma-lock-scroll");

  if (missionNumber === 2) {
    bindRunnerGameOverUI(container, {
      sectionSelector: ".mission-arcade",
      wrapSelector: ".mission-arcade-screen-wrap",
      onRetry: () => {
        import("../../phaser/phaserHost.js").then(({ destroyPhaserGame, startPhaserGame }) => {
          destroyPhaserGame();
          const mount = container.querySelector("#missionPhaserRoot");
          if (mount) {
            startPhaserGame(mount, {
              expeditionMission: missionNumber,
              directRunner: true,
            });
          }
        });
      },
      onExitMap: exitToMap,
    });
  }

  const mount = container.querySelector("#missionPhaserRoot");
  const bindVirtualKey = (button, keyName) => {
    if (!button) return;
    const state = ensureTouchpadState();
    if (!state) return;
    const isAction = keyName === "action";
    const setPressed = (pressed) => {
      if (isAction) {
        state.action = pressed;
        if (pressed) state.actionPulse = true;
      } else {
        state[keyName] = pressed;
      }
      button.classList.toggle("is-pressed", pressed);
    };
    const down = (ev) => {
      ev?.preventDefault?.();
      setPressed(true);
    };
    const up = (ev) => {
      ev?.preventDefault?.();
      setPressed(false);
    };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointerleave", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("touchstart", down, { passive: false });
    button.addEventListener("touchend", up, { passive: false });
    button.addEventListener("touchcancel", up, { passive: false });
  };
  const bindVirtualStick = (stick, thumb) => {
    if (!stick || !thumb) return;
    const state = ensureTouchpadState();
    if (!state) return;
    let activePointerId = null;
    const resetStick = () => {
      state.up = false;
      state.down = false;
      state.left = false;
      state.right = false;
      thumb.style.transform = "translate(-50%, -50%)";
      stick.classList.remove("is-active");
    };
    const applyFromPointer = (pointerLike) => {
      const rect = stick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const max = Math.max(16, rect.width * 0.32);
      const dead = Math.max(8, rect.width * 0.1);
      const dx = pointerLike.clientX - cx;
      const dy = pointerLike.clientY - cy;
      const len = Math.hypot(dx, dy);
      const clamped = len > max ? max / len : 1;
      const sx = dx * clamped;
      const sy = dy * clamped;
      thumb.style.transform = `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`;
      if (len < dead) {
        state.up = false;
        state.down = false;
        state.left = false;
        state.right = false;
        return;
      }
      const nx = dx / (len || 1);
      const ny = dy / (len || 1);
      state.up = ny < -0.35;
      state.down = ny > 0.35;
      state.left = nx < -0.35;
      state.right = nx > 0.35;
    };
    stick.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      activePointerId = ev.pointerId;
      stick.setPointerCapture?.(ev.pointerId);
      stick.classList.add("is-active");
      applyFromPointer(ev);
    });
    stick.addEventListener("pointermove", (ev) => {
      if (activePointerId === null || ev.pointerId !== activePointerId) return;
      ev.preventDefault();
      applyFromPointer(ev);
    });
    const stop = (ev) => {
      if (activePointerId === null || ev.pointerId !== activePointerId) return;
      ev.preventDefault();
      activePointerId = null;
      resetStick();
    };
    stick.addEventListener("pointerup", stop);
    stick.addEventListener("pointercancel", stop);
    stick.addEventListener("pointerleave", stop);
    resetStick();
  };

  if (useMobileSplit) {
    resetTouchpadState();
    window.__enigmaQuizVisibilityHandler = (ev) => {
      const visible = ev?.detail?.visible === true;
      touchpad?.classList.toggle("is-hidden", visible);
      sectionEl?.classList.toggle("is-quiz-open", visible);
    };
    window.addEventListener("enigma-quiz-visibility", window.__enigmaQuizVisibilityHandler);
    container.querySelectorAll("[data-touch-key]").forEach((btn) => {
      const code = btn.getAttribute("data-touch-key");
      if (!code) return;
      const keyName =
        code === "ArrowUp"
          ? "up"
          : code === "ArrowDown"
            ? "down"
            : code === "ArrowLeft"
              ? "left"
              : code === "ArrowRight"
                ? "right"
                : "action";
      bindVirtualKey(btn, keyName);
    });
    if (missionNumber === 3) {
      bindVirtualStick(container.querySelector("#missionTouchStick"), container.querySelector("#missionTouchThumb"));
    }
  }

  const startMission = () => {
    if (!mount) return;
    resetTouchpadState();
    sectionEl?.classList.remove("is-quiz-open");
    startPhaserGame(mount, {
      expeditionMission: missionNumber,
      externalTouchpad: useMobileSplit,
    });
    introPanel?.classList.add("is-hidden");
    touchpad?.classList.remove("is-hidden");
  };

  introInstructionsBtn?.addEventListener("click", () => {
    introHelp?.classList.toggle("is-hidden");
  });

  introStartBtn?.addEventListener("click", startMission);
}
