import Phaser from "phaser";
import { LAYOUT } from "../layout.js";
import { INTRO_COPY } from "../data/introCopy.js";

function buildInstructionBody(cfg) {
  const main = cfg.missionLines
    .map((line) => {
      if (line.startsWith("CÓMO JUGAR")) {
        return line;
      }
      return `• ${line}`;
    })
    .join("\n");
  const stats = cfg.statsLines.map((line) => `• ${line}`).join("\n");
  return `${main}\n\n${stats}`;
}

/**
 * PANTALLA: INSTRUCCIONES — textos según propuesta.
 */
export default class MiniInstructionsScene extends Phaser.Scene {
  constructor() {
    super({ key: "MiniInstructionsScene" });
  }

  init(data) {
    this.pack = data.pack || "game1";
  }

  create() {
    const cfg = INTRO_COPY[this.pack];
    if (!cfg) {
      this.scene.start("MenuScene");
      return;
    }

    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x141210).setOrigin(0);

    this.add
      .text(LAYOUT.WIDTH / 2, 32, "PROPUESTA DE MINIJUEGOS EDUCATIVOS | El Enigma de Santa Ana – La Florida", {
        fontSize: "12px",
        color: "#c8921a",
      })
      .setOrigin(0.5);

    this.add
      .text(LAYOUT.WIDTH / 2, 56, "PANTALLA: INSTRUCCIONES", {
        fontSize: "14px",
        color: "#c8921a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(LAYOUT.WIDTH / 2, 88, cfg.title, {
        fontSize: "20px",
        color: "#e4b84a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(LAYOUT.WIDTH / 2, 128, cfg.missionTitle, {
        fontSize: "17px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const body = buildInstructionBody(cfg);

    this.add
      .text(LAYOUT.WIDTH / 2, 168, body, {
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
        color: "#ddd8cc",
        align: "left",
        wordWrap: { width: 920 },
      })
      .setOrigin(0.5, 0);

    const yBtn = LAYOUT.HEIGHT - 88;
    this.drawBtn(LAYOUT.WIDTH / 2 - 200, yBtn, 200, 44, "[ ATRÁS ]", () =>
      this.scene.start("MiniIntroScene", { pack: this.pack }),
    );

    const cta =
      this.pack === "game2"
        ? "[ EMPEZAR EL VIAJE! ]"
        : "[ ENTENDIDO – ¡EXPLORAR! ]";

    this.drawBtn(LAYOUT.WIDTH / 2 + 200, yBtn, 360, 44, cta, () => this.scene.start(cfg.nextScene));
  }

  drawBtn(x, y, w, h, label, fn) {
    this.add.rectangle(x, y, w, h, 0x2a2418).setStrokeStyle(2, 0xc8921a);
    const txt = this.add
      .text(x, y, label, {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#f9f2dd",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const z = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    z.on("pointerover", () => txt.setColor("#fff8cc"));
    z.on("pointerout", () => txt.setColor("#f9f2dd"));
    z.on("pointerdown", fn);
  }
}
