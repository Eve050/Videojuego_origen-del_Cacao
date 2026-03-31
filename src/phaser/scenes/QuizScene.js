import Phaser from "phaser";
import { LAYOUT } from "../layout.js";

const GAME1_ORDER = ["objeto-1-botella", "objeto-2-vasija", "objeto-3-turquesa"];

/**
 * Quiz Game1 — doc §1.5 (puntos por intento) + §2.5 (panel, feedback, intentos).
 */
const PUNTOS_POR_INTENTO = [100, 60, 30];

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
    this.optionRows = [];
    this.attemptDots = [];
    this.panelY = 0;
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

    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x000000, 0.85).setOrigin(0);

    const PCX = LAYOUT.WIDTH / 2;
    const PCY = LAYOUT.HEIGHT / 2 - 8;
    const PW = 1040;
    const PH = 580;
    this.panelY = PCY;

    this.panelFrame = this.add.rectangle(PCX, PCY, PW + 10, PH + 10, 0x000000, 0).setStrokeStyle(5, 0xd4af37);
    this.panelBg = this.add.rectangle(PCX, PCY, PW, PH, 0x121820, 0.98).setStrokeStyle(2, 0x6a5528);

    const PTOP = PCY - PH / 2;
    const objName = q.objectLabel || q.objectKey || "Objeto";

    this.headerLeft = this.add.text(PCX - PW / 2 + 28, PTOP + 22, `PREGUNTA ${this.qIndex} / 3`, {
      fontSize: "17px",
      color: "#e8c058",
      fontStyle: "bold",
    });

    this.headerRight = this.add.text(PCX + PW / 2 - 28, PTOP + 22, `PUNTOS: ${score}`, {
      fontSize: "17px",
      color: "#e8c058",
      fontStyle: "bold",
    }).setOrigin(1, 0);

    this.add
      .text(PCX, PTOP + 52, `Has encontrado: ${objName.toUpperCase()}`, {
        fontSize: "15px",
        color: "#f0e8d8",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);

    const disc = q.discoveryText || "";
    this.add
      .text(PCX, PTOP + 78, disc, {
        fontSize: "13px",
        color: "#c8c4b8",
        align: "center",
        wordWrap: { width: PW - 56 },
      })
      .setOrigin(0.5);

    this.add.text(PCX, PTOP + 142, q.question, {
      fontSize: "16px",
      color: "#ffffff",
      align: "center",
      fontStyle: "bold",
      wordWrap: { width: PW - 80 },
    }).setOrigin(0.5);

    const yTop = PTOP + 210;
    const yBot = PTOP + 278;
    const xLeft = PCX - 210;
    const xRight = PCX + 210;
    const layoutPos = [
      { idx: 0, x: xLeft, y: yTop },
      { idx: 2, x: xLeft, y: yBot },
      { idx: 1, x: xRight, y: yTop },
      { idx: 3, x: xRight, y: yBot },
    ];

    this.optionRows = [];
    for (const { idx, x, y } of layoutPos) {
      const letter = String.fromCharCode(65 + idx);
      const opt = q.options[idx];
      const bg = this.add.rectangle(x, y, 400, 46, 0x243038, 1).setStrokeStyle(1, 0x5a6068);
      const txt = this.add
        .text(x, y, `[ ${letter} ]  ${opt}`, {
          fontSize: "14px",
          color: "#f0f0e8",
          wordWrap: { width: 360 },
        })
        .setOrigin(0.5);
      const zone = this.add.zone(x, y, 410, 52).setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => this.pickAnswer(idx));
      this.optionRows.push({ zone, bg, txt, idx });
    }

    const dotY = PTOP + 350;
    for (let i = 0; i < 3; i += 1) {
      const dot = this.add.circle(PCX - 36 + i * 36, dotY, 10, 0xffb020, 1).setStrokeStyle(2, 0xfff0c0);
      this.attemptDots.push(dot);
    }
    this.refreshAttemptDots();

    this.add.text(PCX, PTOP + 378, "INTENTOS RESTANTES", {
      fontSize: "10px",
      color: "#7a7088",
    }).setOrigin(0.5);

    this.add.text(PCX, PTOP + PH - 38, "Al responder correctamente: DATO CIENTÍFICO DESBLOQUEADO", {
      fontSize: "11px",
      color: "#b8943a",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.feedback = this.add.text(PCX, PTOP + 410, "", {
      fontSize: "15px",
      color: "#d0d8e0",
      align: "center",
      wordWrap: { width: PW - 40 },
    }).setOrigin(0.5);

    this.sourceLine = this.add.text(PCX, PTOP + 478, "", {
      fontSize: "13px",
      color: "#c4b898",
      align: "center",
      wordWrap: { width: PW - 48 },
    }).setOrigin(0.5);
  }

  refreshAttemptDots() {
    const left = this.attemptsRemaining;
    this.attemptDots.forEach((dot, i) => {
      const active = i < left;
      dot.setFillStyle(active ? 0xffb020 : 0x2a2820, active ? 1 : 0.4);
      dot.setStrokeStyle(2, active ? 0xfff0c0 : 0x555055, active ? 1 : 0.35);
    });
  }

  refreshHeaderScore() {
    const score = this.registry.get("game1Score") ?? 0;
    this.headerRight?.setText(`PUNTOS: ${score}`);
  }

  setOptionsInteractive(on) {
    this.optionRows.forEach(({ zone }) => {
      if (on) zone.setInteractive({ useHandCursor: true });
      else zone.disableInteractive();
    });
  }

  resetOptionStyles() {
    this.optionRows.forEach(({ bg, txt }) => {
      bg.setFillStyle(0x243038, 1);
      bg.setStrokeStyle(1, 0x5a6068);
      txt.setColor("#f0f0e8");
    });
  }

  shakePanel() {
    this.cameras.main.shake(220, 0.004);
  }

  pickAnswer(index) {
    if (!this.q) return;
    const q = this.q;
    const ok = index === q.correctIndex;
    this.setOptionsInteractive(false);

    if (ok) {
      this.lastCorrect = true;
      this.lastExhausted = false;
      const tryNumber = 4 - this.attemptsRemaining;
      const add = PUNTOS_POR_INTENTO[tryNumber - 1] ?? 30;
      const prev = this.registry.get("game1Score") ?? 0;
      this.registry.set("game1Score", prev + add);
      this.refreshHeaderScore();
      const row = this.optionRows.find((r) => r.idx === index);
      if (row) {
        row.bg.setFillStyle(0x165c32, 1);
        row.bg.setStrokeStyle(3, 0x5ef0a8);
        row.txt.setColor("#e8fff0");
        row.txt.setText(`${row.txt.text}   OK`);
      }
      this.feedback.setColor("#c8dcc8");
      this.feedback.setText(`¡Correcto! +${add} puntos`);
      const fx = this.add
        .text(row?.bg.x ?? LAYOUT.WIDTH / 2, (row?.bg.y ?? this.panelY) - 36, `+${add}`, {
          fontSize: "28px",
          color: "#ffdd66",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: fx,
        y: fx.y - 56,
        alpha: 0,
        duration: 1100,
        onComplete: () => fx.destroy(),
      });
      const src = q.source || "Zarrillo et al., 2018";
      this.time.delayedCall(1500, () => {
        this.sourceLine.setText(`DATO DESBLOQUEADO — ${src}\n\n${q.fact}`);
      });
      this.time.delayedCall(4200, () => this.close());
      return;
    }

    const wrongRow = this.optionRows.find((r) => r.idx === index);
    if (wrongRow) {
      wrongRow.bg.setFillStyle(0x5c2028, 1);
      wrongRow.bg.setStrokeStyle(2, 0xc06070);
      wrongRow.txt.setColor("#ffcccc");
    }
    this.shakePanel();

    this.attemptsRemaining -= 1;
    this.refreshAttemptDots();

    if (this.attemptsRemaining > 0) {
      this.lastCorrect = false;
      this.lastExhausted = false;
      this.feedback.setColor("#ffaaaa");
      this.feedback.setText(`Respuesta incorrecta. Te quedan ${this.attemptsRemaining} intentos.`);
      this.sourceLine.setText("");
      this.time.delayedCall(950, () => {
        this.resetOptionStyles();
        this.setOptionsInteractive(true);
      });
      return;
    }

    this.lastCorrect = false;
    this.lastExhausted = true;
    const letter = String.fromCharCode(65 + q.correctIndex);
    const corr = this.optionRows.find((r) => r.idx === q.correctIndex);
    if (corr) {
      corr.bg.setFillStyle(0x165c32, 1);
      corr.bg.setStrokeStyle(3, 0x5ef0a8);
      corr.txt.setColor("#e8fff0");
      corr.txt.setText(`${corr.txt.text}   CORRECTA`);
    }
    this.feedback.setColor("#ffddaa");
    this.feedback.setText(
      `La respuesta correcta era: ${letter}. No te preocupes, el conocimiento se construye paso a paso.`,
    );
    this.sourceLine.setText(`DATO DESBLOQUEADO\n\n${q.fact}`);
    this.time.delayedCall(4200, () => this.close());
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
