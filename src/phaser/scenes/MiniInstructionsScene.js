import Phaser from "phaser";
import { LAYOUT } from "../layout.js";
import { INTRO_COPY, exitToMainMap } from "../data/introCopy.js";

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
 * Juego 2: layout dedicado (cacao / tarjetas / sin solapes).
 */
export default class MiniInstructionsScene extends Phaser.Scene {
  constructor() {
    super({ key: "MiniInstructionsScene" });
  }

  init(data) {
    this.pack = data.pack || "game1";
    this.fromExpedition = data.fromExpedition === true;
  }

  /**
   * PNG opcionales (fondo transparente) en public/assets/images/keys/
   * Tamaños de referencia: tecla-arriba/tecla-doble/tecla-tactil ~52×36; tecla-espacio ancha ~176×40.
   */
  preload() {
    if (this.pack !== "game2") return;
    const base = "/assets/images/keys/";
    this.load.image("instr_key_up", `${base}tecla-arriba.png`);
    this.load.image("instr_key_x2", `${base}tecla-doble.png`);
    this.load.image("instr_key_space", `${base}tecla-espacio.png`);
    this.load.image("instr_key_touch", `${base}tecla-tactil.png`);
  }

  create() {
    const cfg = INTRO_COPY[this.pack];
    if (!cfg) {
      this.scene.start("MenuScene");
      return;
    }

    if (this.pack === "game2") {
      this.createGame2Layout(cfg);
    } else {
      this.createDefaultLayout(cfg);
    }

    this.createFooterButtons(cfg);
  }

