import Phaser from "phaser";
import { LAYOUT } from "../layout.js";
import zonesConfig from "../data/zonesConfig.json";
import { exitToMainMap } from "../data/introCopy.js";

/** Suelo según doc técnico (superficie caminable en Y). */
const GROUND_TOP_Y = 450;
const INVULN_MS = 1500;
const START_LIVES = 3;

/**
 * Minijuego 2 — Auto-runner (doc: gravedad 1200, salto -620, 3 vidas, barra de ruta 5 zonas).
 */
export default class Game2Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Game2Scene" });
  }

  create() {
    this.drawChrome();
    this.physics.world.setBounds(0, LAYOUT.GAME_TOP, LAYOUT.WIDTH, LAYOUT.GAME_H);
    this.physics.world.gravity.y = 1200;

    this.zoneIndex = 0;
    this.zones = zonesConfig;
    this.vainasCount = 0;
    this.points = 0;
    this.unlockedFacts = new Set();
    this.runActive = true;
    this.lives = START_LIVES;
    this.invulnerableMs = 0;

    const tint0 = parseInt(String(this.zones[0].backgroundTint).replace("0x", ""), 16);
    this.bgTile = this.add.tileSprite(
      LAYOUT.WIDTH / 2,
      LAYOUT.GAME_TOP + LAYOUT.GAME_H / 2,
      LAYOUT.WIDTH * 2,
      LAYOUT.GAME_H,
      "ph_floor",
    );
    this.bgTile.setTint(tint0);

    this.parallax = this.add.tileSprite(
      LAYOUT.WIDTH / 2,
      LAYOUT.GAME_TOP + LAYOUT.GAME_H / 2,
      LAYOUT.WIDTH * 3,
      LAYOUT.GAME_H,
      "ph_floor",
    );
    this.parallax.setTint(0x1a3028);
    this.parallax.tilePositionX = 0;

    const groundCenterY = GROUND_TOP_Y + 28;
    const ground = this.add.rectangle(LAYOUT.WIDTH / 2, groundCenterY, LAYOUT.WIDTH, 56, 0x3d2e22);
    this.physics.add.existing(ground, true);

    this.player = this.physics.add.sprite(220, 400, "ph_runner");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(28, 44);
    this.physics.add.collider(this.player, ground);

    this.obstacles = this.physics.add.group();
    this.pods = this.physics.add.group();

    this.lastObstacleSpawnTime = 0;
    this.minObstacleIntervalMs = () => Math.max(320, Math.min(900, (320 / this.scrollSpeed) * 1000));

    this.time.addEvent({
      delay: 1400,
      loop: true,
      callback: () => this.spawnObstacle(groundCenterY),
    });

    this.physics.add.overlap(this.player, this.pods, (_p, pod) => {
      const golden = pod.getData("isGolden");
      pod.destroy();
      this.vainasCount += 1;
      if (golden) {
        this.points += 30;
        const z = this.zones[this.zoneIndex];
        if (z?.zoneFact && !this.unlockedFacts.has(z.id)) {
          this.unlockedFacts.add(z.id);
          this.flashMessage("DATO HISTÓRICO DESBLOQUEADO", z.zoneFact);
        }
      } else {
        this.points += 10;
      }
    });

    this.physics.add.overlap(this.player, this.obstacles, (_player, obs) => {
      if (!this.runActive || this.invulnerableMs > 0) return;
      obs.destroy();
      this.lives -= 1;
      this.invulnerableMs = INVULN_MS;
      this.flashMessage("", "Cuidado, el camino del cacao no es fácil");
      this.tweens.add({
        targets: this.player,
        alpha: { from: 1, to: 0.35 },
        duration: 120,
        yoyo: true,
        repeat: 4,
      });
      if (this.lives <= 0) {
        this.runActive = false;
        this.scene.start("ResultScene", {
          game: "runner_fail",
          score: this.points,
          vainas: this.vainasCount,
          datos: this.unlockedFacts.size,
        });
      } else {
        this.updateHud();
      }
    });

    this.scrollSpeed = this.zones[0].scrollSpeed || 280;

    this.hud = this.add.text(24, 10, "", { fontSize: "13px", color: "#f9f2dd", lineSpacing: 4 });
    this.hudLives = this.add.text(LAYOUT.WIDTH - 24, 10, "", {
      fontSize: "14px",
      color: "#ff6b6b",
    }).setOrigin(1, 0);

    this.routeBarY = LAYOUT.GAME_TOP + LAYOUT.GAME_H - 36;
    this.routeNodes = [];
    this.buildRouteBar();

    this.zoneLabel = this.add.text(LAYOUT.WIDTH / 2, LAYOUT.HINT_TOP + 18, "", {
      fontSize: "13px",
      color: "#c8921a",
      align: "center",
      wordWrap: { width: 1100 },
    }).setOrigin(0.5);

    this.bannerText = this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.GAME_TOP + 80, "", {
        fontSize: "16px",
        color: "#fff8e8",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 1000 },
        backgroundColor: "#00000088",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.space = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyUp = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

    this.input.on("pointerdown", () => this.doJump());

    this.add
      .text(LAYOUT.WIDTH - 24, 44, "[ VOLVER AL MAPA ]", { fontSize: "11px", color: "#c8921a" })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => exitToMainMap());

    this.time.addEvent({ delay: 10000, loop: true, callback: () => this.advanceZone() });

    this.flashBanner(this.zones[0].bannerText);
    this.updateHud();
    this.updateRouteBar();
  }

  buildRouteBar() {
    const labels = ["I", "II", "III", "IV", "V"];
    const totalW = 520;
    const startX = (LAYOUT.WIDTH - totalW) / 2;
    const line = this.add
      .rectangle(LAYOUT.WIDTH / 2, this.routeBarY, totalW, 4, 0x3a3530)
      .setOrigin(0.5);
    this.routeLine = line;
    const step = totalW / (labels.length - 1);
    for (let i = 0; i < labels.length; i += 1) {
      const x = startX + i * step;
      const dot = this.add.circle(x, this.routeBarY, 10, 0x2a2824, 1).setStrokeStyle(2, 0x6a5a40);
      const lbl = this.add
        .text(x, this.routeBarY + 22, labels[i], { fontSize: "10px", color: "#8a8578" })
        .setOrigin(0.5);
      this.routeNodes.push({ dot, lbl, x });
    }
  }

  updateRouteBar() {
    this.routeNodes.forEach((n, i) => {
      const active = i <= this.zoneIndex;
      const current = i === this.zoneIndex;
      n.dot.setFillStyle(current ? 0xffcc33 : active ? 0x4a8c5c : 0x2a2824);
      n.dot.setStrokeStyle(2, current ? 0xfff0aa : active ? 0x6cfc9a : 0x4a4035);
      n.lbl.setColor(current ? "#ffcc66" : active ? "#a8e0b8" : "#6a6558");
    });
  }

  drawChrome() {
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x1a1a2e).setOrigin(0);
    this.add.rectangle(0, LAYOUT.GAME_TOP, LAYOUT.WIDTH, LAYOUT.GAME_H, 0x0d1210).setOrigin(0);
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HUD_TOP_H, 0x101820, 0.95).setOrigin(0);
    this.add.rectangle(0, LAYOUT.HINT_TOP, LAYOUT.WIDTH, LAYOUT.HINT_BAR_H, 0x151820, 0.9).setOrigin(0);
    this.add.rectangle(0, LAYOUT.CONTROLS_TOP, LAYOUT.WIDTH, LAYOUT.CONTROLS_H_ACTUAL, 0x0a0e12, 0.92).setOrigin(0);
    this.add
      .text(
        LAYOUT.WIDTH / 2,
        LAYOUT.CONTROLS_TOP + 48,
        "PANTALLA: DURANTE EL RECORRIDO — [ESPACIO] o [↑] o tocar para SALTAR. TIP: vainas doradas desbloquean datos históricos.",
        {
          fontSize: "11px",
          color: "#777777",
          align: "center",
          wordWrap: { width: 1100 },
        },
      )
      .setOrigin(0.5);
  }

  doJump() {
    if (this.player.body.touching.down) {
      this.player.setVelocityY(-620);
    }
  }

  flashMessage(title, sub) {
    if (title) {
      this.zoneLabel.setText(`${title}\n${sub}`);
    } else {
      this.zoneLabel.setText(sub);
    }
    this.time.delayedCall(2200, () => this.updateHud());
  }

  flashBanner(text) {
    if (!text) return;
    this.bannerText.setText(text);
    this.tweens.add({
      targets: this.bannerText,
      alpha: 1,
      duration: 280,
      yoyo: true,
      hold: 2200,
      onComplete: () => {
        this.bannerText.setAlpha(0);
      },
    });
  }

  spawnObstacle(groundCenterY) {
    if (!this.runActive) return;
    const now = this.time.now;
    if (now - this.lastObstacleSpawnTime < this.minObstacleIntervalMs()) return;

    const x = LAYOUT.WIDTH + 40;
    if (Math.random() > 0.42) {
      const o = this.physics.add.sprite(x, groundCenterY - 40, "ph_obstacle");
      o.setVelocityX(-this.scrollSpeed);
      o.body.setAllowGravity(false);
      this.obstacles.add(o);
      this.lastObstacleSpawnTime = now;
    } else {
      const isGold = Math.random() < 0.125;
      const key = isGold ? "ph_pod_gold" : "ph_pod";
      const p = this.physics.add.sprite(x, groundCenterY - 70, key);
      p.setData("isGolden", isGold);
      p.setVelocityX(-this.scrollSpeed);
      p.body.setAllowGravity(false);
      this.pods.add(p);
      this.lastObstacleSpawnTime = now;
    }
  }

  advanceZone() {
    if (!this.runActive) return;
    if (this.zoneIndex < 4) {
      this.zoneIndex += 1;
      const z = this.zones[this.zoneIndex];
      this.scrollSpeed = z.scrollSpeed;
      const tint = parseInt(String(z.backgroundTint).replace("0x", ""), 16);
      this.bgTile.setTint(tint);
      this.flashBanner(z.bannerText);
      this.updateHud();
      this.updateRouteBar();
    } else {
      this.runActive = false;
      this.scene.start("ResultScene", {
        game: "runner",
        score: this.points,
        vainas: this.vainasCount,
        datos: this.unlockedFacts.size,
        allZones: true,
      });
    }
  }

  heartsLine() {
    return "♥".repeat(Math.max(0, this.lives)) + "♡".repeat(Math.max(0, START_LIVES - this.lives));
  }

  updateHud() {
    const z = this.zones[this.zoneIndex];
    this.hud.setText(
      `Vainas: ${this.vainasCount}  ·  Datos desbloqueados: ${this.unlockedFacts.size} / 5\nZona: ${z.name}`,
    );
    this.hudLives.setText(`Vidas: ${this.heartsLine()}`);
    this.zoneLabel.setText(`${z.bannerText}`);
  }

  update(_t, dt) {
    if (this.invulnerableMs > 0) {
      this.invulnerableMs -= dt;
    }

    this.parallax.tilePositionX += (this.scrollSpeed * dt) / 1000 * 0.3;

    this.obstacles.getChildren().forEach((o) => {
      if (o.body && o.x < -60) {
        o.destroy();
      }
    });
    this.pods.getChildren().forEach((o) => {
      if (o.body && o.x < -60) {
        o.destroy();
      }
    });

    if (Phaser.Input.Keyboard.JustDown(this.space) || Phaser.Input.Keyboard.JustDown(this.keyUp)) {
      this.doJump();
    }
  }
}
