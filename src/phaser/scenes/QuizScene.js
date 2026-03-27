import Phaser from "phaser";
import { LAYOUT } from "../layout.js";

const GAME1_ORDER = ["objeto-1-botella", "objeto-2-vasija", "objeto-3-turquesa"];

/**
 * PANTALLA DE QUIZ — propuesta: 3 preguntas, 4 opciones (A–D), 3 intentos, +100 por acierto (máx. 300).
 * Cada respuesta incorrecta resta puntos (no puede bajar de 0).
 */
const PUNTOS_RESTADOS_POR_ERROR = 30;

export default class QuizScene extends Phaser.Scene {
  constructor() {
    super({ key: "QuizScene" });
  }

  init(data) {
    this.questionId = data.questionId;
    this.returnScene = data.returnScene || "Game1Scene";
    this.attemptsRemaining = 3;
    this.lastCorrect = false;
    this.lastExhausted = false;
    this.optionZones = [];
  }

  create() {
    const questions = this.registry.get("questions") || [];
    const q = questions.find((x) => x.id === this.questionId);
    if (!q) {
      this.lastExhausted = true;
      this.add.text(LAYOUT.WIDTH / 2, LAYOUT.HEIGHT / 2, "Pregunta no encontrada", {
        fontSize: "20px",
        color: "#ff6666",
      }).setOrigin(0.5);
      this.input.once("pointerdown", () => this.close());
      return;
    }

    this.q = q;
    this.qIndex = Math.max(0, GAME1_ORDER.indexOf(q.id)) + 1;
    const score = this.registry.get("game1Score") ?? 0;

    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x1a1510, 0.92).setOrigin(0);

    this.add
      .text(LAYOUT.WIDTH / 2, 28, "PANTALLA DE QUIZ", {
        fontSize: "13px",
        color: "#c8921a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.header = this.add
      .text(LAYOUT.WIDTH / 2, 56, `PREGUNTA ${this.qIndex} / 3     ·     Puntos: ${score}`, {
        fontSize: "18px",
        color: "#e4b84a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const disc = q.discoveryText || "";
    this.add
      .text(LAYOUT.WIDTH / 2, 96, disc, {
        fontSize: "14px",
        color: "#d8d4c8",
        align: "center",
        wordWrap: { width: 920 },
      })
      .setOrigin(0.5);

    this.add
      .text(LAYOUT.WIDTH / 2, disc ? 172 : 124, q.question, {
        fontSize: "17px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 900 },
      })
      .setOrigin(0.5);

    const yTop = 280;
    const yBot = 365;
    const xLeft = 380;
    const xRight = 900;
    const layoutPos = [
      { idx: 0, x: xLeft, y: yTop },
      { idx: 2, x: xLeft, y: yBot },
      { idx: 1, x: xRight, y: yTop },
      { idx: 3, x: xRight, y: yBot },
    ];

    this.optionZones = [];
    for (const { idx, x, y } of layoutPos) {
      const letter = String.fromCharCode(65 + idx);
      const opt = q.options[idx];
      this.add.rectangle(x, y, 420, 48, 0x2a3228).setStrokeStyle(1, 0x5a5040);
      this.add
        .text(x, y, `[ ${letter} ]  ${opt}`, {
          fontSize: "15px",
          color: "#f0f0e8",
          wordWrap: { width: 380 },
        })
        .setOrigin(0.5);
      const zone = this.add.zone(x, y, 440, 56).setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => this.pickAnswer(idx));
      this.optionZones.push({ zone });
    }

    this.feedback = this.add.text(LAYOUT.WIDTH / 2, 520, "", {
      fontSize: "16px",
      color: "#aaffaa",
      align: "center",
      wordWrap: { width: 960 },
    }).setOrigin(0.5);

    this.sourceLine = this.add.text(LAYOUT.WIDTH / 2, 600, "", {
      fontSize: "13px",
      color: "#a89870",
      align: "center",
      wordWrap: { width: 900 },
    }).setOrigin(0.5);
  }

  refreshHeaderScore() {
    const score = this.registry.get("game1Score") ?? 0;
    this.header?.setText(`PREGUNTA ${this.qIndex} / 3     ·     Puntos: ${score}`);
  }

  aplicarPenalizacionPorError() {
    const prev = this.registry.get("game1Score") ?? 0;
    const next = Math.max(0, prev - PUNTOS_RESTADOS_POR_ERROR);
    this.registry.set("game1Score", next);
    this.refreshHeaderScore();
    return next;
  }

  setOptionsInteractive(on) {
    this.optionZones.forEach(({ zone }) => {
      if (on) {
        zone.setInteractive({ useHandCursor: true });
      } else {
        zone.disableInteractive();
      }
    });
  }

  pickAnswer(index) {
    if (!this.q) return;
    const q = this.q;
    const ok = index === q.correctIndex;
    this.setOptionsInteractive(false);

    if (ok) {
      this.lastCorrect = true;
      this.lastExhausted = false;
      const prev = this.registry.get("game1Score") ?? 0;
      this.registry.set("game1Score", prev + 100);
      this.refreshHeaderScore();
      this.feedback.setColor("#88ffaa");
      this.feedback.setText("¡Correcto! +100 puntos");
      const src = q.source || "Zarrillo et al., 2018";
      this.sourceLine.setText(`[DATO CIENTÍFICO DESBLOQUEADO – fuente: ${src}]\n\n${q.fact}`);
      this.time.delayedCall(3200, () => this.close());
      return;
    }

    this.attemptsRemaining -= 1;
    this.aplicarPenalizacionPorError();

    if (this.attemptsRemaining > 0) {
      this.lastCorrect = false;
      this.lastExhausted = false;
      this.feedback.setColor("#ffcccc");
      this.feedback.setText(
        `Respuesta incorrecta. −${PUNTOS_RESTADOS_POR_ERROR} puntos. Te quedan ${this.attemptsRemaining} intentos.`,
      );
      this.sourceLine.setText("");
      this.time.delayedCall(900, () => this.setOptionsInteractive(true));
      return;
    }

    this.lastCorrect = false;
    this.lastExhausted = true;
    const letter = String.fromCharCode(65 + q.correctIndex);
    const total = this.registry.get("game1Score") ?? 0;
    this.feedback.setColor("#ffddaa");
    this.feedback.setText(
      `La respuesta correcta era: ${letter}. −${PUNTOS_RESTADOS_POR_ERROR} puntos.\nNo te preocupes, el conocimiento se construye paso a paso.\nTotal actual: ${total} puntos.`,
    );
    this.sourceLine.setText(q.fact);
    this.time.delayedCall(3800, () => this.close());
  }

  close() {
    const g1 = this.scene.get(this.returnScene);
    const payload = {
      correct: this.lastCorrect,
      exhausted: this.lastExhausted,
    };
    this.scene.stop();
    if (this.scene.isPaused(this.returnScene)) {
      this.scene.resume(this.returnScene);
    }
    g1?.events?.emit("quiz-finished", payload);
  }
}
