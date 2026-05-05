import Phaser from "phaser";
import { LAYOUT } from "../layout.js";
import { SFX_VOL } from "../../modules/sfxVolumes.js";
import { createGameMissionHud } from "../ui/gameMissionHud.js";
import { QUIZ_MISSION_TITLE, getQuizMissionBody } from "../data/gameMissionCopy.js";

const GAME1_ORDER = ["objeto-1-botella", "objeto-2-vasija", "objeto-3-turquesa"];

/**
 * Quiz Game1 — doc §1.5 (puntos por intento) + §2.5 (panel, feedback, intentos).
 */
const PUNTOS_POR_INTENTO = [100, 60, 30];

export default class QuizScene extends Phaser.Scene {
  constructor() {
    super({ key: "QuizScene" });
  }

  ensureSfxUnlocked() {
    const ctx = this.sound?.context;
    if (!ctx) return;
    if (ctx.state === "suspended" && typeof ctx.resume === "function") {
      ctx.resume().catch(() => {});
    }
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
    this.mobileQuizMode = false;
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

    const mobileQuizMode = this.registry.get("externalTouchpad") === true;
    this.mobileQuizMode = mobileQuizMode;
    const PCX = LAYOUT.WIDTH / 2;
    const PCY = LAYOUT.HEIGHT / 2 - 8;
    const PW = mobileQuizMode ? 500 : 1040;
    const PH = mobileQuizMode ? 742 : 580;
    this.panelY = PCY;
    this.quizPCX = PCX;
    this.quizPW = PW;

    this.panelFrame = this.add.rectangle(PCX, PCY, PW + 10, PH + 10, 0x000000, 0).setStrokeStyle(5, 0xd4af37);
    this.panelBg = this.add.rectangle(PCX, PCY, PW, PH, 0x171109, 0.98).setStrokeStyle(2, 0x6a5528);

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

    const foundLine = this.add
      .text(PCX, mobileQuizMode ? PTOP + 46 : PTOP + 52, `Has encontrado: ${objName.toUpperCase()}`, {
        fontSize: mobileQuizMode ? "15px" : "15px",
        color: "#f0e8d8",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);

    const disc = q.discoveryText || "";
    const discoveryLine = this.add
      .text(PCX, mobileQuizMode ? PTOP + 74 : PTOP + 78, disc, {
        fontSize: mobileQuizMode ? "13px" : "13px",
        color: "#c8c4b8",
        align: "center",
        wordWrap: { width: mobileQuizMode ? PW - 70 : PW - 56 },
      })
      .setOrigin(0.5);
    if (mobileQuizMode) {
      foundLine.setVisible(false);
      discoveryLine.setVisible(false);
    }

    const questionY = mobileQuizMode ? PTOP + 146 : PTOP + 142;
    this.add.text(PCX, questionY, q.question, {
      fontSize: mobileQuizMode ? "23px" : "16px",
      color: "#ffffff",
      align: "center",
      fontStyle: "bold",
      wordWrap: { width: mobileQuizMode ? PW - 88 : PW - 80 },
    }).setOrigin(0.5);

    const layoutPos = mobileQuizMode
      ? [
          { idx: 0, x: PCX, y: PTOP + 264 },
          { idx: 1, x: PCX, y: PTOP + 354 },
          { idx: 2, x: PCX, y: PTOP + 444 },
          { idx: 3, x: PCX, y: PTOP + 534 },
        ]
      : [
          { idx: 0, x: PCX - 210, y: PTOP + 210 },
          { idx: 2, x: PCX - 210, y: PTOP + 278 },
          { idx: 1, x: PCX + 210, y: PTOP + 210 },
          { idx: 3, x: PCX + 210, y: PTOP + 278 },
        ];

    this.optionRows = [];
    for (const { idx, x, y } of layoutPos) {
      const letter = String.fromCharCode(65 + idx);
      const opt = q.options[idx];
      const optWidth = mobileQuizMode ? PW - 50 : 400;
      const optHeight = mobileQuizMode ? 76 : 46;
      const hitWidth = mobileQuizMode ? PW - 36 : 410;
      const hitHeight = mobileQuizMode ? 80 : 52;
      const bg = this.add.rectangle(x, y, optWidth, optHeight, 0x2a1d12, 1).setStrokeStyle(1, 0x7a5f3b);
      const txt = this.add
        .text(x, y, `[ ${letter} ]  ${opt}`, {
          fontSize: mobileQuizMode ? "16px" : "14px",
          color: "#f0f0e8",
          wordWrap: { width: mobileQuizMode ? PW - 88 : 360 },
        })
        .setOrigin(0.5);
      const zone = this.add.zone(x, y, hitWidth, hitHeight).setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => this.pickAnswer(idx));
      this.optionRows.push({ zone, bg, txt, idx });
    }

    const dotY = mobileQuizMode ? PTOP + 622 : PTOP + 350;
    for (let i = 0; i < 3; i += 1) {
      const gap = mobileQuizMode ? 44 : 36;
      const r = mobileQuizMode ? 12 : 10;
      const dot = this.add.circle(PCX - gap + i * gap, dotY, r, 0xffb020, 1).setStrokeStyle(2, 0xfff0c0);
      this.attemptDots.push(dot);
    }
    this.refreshAttemptDots();

    this.attemptLabel = this.add.text(PCX, mobileQuizMode ? PTOP + 652 : PTOP + 378, "INTENTOS RESTANTES", {
      fontSize: mobileQuizMode ? "13px" : "10px",
      color: "#7a7088",
    }).setOrigin(0.5);

    this.infoBg = this.add
      .rectangle(
        PCX,
        mobileQuizMode ? PTOP + 664 : PTOP + 492,
        PW - (mobileQuizMode ? 38 : 80),
        mobileQuizMode ? 112 : 144,
        0x24180f,
        0.95,
      )
      .setStrokeStyle(2, 0xc8a85a, 0.9)
      .setDepth(1)
      .setVisible(false);

    this.feedbackYInside = mobileQuizMode ? PTOP + 646 : PTOP + 418;
    this.feedbackYTop = mobileQuizMode ? PTOP + 586 : PTOP + 392;
    this.feedback = this.add.text(PCX, this.feedbackYInside, "", {
      fontSize: "20px",
      color: "#fff2d2",
      align: "center",
      fontFamily: "Exo 2, sans-serif",
      fontStyle: "bold",
      wordWrap: { width: mobileQuizMode ? PW - 64 : PW - 120 },
    }).setOrigin(0.5).setDepth(3).setShadow(0, 2, "#000000", 4, true, true).setVisible(false);

    this.factLine = this.add.text(PCX, mobileQuizMode ? PTOP + 652 : PTOP + 484, "", {
      fontSize: mobileQuizMode ? "13px" : "16px",
      color: "#f8ead2",
      align: "center",
      fontFamily: "Nunito, sans-serif",
      fontStyle: "bold",
      lineSpacing: mobileQuizMode ? 4 : 4,
      wordWrap: { width: mobileQuizMode ? PW - 88 : PW - 200 },
    }).setOrigin(0.5).setDepth(3).setShadow(0, 2, "#000000", 5, true, true).setVisible(false);

    this.sourceLine = this.add.text(PCX, mobileQuizMode ? PTOP + 672 : PTOP + 532, "", {
      fontSize: mobileQuizMode ? "10px" : "13px",
      color: "#f8ead2",
      align: "center",
      fontFamily: "Nunito, sans-serif",
      fontStyle: "bold",
      lineSpacing: mobileQuizMode ? 3 : 4,
      wordWrap: { width: mobileQuizMode ? PW - 146 : PW - 260 },
    }).setOrigin(0.5).setDepth(3).setShadow(0, 2, "#000000", 5, true, true).setVisible(false);

    this.unlockHint = this.add.text(PCX, PTOP + PH - 22, "Al responder correctamente: DATO CIENTÍFICO DESBLOQUEADO", {
      fontSize: "14px",
      color: "#ffd46b",
      fontStyle: "bold",
      fontFamily: "Exo 2, sans-serif",
    }).setOrigin(0.5).setDepth(2).setShadow(0, 1, "#000000", 4, true, true);

    this.missionHud = createGameMissionHud(this, {
      title: QUIZ_MISSION_TITLE,
      body: () => getQuizMissionBody(this),
      x: mobileQuizMode ? PCX + PW / 2 - 26 : PCX - PW / 2 + 26,
      y: mobileQuizMode ? PTOP + 26 : PTOP + 48,
      originX: mobileQuizMode ? 1 : 0,
      originY: 0,
      buttonDepth: 25,
      overlayDepth: 220,
      panelMaxW: mobileQuizMode ? Math.min(PW - 24, 440) : 520,
    });
  }

