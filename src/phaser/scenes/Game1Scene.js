import Phaser from "phaser";
import { LAYOUT } from "../layout.js";
import Player from "../entities/Player.js";
import { exitToMainMap } from "../data/introCopy.js";

/**
 * Minijuego 1 — Exploración + quiz (propuesta: top-down / lateral + Phaser).
 * Objetos: botella, vasija, turquesa. Interacción: acercarse (solape) o [E].
 */
export default class Game1Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Game1Scene" });
  }

  create() {
    this.registry.set("game1Score", 0);

    this.events.off("quiz-finished");
    this.events.on("quiz-finished", (data) => {
      const item = this.pendingCollectible;
      this.pendingCollectible = null;
      if (item && item.active) {
        if (data.correct || data.exhausted) {
          item.destroy();
        } else {
          item.setData("quizBusy", false);
          item.setData("overlapLock", true);
        }
      }
    });

    this.pendingCollectible = null;
    this.drawChrome();

    this.physics.world.setBounds(0, LAYOUT.GAME_TOP, LAYOUT.WIDTH, LAYOUT.GAME_H);

    this.add
      .tileSprite(
        LAYOUT.WIDTH / 2,
        LAYOUT.GAME_TOP + LAYOUT.GAME_H / 2,
        LAYOUT.WIDTH,
        LAYOUT.GAME_H,
        "ph_floor",
      )
      .setTint(0x3d5c45);

    this.player = new Player(this, LAYOUT.WIDTH / 2, LAYOUT.GAME_TOP + LAYOUT.GAME_H / 2);
    this.player.setTexture("ph_player");

    const spots = [
      { x: 220, y: LAYOUT.GAME_TOP + 120, qid: "objeto-1-botella" },
      { x: 960, y: LAYOUT.GAME_TOP + 200, qid: "objeto-2-vasija" },
      { x: 640, y: LAYOUT.GAME_TOP + 380, qid: "objeto-3-turquesa" },
    ];

    this.collectibles = this.physics.add.group();
    for (const s of spots) {
      const c = this.physics.add.sprite(s.x, s.y, "ph_collect");
      c.setData("questionId", s.qid);
      c.setData("quizBusy", false);
      this.collectibles.add(c);
    }

    this.physics.add.overlap(this.player, this.collectibles, (_p, item) => {
      if (item.getData("quizBusy")) return;
      if (item.getData("overlapLock")) return;
      item.setData("quizBusy", true);
      this.pendingCollectible = item;
      this.scene.pause();
      this.scene.launch("QuizScene", {
        questionId: item.getData("questionId"),
        returnScene: "Game1Scene",
      });
    });

    this.hud = this.add.text(24, 18, "", {
      fontSize: "15px",
      color: "#f9f2dd",
    });

    this.add
      .text(LAYOUT.WIDTH - 24, 18, "[ VOLVER AL MAPA ]", {
        fontSize: "12px",
        color: "#c8921a",
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => exitToMainMap());

    this.keyE = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.hint = this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.HINT_TOP + 20, "", {
        fontSize: "14px",
        color: "#dddddd",
        align: "center",
        wordWrap: { width: 1100 },
      })
      .setOrigin(0.5);

    this.resultPrompt = this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.CONTROLS_TOP + 24, "", {
        fontSize: "14px",
        color: "#c8921a",
        align: "center",
        wordWrap: { width: 900 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.resultPrompt.on("pointerdown", () => this.tryShowResults());

    this.input.keyboard?.on("keydown-ENTER", () => this.tryShowResults());
  }

  drawChrome() {
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x1a1a2e).setOrigin(0);
    this.add.rectangle(0, LAYOUT.GAME_TOP, LAYOUT.WIDTH, LAYOUT.GAME_H, 0x0f1f16).setOrigin(0);
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HUD_TOP_H, 0x101820, 0.95).setOrigin(0);
    this.add.rectangle(0, LAYOUT.HINT_TOP, LAYOUT.WIDTH, LAYOUT.HINT_BAR_H, 0x151820, 0.9).setOrigin(0);
    this.add.rectangle(0, LAYOUT.CONTROLS_TOP, LAYOUT.WIDTH, LAYOUT.CONTROLS_H_ACTUAL, 0x0a0e12, 0.92).setOrigin(0);
    this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.CONTROLS_TOP + 78, "PANTALLA: DURANTE LA EXPLORACIÓN — acércate a los objetos o usa [E] / toque.", {
        fontSize: "11px",
        color: "#666666",
      })
      .setOrigin(0.5);
  }

  tryShowResults() {
    const found = 3 - this.collectibles.countActive(true);
    if (found < 3) return;
    const score = this.registry.get("game1Score") ?? 0;
    this.scene.start("ResultScene", { game: "explore", score });
  }

  update() {
    this.player.updateMovement();

    for (const c of this.collectibles.getChildren()) {
      if (!c.active || !c.getData("overlapLock")) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
      if (d > 72) {
        c.setData("overlapLock", false);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      let best = null;
      let dmin = Infinity;
      for (const c of this.collectibles.getChildren()) {
        if (!c.active || c.getData("quizBusy")) continue;
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
        if (d < 56 && d < dmin) {
          dmin = d;
          best = c;
        }
      }
      if (best) {
        best.setData("quizBusy", true);
        this.pendingCollectible = best;
        this.scene.pause();
        this.scene.launch("QuizScene", {
          questionId: best.getData("questionId"),
          returnScene: "Game1Scene",
        });
      }
    }

    const found = 3 - this.collectibles.countActive(true);
    const score = this.registry.get("game1Score") ?? 0;
    this.hud.setText(`Objetos hallados: ${found}/3 · Puntos: ${score}/300 · WASD / flechas`);

    if (found >= 3) {
      this.hint.setText(
        "¡Misión completada! Has encontrado los 3 objetos del descubrimiento de 2002. Pulsa [Enter] o toca abajo para ver resultados.",
      );
      this.resultPrompt.setText("[ Ver resultados ]");
    } else {
      const near = this.collectibles.getChildren().some(
        (c) =>
          c.active &&
          !c.getData("quizBusy") &&
          Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y) < 56,
      );
      if (near) {
        this.hint.setText("¡Objeto arqueológico encontrado!\nPresiona [E] o toca la pantalla para examinar");
      } else {
        this.hint.setText("Explora el sitio Santa Ana – La Florida. Localiza los tres objetos del descubrimiento de 2002.");
      }
      this.resultPrompt.setText("");
    }
  }
}
