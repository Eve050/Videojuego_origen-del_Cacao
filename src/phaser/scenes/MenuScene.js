import Phaser from "phaser";
import { LAYOUT } from "../layout.js";

/**
 * Acceso a los tres minijuegos — encabezado según propuesta PDF.
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create() {
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x1a1a2e).setOrigin(0);

    this.add
      .text(LAYOUT.WIDTH / 2, 36, "PROPUESTA DE MINIJUEGOS EDUCATIVOS | El Enigma de Santa Ana – La Florida", {
        fontFamily: "Exo 2, sans-serif",
        fontSize: "14px",
        color: "#e4b84a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(LAYOUT.WIDTH / 2, 72, "Videojuego Educativo Interactivo · Documento v1.0 · marzo 2026", {
        fontFamily: "Nunito, sans-serif",
        fontSize: "14px",
        color: "#d8d4c8",
      })
      .setOrigin(0.5);

    this.add
      .text(LAYOUT.WIDTH / 2, 104, "Elegir minijuego (Phaser.js · resolución base 1280×720)", {
        fontFamily: "Nunito, sans-serif",
        fontSize: "13px",
        color: "#8a8578",
      })
      .setOrigin(0.5);

    const scenes = [
      {
        key: "MiniIntroScene",
        pack: "game1",
        title: "MINIJUEGO 1 — El Origen del Cacao",
        sub: "Exploración + quiz",
      },
      {
        key: "MiniIntroScene",
        pack: "game2",
        title: "MINIJUEGO 2 — El Viaje del Cacao al Mundo",
        sub: "Auto-runner histórico",
      },
      {
        key: "MiniIntroScene",
        pack: "game3",
        title: "MINIJUEGO 3 — Cacao Maze",
        sub: "Laberinto cultural",
      },
    ];

    let y = 168;
    for (const s of scenes) {
      this.add.rectangle(LAYOUT.WIDTH / 2, y + 8, 560, 64, 0xc8921a).setDepth(0);
      this.add
        .text(LAYOUT.WIDTH / 2, y - 4, s.title, {
          fontFamily: "Exo 2, sans-serif",
          fontSize: "15px",
          color: "#1a0d05",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(1);
      this.add
        .text(LAYOUT.WIDTH / 2, y + 18, s.sub, {
          fontFamily: "Nunito, sans-serif",
          fontSize: "12px",
          color: "#2a2418",
        })
        .setOrigin(0.5)
        .setDepth(1);
      const hit = this.add.zone(LAYOUT.WIDTH / 2, y + 8, 560, 64).setDepth(2).setInteractive({ useHandCursor: true });
      hit.on("pointerdown", () => {
        this.scene.start(s.key, { pack: s.pack });
      });
      y += 88;
    }

    this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.HEIGHT - 36, "Compatibilidad: Chrome, Firefox, Safari, Edge · Plan Binacional Ecuador–Perú • Proyecto Palanda", {
        fontFamily: "Nunito, sans-serif",
        fontSize: "11px",
        color: "#666666",
        align: "center",
        wordWrap: { width: 1100 },
      })
      .setOrigin(0.5);
  }
}
