import Phaser from "phaser";
import { LAYOUT } from "../layout.js";
import { INTRO_COPY, exitToMainMap } from "../data/introCopy.js";

/**
 * Pantallas de inicio — redacción y botones según propuesta cliente (Phaser 3).
 */
export default class MiniIntroScene extends Phaser.Scene {
  constructor() {
    super({ key: "MiniIntroScene" });
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

    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x1a1610).setOrigin(0);
    this.add.rectangle(LAYOUT.WIDTH / 2, 120, 920, 2, 0xc8921a, 0.7).setOrigin(0.5);

    this.add
      .text(LAYOUT.WIDTH / 2, 36, "PROPUESTA DE MINIJUEGOS EDUCATIVOS | El Enigma de Santa Ana – La Florida", {
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#c8921a",
      })
      .setOrigin(0.5);

    this.add
      .text(LAYOUT.WIDTH / 2, 64, cfg.title, {
        fontFamily: "Arial, sans-serif",
        fontSize: "26px",
        color: "#e4b84a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(LAYOUT.WIDTH / 2, 104, cfg.subtitle, {
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
        color: "#e8e4dc",
        align: "center",
        wordWrap: { width: 1000 },
      })
      .setOrigin(0.5);

    if (this.pack === "game3") {
      this.addLevelButtons(cfg);
    } else {
      this.addStandardButtons(cfg);
    }

    this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.HEIGHT - 24, "Plan Binacional Ecuador–Perú • Proyecto Palanda", {
        fontSize: "11px",
        color: "#6a6558",
      })
      .setOrigin(0.5);
  }

  makeButton(y, label, onClick) {
    const w = 440;
    const h = 46;
    const x = LAYOUT.WIDTH / 2;
    this.add.rectangle(x, y, w, h, 0x2a2418).setStrokeStyle(2, 0xc8921a);
    const txt = this.add
      .text(x, y, label, {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#f9f2dd",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const z = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    z.on("pointerover", () => txt.setColor("#fff8cc"));
    z.on("pointerout", () => txt.setColor("#f9f2dd"));
    z.on("pointerdown", onClick);
  }

  addStandardButtons(cfg) {
    let y = 198;
    this.makeButton(y, cfg.startButton || "[ COMENZAR ]", () => this.scene.start(cfg.nextScene));
    y += 56;
    this.makeButton(y, cfg.instructionsButton || "[ VER INSTRUCCIONES ]", () =>
      this.scene.start("MiniInstructionsScene", { pack: this.pack }),
    );
    y += 56;
    this.makeButton(y, "[ VOLVER AL MAPA ]", () => exitToMainMap());
  }

  addLevelButtons(cfg) {
    let y = 188;
    const startMaze = (level) => {
      this.registry.set("mazeLevel", level);
      this.scene.start(cfg.nextScene);
    };
    this.makeButton(y, "[ NIVEL 1 – EXPLORADOR ]", () => startMaze(1));
    y += 52;
    this.makeButton(y, "[ NIVEL 2 – ARQUEÓLOGO ]", () => startMaze(2));
    y += 52;
    this.makeButton(y, "[ NIVEL 3 – GUARDIÁN ]", () => startMaze(3));
    y += 56;
    this.makeButton(y, "[ VOLVER AL MAPA ]", () => exitToMainMap());
  }
}