  /**
   * Coloca el dato y "Fuente" bajo el feedback y el marco dorado SIEMPRE debajo del texto "¡Correcto!",
   * sin que el borde atraviese el mensaje (antes el min-height inflaba el rectángulo hacia arriba).
   */
  layoutFactSourceStack() {
    const fb = this.feedback;
    const fact = this.factLine;
    const srcLine = this.sourceLine;
    const bg = this.infoBg;
    if (!fb?.visible || !fact?.visible || !bg?.visible) return;

    const cx = this.quizPCX;
    const mobile = this.mobileQuizMode;

    /** Margen entre el borde inferior del mensaje y el borde superior del cuadro dorado */
    const gapBelowFeedback = mobile ? 16 : 18;
    const padMid = mobile ? 12 : 10;
    const padBot = mobile ? 14 : 16;
    /** Aire dentro del cuadro, sobre el párrafo del dato */
    const innerTop = mobile ? 12 : 14;

    const fbHalf = ((fb.height ?? fb.displayHeight) || 26) * 0.5;
    const feedbackBottom = fb.y + fbHalf;
    const bgTop = feedbackBottom + gapBelowFeedback;

    const fh = (fact.height ?? fact.displayHeight) || 28;
    fact.setPosition(cx, bgTop + innerTop + fh * 0.5);

    let contentBottom = fact.y + fh * 0.5;

    const srcText = (srcLine.text ?? "").trim();
    if (srcLine.visible && srcText.length > 0) {
      const sh = (srcLine.height ?? srcLine.displayHeight) || 20;
      srcLine.setPosition(cx, contentBottom + padMid + sh * 0.5);
      contentBottom = srcLine.y + sh * 0.5;
    }

    const minH = mobile ? 96 : 124;
    let bgBottom = contentBottom + padBot;
    if (bgBottom - bgTop < minH) {
      bgBottom = bgTop + minH;
    }

    let bgH = bgBottom - bgTop;
    const maxH = mobile ? 260 : 240;
    bgH = Math.min(bgH, maxH);
    const bgMid = bgTop + bgH * 0.5;
    const bgW = mobile ? this.quizPW - 38 : this.quizPW - 80;

    bg.setPosition(cx, bgMid);
    bg.setSize(bgW, bgH);
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
      bg.setFillStyle(0x2a1d12, 1);
      bg.setStrokeStyle(1, 0x7a5f3b);
      txt.setColor("#f0f0e8");
    });
  }

  shakePanel() {
    this.cameras.main.shake(220, 0.004);
  }

  pickAnswer(index) {
    if (!this.q) return;
    this.ensureSfxUnlocked();
    const q = this.q;
    const ok = index === q.correctIndex;
    this.setOptionsInteractive(false);

    if (ok) {
      if (this.cache.audio.exists("sfx_ok")) {
        this.sound.play("sfx_ok", { volume: SFX_VOL.quizOk });
      }
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
      this.attemptDots.forEach((dot) => dot.setVisible(false));
      this.attemptLabel?.setVisible(false);
      this.infoBg.setVisible(true);
      this.feedback.setVisible(true);
      this.feedback.setY(this.feedbackYTop);
      this.feedback.setColor("#d7ffd9");
      this.feedback.setText(`¡Correcto! +${add} puntos`);
      this.factLine.setVisible(false);
      this.factLine.setText("");
      this.sourceLine.setVisible(false);
      this.sourceLine.setText("");
      const src = q.source || "Zarrillo et al., 2018";
      this.time.delayedCall(1500, () => {
        this.unlockHint?.setVisible(false);
        this.factLine.setVisible(true);
        this.factLine.setText(`${q.fact}`);
        this.sourceLine.setVisible(true);
        this.sourceLine.setText(`Fuente: ${this.formatSourceLine(src)}`);
        this.time.delayedCall(0, () => this.layoutFactSourceStack());
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
      if (this.cache.audio.exists("sfx_error")) {
        this.sound.play("sfx_error", { volume: SFX_VOL.quizError });
      }
      this.lastCorrect = false;
      this.lastExhausted = false;
      this.attemptDots.forEach((dot) => dot.setVisible(true));
      this.attemptLabel?.setVisible(true);
      this.infoBg.setVisible(true);
      this.feedback.setVisible(true);
      this.feedback.setY(this.feedbackYInside);
      this.feedback.setColor("#ffd0d0");
      this.feedback.setText(`Respuesta incorrecta. Te quedan ${this.attemptsRemaining} intentos.`);
      this.factLine.setVisible(false);
      this.factLine.setText("");
      this.sourceLine.setVisible(false);
      this.sourceLine.setText("");
      this.time.delayedCall(950, () => {
        this.resetOptionStyles();
        this.setOptionsInteractive(true);
      });
      return;
    }

    this.lastCorrect = false;
    this.lastExhausted = true;
    if (this.cache.audio.exists("sfx_error")) {
      this.sound.play("sfx_error", { volume: SFX_VOL.quizError });
    }
    const letter = String.fromCharCode(65 + q.correctIndex);
    const corr = this.optionRows.find((r) => r.idx === q.correctIndex);
    if (corr) {
      corr.bg.setFillStyle(0x165c32, 1);
      corr.bg.setStrokeStyle(3, 0x5ef0a8);
      corr.txt.setColor("#e8fff0");
      corr.txt.setText(`${corr.txt.text}   CORRECTA`);
    }
    this.feedback.setColor("#ffe5bc");
    this.feedback.setText(
      `La respuesta correcta era: ${letter}. No te preocupes, el conocimiento se construye paso a paso.`,
    );
    this.attemptDots.forEach((dot) => dot.setVisible(false));
    this.attemptLabel?.setVisible(false);
    this.infoBg.setVisible(true);
    this.feedback.setVisible(true);
    this.feedback.setY(this.feedbackYInside);
    this.unlockHint?.setVisible(false);
    this.factLine.setVisible(true);
    this.factLine.setText(`${q.fact}`);
    this.sourceLine.setVisible(false);
    this.sourceLine.setText("");
    this.time.delayedCall(0, () => this.layoutFactSourceStack());
    this.time.delayedCall(4200, () => this.close());
  }

  formatSourceLine(src) {
    if (!this.mobileQuizMode) return src;
    const compact = src
      .replace("Nature Ecology & Evolution", "Nat. Ecol. Evol.")
      .replace("Nature Ecology and Evolution", "Nat. Ecol. Evol.")
      .replace(", 2018", " (2018)");
    return compact.length > 34 ? "Zarrillo et al. (2018)" : compact;
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
