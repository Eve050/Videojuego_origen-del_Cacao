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
    this.fromExpedition = data?.fromExpedition === true;
  }

  create() {
    const cfg = INTRO_COPY[this.pack];
    if (!cfg) {
      this.scene.start("MenuScene");
      return;
    }

    // Placeholder temporal para intro de video (1080x720).
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x000000).setOrigin(0);
    this.add
      .rectangle(LAYOUT.WIDTH / 2, LAYOUT.HEIGHT / 2, 1080, 720, 0x050505, 1)
      .setStrokeStyle(2, 0x303030);

    this.add
      .text(LAYOUT.WIDTH / 2, 74, cfg.title || "INTRO", {
        fontFamily: "Arial, sans-serif",
        fontSize: "32px",
        color: "#f0f0f0",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(LAYOUT.WIDTH / 2, 122, cfg.subtitle || "", {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        color: "#b8b8b8",
        align: "center",
        wordWrap: { width: 980 },
      })
      .setOrigin(0.5);

    this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.HEIGHT / 2 - 20, "ESPACIO TEMPORAL\n(AQUÍ IRÁ EL VIDEO DE INTRO)", {
        fontFamily: "Arial, sans-serif",
        fontSize: "20px",
        color: "#cfcfcf",
        align: "center",
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    this.makeButton(500, "[ COMENZAR JUEGO ]", () => this.startGameNow(cfg));
    this.makeButton(556, "[ VER INSTRUCCIONES ]", () =>
      this.scene.start("MiniInstructionsScene", { pack: this.pack, fromExpedition: this.fromExpedition }),
    );
    this.makeButton(612, "[ VOLVER AL MAPA ]", () => exitToMainMap());
  }

  startGameNow(cfg) {
    if (this.pack === "game3") {
      const lv = Number(this.registry.get("mazeLevel")) || 1;
      this.registry.set("mazeLevel", lv);
    }
    this.scene.start(cfg.nextScene);
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