  /** Runner: fondo cálido, cabecera con aire, tarjeta de controles, bloque de juego centrado. */
  createGame2Layout(cfg) {
    const w = LAYOUT.WIDTH;
    const h = LAYOUT.HEIGHT;
    const cx = w / 2;

    this.add.rectangle(0, 0, w, h, 0x0f0b08).setOrigin(0);
    this.add.rectangle(cx, 0, w, 72, 0x1a120e, 1).setOrigin(0.5, 0);
    this.add.rectangle(cx, 70, w * 0.92, 2, 0x6b4423, 0.85).setOrigin(0.5);

    this.add
      .text(cx, 22, "EL ENIGMA DE SANTA ANA · LA FLORIDA", {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "11px",
        color: "#9a7d5c",
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 48, "INSTRUCCIONES DEL VIAJE", {
        fontFamily: "Exo 2, sans-serif",
        fontSize: "14px",
        color: "#d4a574",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 88, cfg.title, {
        fontFamily: "Exo 2, sans-serif",
        fontSize: "26px",
        color: "#f0d78c",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 122, cfg.subtitle, {
        fontFamily: "Nunito, sans-serif",
        fontSize: "14px",
        color: "#c4b5a5",
        align: "center",
        wordWrap: { width: 900 },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(cx, 156, cfg.missionTitle, {
        fontFamily: "Nunito, sans-serif",
        fontSize: "12px",
        color: "#a89888",
        align: "center",
        wordWrap: { width: 1000 },
      })
      .setOrigin(0.5, 0);

    const cardTop = 210;
    const cardH = 200;
    const cardW = 920;
    this.add
      .rectangle(cx, cardTop + cardH / 2, cardW, cardH, 0x241a14, 1)
      .setStrokeStyle(2, 0xc9a050);
    this.add
      .rectangle(cx, cardTop + cardH / 2, cardW - 8, cardH - 8, 0x1e1611, 0.92)
      .setStrokeStyle(1, 0x3d2a1e);

    this.add
      .text(cx, cardTop + 26, "CONTROLES", {
        fontFamily: "Exo 2, sans-serif",
        fontSize: "17px",
        color: "#f0d78c",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const rowLeft = cx - cardW / 2 + 100;
    const textLeft = rowLeft + 116;
    let ry = cardTop + 54;
    const rowGap = 40;

    const row = (textureKey, badgeLabel, desc, sub, maxW, maxH, badgeW) => {
      this.placeKeyVisual(rowLeft, ry, textureKey, maxW, maxH, () =>
        this.drawKeyBadge(rowLeft, ry, badgeLabel, badgeW),
      );
      let lines = desc;
      if (sub) lines += `\n${sub}`;
      this.add
        .text(textLeft, ry, lines, {
          fontFamily: "Nunito, sans-serif",
          fontSize: "14px",
          color: "#ede6dc",
          align: "left",
          lineSpacing: 4,
        })
        .setOrigin(0, 0.5);
      ry += rowGap;
    };

    row("instr_key_up", "↑", "Saltar.", "", 52, 38, 52);
    row("instr_key_x2", "×2", "Doble salto: vuelve a pulsar ↑ en el aire.", "", 52, 38, 52);
    row(
      "instr_key_space",
      "ESPACIO",
      "Pausa o continuar.",
      "Con pausa se detiene todo: escenario, rocas y vasijas.",
      184,
      42,
      172,
    );

    this.placeKeyVisual(rowLeft, ry, "instr_key_touch", 52, 38, () =>
      this.drawKeyBadge(rowLeft, ry, "◇", 52),
    );
    this.add
      .text(textLeft, ry, "Móvil / tableta: toca la zona del juego para saltar.", {
        fontFamily: "Nunito, sans-serif",
        fontSize: "14px",
        color: "#c8b8a8",
        align: "left",
        lineSpacing: 4,
      })
      .setOrigin(0, 0.5);

    const playTop = cardTop + cardH + 32;
    this.add
      .text(cx, playTop, "CÓMO ES EL JUEGO", {
        fontFamily: "Exo 2, sans-serif",
        fontSize: "16px",
        color: "#d4a574",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const playBody = cfg.missionLines
      .filter((line) => !line.startsWith("CÓMO JUGAR"))
      .map((line) => `• ${line}`)
      .join("\n");
    const playFoot = cfg.statsLines.map((line) => `• ${line}`).join("\n");

    this.add
      .text(cx, playTop + 28, `${playBody}\n\n${playFoot}`, {
        fontFamily: "Nunito, sans-serif",
        fontSize: "14px",
        color: "#ddd8cc",
        align: "center",
        lineSpacing: 6,
        wordWrap: { width: 820 },
      })
      .setOrigin(0.5, 0);
  }

  placeKeyVisual(x, y, textureKey, maxW, maxH, fallback) {
    if (textureKey && this.textures.exists(textureKey)) {
      const im = this.add.image(x, y, textureKey).setOrigin(0.5);
      const s = Math.min(maxW / im.width, maxH / im.height, 1.35);
      im.setScale(s);
      return;
    }
    fallback();
  }

  drawKeyBadge(x, y, label, bw = 52) {
    const g = this.add.graphics();
    const bh = 34;
    g.fillStyle(0x3d2e24, 1);
    g.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 8);
    g.lineStyle(2, 0xc9a050, 1);
    g.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 8);
    let fs = "13px";
    if (label === "↑") fs = "20px";
    else if (label === "◇") fs = "16px";
    else if (label === "ESPACIO") fs = "10px";
    else if (label.length > 3) fs = "11px";
    this.add
      .text(x, y, label, {
        fontFamily: "Exo 2, sans-serif",
        fontSize: fs,
        color: "#fff8e8",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
  }

  createDefaultLayout(cfg) {
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x141210).setOrigin(0);

    this.add
      .text(LAYOUT.WIDTH / 2, 32, "PROPUESTA DE MINIJUEGOS EDUCATIVOS | El Enigma de Santa Ana – La Florida", {
        fontSize: "12px",
        color: "#c8921a",
      })
      .setOrigin(0.5);

    this.add
      .text(LAYOUT.WIDTH / 2, 56, "INSTRUCCIONES", {
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
        fontFamily: "Nunito, sans-serif",
        fontSize: "15px",
        color: "#ddd8cc",
        align: "left",
        wordWrap: { width: 920 },
      })
      .setOrigin(0.5, 0);
  }

  createFooterButtons(cfg) {
    const yBtn = LAYOUT.HEIGHT - 72;
    const cx = LAYOUT.WIDTH / 2;

    this.drawBtn(cx - 220, yBtn, 220, 48, "[ ATRÁS ]", () => {
      if (this.fromExpedition) {
        exitToMainMap();
      } else {
        this.scene.start("MiniIntroScene", { pack: this.pack });
      }
    });

    const cta =
      this.pack === "game2" ? "[ EMPEZAR EL VIAJE ]" : "[ ENTENDIDO – ¡EXPLORAR! ]";

    this.drawBtn(cx + 220, yBtn, 400, 48, cta, () => this.scene.start(cfg.nextScene));
  }

  drawBtn(x, y, w, h, label, fn) {
    const warm = this.pack === "game2";
    const fill = warm ? 0x3d2818 : 0x2a2418;
    const stroke = warm ? 0xe8c066 : 0xc8921a;
    this.add.rectangle(x, y, w, h, fill).setStrokeStyle(2, stroke);
    const txt = this.add
      .text(x, y, label, {
        fontFamily: "Exo 2, sans-serif",
        fontSize: "14px",
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
