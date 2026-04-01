import Phaser from "phaser";
import { LAYOUT } from "../layout.js";
import zonesConfig from "../data/zonesConfig.json";
import { exitToMainMap } from "../data/introCopy.js";

/** Superficie del suelo (doc técnico). */
const GROUND_TOP_Y = 450;
const INVULN_MS = 1500;
const START_LIVES = 3;
/** Progreso por distancia: ~12–14 s por tramo a ~280–330 px/s. */
const DIST_PER_ZONE = 3600;
/** Doc 3.3: espacio entre obstáculos (px virtuales a la velocidad del scroll). */
const MIN_OBSTACLE_GAP = 220;
/** Doc 3.3: ítems cada 150–400 px. */
const ITEM_GAP_MIN = 150;
const ITEM_GAP_MAX = 400;
/** Salto en aire adicional (patrón Feronato / endless runner). */
const MAX_AIR_JUMPS = 2;

/** Capas de color por zona (cielo / suelo) — alineado a diseño de 5 zonas. */
const ZONE_SCENERY = [
  { sky: 0x0d2818, earth: 0x3d6b42 },
  { sky: 0x3d4f5c, earth: 0x2a3844 },
  { sky: 0x0d3d28, earth: 0x2a8c55 },
  { sky: 0x5c3010, earth: 0xc8941a },
  { sky: 0x141830, earth: 0x4a6a9c },
];

/**
 * Minijuego 2 — Viaje del cacao: recolectar vasijas / piezas, saltar obstáculos,
 * avance por distancia (5 zonas hasta Europa). Doc: gravedad 1200, salto -620.
 */
export default class Game2Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Game2Scene" });
  }

  releaseObstacle(o) {
    if (!o || !o.scene) return;
    this.tweens.killTweensOf(o);
    o.setActive(false);
    o.setVisible(false);
    if (o.body) o.body.enable = false;
    this.obstacles.remove(o, false, false);
    o.setPosition(-9999, -9999);
    this.obstaclePool.add(o);
  }

  obtainObstacle() {
    let o = null;
    const pooled = this.obstaclePool.getChildren();
    for (let i = 0; i < pooled.length; i += 1) {
      if (!pooled[i].active) {
        o = pooled[i];
        break;
      }
    }
    if (o) {
      this.obstaclePool.remove(o, false, false);
      this.obstacles.add(o);
    } else {
      o = this.physics.add.sprite(0, 0, "ph_obstacle");
      this.obstacles.add(o);
    }
    o.setActive(true);
    o.setVisible(true);
    if (o.body) {
      o.body.enable = true;
      o.body.setAllowGravity(false);
      o.body.setImmovable(true);
    }
    return o;
  }

  releasePod(p) {
    if (!p || !p.scene) return;
    this.tweens.killTweensOf(p);
    p.setActive(false);
    p.setVisible(false);
    if (p.body) p.body.enable = false;
    this.pods.remove(p, false, false);
    p.setPosition(-9999, -9999);
    p.setAlpha(1);
    p.setScale(1);
    p.setData("picking", false);
    this.podPool.add(p);
  }

  obtainPod() {
    let p = null;
    const pooled = this.podPool.getChildren();
    for (let i = 0; i < pooled.length; i += 1) {
      if (!pooled[i].active) {
        p = pooled[i];
        break;
      }
    }
    if (p) {
      this.podPool.remove(p, false, false);
      this.pods.add(p);
    } else {
      p = this.physics.add.sprite(0, 0, "ph_vessel");
      this.pods.add(p);
    }
    p.setActive(true);
    p.setVisible(true);
    p.setAlpha(1);
    p.setData("picking", false);
    if (p.body) {
      p.body.enable = true;
      p.body.setAllowGravity(false);
    }
    return p;
  }


  hudVesselScaleForCount() {
    return 0.34 + Math.min(this.vainasCount, 48) * 0.0068;
  }

  pulseHudVessel() {
    if (!this.hudVesselIcon) return;
    const s = this.hudVesselScaleForCount();
    this.tweens.killTweensOf(this.hudVesselIcon);
    this.hudVesselIcon.setScale(s * 1.14);
    this.tweens.add({
      targets: this.hudVesselIcon,
      scale: s,
      duration: 210,
      ease: "Sine.easeOut",
    });
  }

  create() {
    this.drawChrome();

    if (this.textures.exists("bg_selva_run")) {
      const cx = LAYOUT.WIDTH / 2;
      const cy = LAYOUT.GAME_TOP + LAYOUT.GAME_H / 2;
      this.bgParallaxFar = this.add
        .tileSprite(cx, cy - 24, LAYOUT.WIDTH * 2 + 900, LAYOUT.GAME_H + 100, "bg_selva_run")
        .setDepth(0)
        .setAlpha(0.42)
        .setTint(0x1a2834);

      this.bgJungle = this.add
        .tileSprite(cx, cy, LAYOUT.WIDTH * 2 + 400, LAYOUT.GAME_H + 40, "bg_selva_run")
        .setDepth(0.5);

      if (this.textures.exists("ph_parallax_ridge")) {
        this.bgParallaxNear = this.add
          .tileSprite(cx, LAYOUT.GAME_TOP + LAYOUT.GAME_H - 52, LAYOUT.WIDTH * 4, 128, "ph_parallax_ridge")
          .setDepth(2)
          .setAlpha(0.82);
      }

      this.zoneTintLayer = this.add
        .rectangle(LAYOUT.WIDTH / 2, LAYOUT.GAME_TOP + LAYOUT.GAME_H / 2, LAYOUT.WIDTH, LAYOUT.GAME_H, ZONE_SCENERY[0].sky, 0.1)
        .setDepth(1)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);
    } else {
      this.add
        .rectangle(LAYOUT.WIDTH / 2, LAYOUT.GAME_TOP + LAYOUT.GAME_H / 2, LAYOUT.WIDTH, LAYOUT.GAME_H, 0x0d1210)
        .setDepth(0);
    }

    this.mistOverlay = this.add
      .rectangle(LAYOUT.WIDTH / 2, LAYOUT.GAME_TOP + LAYOUT.GAME_H / 2, LAYOUT.WIDTH, LAYOUT.GAME_H, 0xc8d8e8, 0)
      .setDepth(12)
      .setScrollFactor(0);

    this.physics.world.setBounds(0, LAYOUT.GAME_TOP, LAYOUT.WIDTH + 320, LAYOUT.GAME_H);
    this.physics.world.gravity.y = 1200;

    this.zoneIndex = 0;
    this.zones = zonesConfig;
    this.vainasCount = 0;
    this.points = 0;
    this.unlockedFacts = new Set();
    this.runActive = true;
    this.lives = START_LIVES;
    this.invulnerableMs = 0;
    this.playerJumps = 0;
    this.playerRunPhase = 0;

    this.runDistance = 0;
    this.winTriggered = false;
    this._obsTimer = null;
    this._itemTimer = null;

    const groundCenterY = GROUND_TOP_Y + 28;
    const ground = this.add.rectangle(LAYOUT.WIDTH / 2, groundCenterY, LAYOUT.WIDTH, 56, 0x2a1a12, 1);
    ground.setDepth(3);
    this.physics.add.existing(ground, true);
    this.groundBodyTop = groundCenterY - 28;

    this.player = this.physics.add.sprite(220, GROUND_TOP_Y - 44, "ph_player");
    this.player.setDepth(9);
    this.player.setScale(1.12);
    this.player.setCollideWorldBounds(true);
    if (this.player.body) {
      const pw = 26;
      const ph = 30;
      this.player.body.setSize(pw, ph);
      this.player.body.setOffset(
        (this.player.displayWidth - pw) / 2,
        this.player.displayHeight - ph - 6,
      );
    }
    this.physics.add.collider(this.player, ground, () => {
      this.playerJumps = 0;
    });

    this.obstacles = this.physics.add.group();
    this.pods = this.physics.add.group();
    this.obstaclePool = this.add.group();
    this.podPool = this.add.group();

    this.physics.add.overlap(this.player, this.pods, (_p, pod) => {
      if (!pod.active || pod.getData("picking")) return;
      pod.setData("picking", true);
      const golden = pod.getData("isGolden");
      const cultural = pod.getData("isCultural");

      if (cultural) {
        this.points += 50;
        const z = this.zones[this.zoneIndex];
        if (z?.zoneFact && !this.unlockedFacts.has(`piece_${z.id}`)) {
          this.unlockedFacts.add(`piece_${z.id}`);
          this.flashHint("Fragmento histórico desbloqueado", z.zoneFact);
          this.flashDatosHud();
        }
      } else {
        this.vainasCount += 1;
        if (golden) {
          this.points += 30;
          const z = this.zones[this.zoneIndex];
          if (z?.zoneFact && !this.unlockedFacts.has(z.id)) {
            this.unlockedFacts.add(z.id);
            this.flashHint("+30 puntos · DATO HISTÓRICO DESBLOQUEADO", z.zoneFact);
            this.flashDatosHud();
          }
        } else {
          this.points += 10;
        }
        this.pulseHudVessel();
      }
      this.updateHud();

      this.tweens.add({
        targets: pod,
        y: pod.y - 70,
        alpha: 0,
        scale: pod.scaleX * 1.15,
        duration: 320,
        ease: "Cubic.easeOut",
        onComplete: () => this.releasePod(pod),
      });
    });

    this.physics.add.overlap(this.player, this.obstacles, (_player, obs) => {
      if (!this.runActive || this.invulnerableMs > 0) return;
      this.releaseObstacle(obs);
      this.lives -= 1;
      this.invulnerableMs = INVULN_MS;
      this.flashHint("", "Cuidado, el camino del cacao no es fácil.");
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
          datos: this.countDatosUnlocked(),
        });
      } else {
        this.updateHud();
      }
    });

    this.scrollSpeed = this.zones[0].scrollSpeed || 280;

    this.hudVesselIcon = this.add
      .image(38, 20, "ph_vessel")
      .setDepth(22)
      .setOrigin(0.5)
      .setScale(0.34);

    this.hudVainas = this.add
      .text(68, 8, "", { fontSize: "14px", color: "#ffdd44", fontStyle: "bold" })
      .setDepth(22);
    this.hudZona = this.add
      .text(LAYOUT.WIDTH / 2, 8, "", {
        fontSize: "13px",
        color: "#f9f2dd",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0)
      .setDepth(22);
    this.hudDatos = this.add
      .text(LAYOUT.WIDTH - 20, 8, "", {
        fontSize: "13px",
        color: "#e8e4dc",
        fontStyle: "bold",
        align: "right",
      })
      .setOrigin(1, 0)
      .setDepth(22);

    this.routeBarY = LAYOUT.GAME_TOP + LAYOUT.GAME_H - 34;
    this.routeNodes = [];
    this.routeProgress = this.add.graphics().setDepth(7);
    this.buildRouteBar();

    this.hintLine = this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.HINT_TOP + 14, "", {
        fontSize: "12px",
        color: "#8a9298",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(22);

    this.bannerText = this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.GAME_TOP + LAYOUT.GAME_H * 0.22, "", {
        fontSize: "15px",
        color: "#fff8e8",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 920 },
        backgroundColor: "#00000088",
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(18);

    const jumpY = LAYOUT.CONTROLS_TOP + Math.min(72, LAYOUT.CONTROLS_H_ACTUAL * 0.35);
    const jumpBtn = this.add
      .rectangle(LAYOUT.WIDTH - 96, jumpY, 168, 54, 0x2563a8, 1)
      .setStrokeStyle(2, 0x8ec5ff)
      .setDepth(24)
      .setInteractive({ useHandCursor: true });
    const jumpLabel = this.add
      .text(jumpBtn.x, jumpBtn.y, "SALTAR", {
        fontSize: "14px",
        color: "#f0f8ff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(25);
    jumpBtn.on("pointerdown", () => this.doJump());
    const showMobileJump = !this.sys.game.device.os.desktop;
    jumpBtn.setVisible(showMobileJump);
    jumpBtn.setActive(showMobileJump);
    jumpLabel.setVisible(showMobileJump);
    if (!showMobileJump) jumpBtn.disableInteractive();

    this.space = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyUp = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

    this.input.on("pointerdown", (p) => {
      if (p.y >= LAYOUT.GAME_TOP && p.y < LAYOUT.HINT_TOP) {
        this.doJump();
      }
    });

    this.add
      .text(LAYOUT.WIDTH - 24, 38, "[ VOLVER AL MAPA ]", { fontSize: "11px", color: "#c8921a" })
      .setOrigin(1, 0)
      .setDepth(22)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => exitToMainMap());

    this.applyZoneVisuals();
    this.flashBanner(this.zones[0].bannerText);
    this.scheduleMistIfPalanda();
    this.updateHud();
    this.updateRouteBar();

    this.time.addEvent({
      delay: 9000,
      loop: true,
      callback: () => this.scheduleMistIfPalanda(),
    });

    this.refreshSpawnTimers();
    this.time.delayedCall(120, () => this.spawnInitialWave());
  }

  refreshSpawnTimers() {
    if (this._obsTimer) {
      this._obsTimer.remove(false);
      this._obsTimer = null;
    }
    if (this._itemTimer) {
      this._itemTimer.remove(false);
      this._itemTimer = null;
    }
    if (!this.runActive) return;
    const spd = Math.max(200, this.scrollSpeed || 280);
    const obsMs = Math.max(280, Math.round((MIN_OBSTACLE_GAP / spd) * 1000));
    const itemMs = Math.max(
      320,
      Math.round((((ITEM_GAP_MIN + ITEM_GAP_MAX) / 2) / spd) * 1000),
    );
    this._obsTimer = this.time.addEvent({
      delay: obsMs,
      loop: true,
      callback: () => {
        if (!this.runActive) return;
        this.spawnObstacle(GROUND_TOP_Y + 28);
      },
    });
    this._itemTimer = this.time.addEvent({
      delay: itemMs,
      loop: true,
      callback: () => {
        if (!this.runActive) return;
        this.spawnCollectible(GROUND_TOP_Y + 28);
      },
    });
  }

  spawnInitialWave() {
    if (!this.runActive) return;
    const gy = GROUND_TOP_Y + 28;
    this.spawnObstacle(gy);
    this.spawnCollectible(gy);
    this.time.delayedCall(280, () => {
      if (!this.runActive) return;
      this.spawnObstacle(gy);
    });
    this.time.delayedCall(400, () => {
      if (!this.runActive) return;
      this.spawnCollectible(gy);
    });
    this.time.delayedCall(520, () => {
      if (!this.runActive) return;
      this.spawnObstacle(gy);
    });
  }

  countDatosUnlocked() {
    let n = 0;
    for (const z of this.zones) {
      if (this.unlockedFacts.has(z.id) || this.unlockedFacts.has(`piece_${z.id}`)) {
        n += 1;
      }
    }
    return n;
  }

  flashDatosHud() {
    this.tweens.add({
      targets: this.hudDatos,
      scale: { from: 1.12, to: 1 },
      duration: 200,
    });
  }

  scheduleMistIfPalanda() {
    if (!this.runActive || this.zoneIndex !== 0) return;
    this.time.delayedCall(Phaser.Math.Between(400, 1200), () => {
      if (!this.runActive || this.zoneIndex !== 0) return;
      this.tweens.add({
        targets: this.mistOverlay,
        alpha: { from: 0, to: 0.72 },
        duration: 220,
        yoyo: true,
        hold: 260,
        onComplete: () => {
          this.mistOverlay.setAlpha(0);
        },
      });
    });
  }

  applyZoneVisuals() {
    const ji = Math.min(this.zoneIndex, ZONE_SCENERY.length - 1);
    const sc = ZONE_SCENERY[ji];
    const jungleTints = [0xb8d4b8, 0xa8c0e0, 0x98d8b0, 0xe8d0a0, 0xa8b8e8];
    if (this.bgParallaxFar) {
      const tf = [0x152018, 0x1a2430, 0x142820, 0x281a10, 0x101828];
      this.bgParallaxFar.setTint(tf[ji] ?? 0x1a2834);
    }
    if (this.bgJungle) {
      this.bgJungle.setTint(jungleTints[ji] ?? 0xb8c8b8);
    }
    if (this.bgParallaxNear) {
      const ridgeTint = [0x1a2820, 0x202830, 0x182818, 0x281810, 0x101820];
      this.bgParallaxNear.setTint(ridgeTint[ji] ?? 0xffffff);
    }
    if (this.zoneTintLayer) {
      this.zoneTintLayer.setFillStyle(sc.sky, 0.1);
    }
  }

  buildRouteBar() {
    const labels = ["PALANDA", "ANDES", "COL./PAN.", "MESOAMÉR.", "EUROPA"];
    const totalW = Math.min(720, LAYOUT.WIDTH - 80);
    const startX = (LAYOUT.WIDTH - totalW) / 2;
    this.add.rectangle(LAYOUT.WIDTH / 2, this.routeBarY, totalW + 24, 5, 0x2a3238, 1).setOrigin(0.5).setDepth(6);
    const step = totalW / (labels.length - 1);
    this.routeStepPx = step;
    this.routeStartX = startX;
    for (let i = 0; i < labels.length; i += 1) {
      const x = startX + i * step;
      const dot = this.add.circle(x, this.routeBarY, 9, 0x2a2824, 1).setStrokeStyle(2, 0x5a6050).setDepth(6);
      const lbl = this.add
        .text(x, this.routeBarY + 20, labels[i], { fontSize: "8px", color: "#9a9a88" })
        .setOrigin(0.5)
        .setDepth(6);
      this.routeNodes.push({ dot, lbl, x });
    }
  }

  updateRouteBar() {
    const pro = Phaser.Math.Clamp(this.runDistance / (5 * DIST_PER_ZONE), 0, 1);
    this.routeProgress.clear();
    const totalW = this.routeStepPx * (this.routeNodes.length - 1);
    const ax0 = this.routeStartX;
    const ax1 = ax0 + totalW * pro;
    this.routeProgress.fillStyle(0x3a7dbc, 0.95);
    this.routeProgress.fillRect(ax0, this.routeBarY - 2, Math.max(4, ax1 - ax0), 4);

    this.routeNodes.forEach((n, i) => {
      const active = i <= this.zoneIndex;
      const current = i === this.zoneIndex;
      n.dot.setFillStyle(current ? 0xffcc33 : active ? 0x4a8c5c : 0x2a2824);
      n.dot.setStrokeStyle(2, current ? 0xfff0aa : active ? 0x6cfc9a : 0x4a4035);
      n.lbl.setColor(current ? "#ffcc66" : active ? "#a8d8c0" : "#6a6a58");
    });
  }

  drawChrome() {
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x1a1a2e).setOrigin(0);
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HUD_TOP_H, 0x101820, 0.96).setOrigin(0).setDepth(15);
    this.add.rectangle(0, LAYOUT.HINT_TOP, LAYOUT.WIDTH, LAYOUT.HINT_BAR_H, 0x151820, 0.92).setOrigin(0).setDepth(15);
    this.add.rectangle(0, LAYOUT.CONTROLS_TOP, LAYOUT.WIDTH, LAYOUT.CONTROLS_H_ACTUAL, 0x0a0e12, 0.94).setOrigin(0).setDepth(15);
    this.add
      .text(24, LAYOUT.CONTROLS_TOP + 14, "ESPACIO / ↑ / TAP · DOBLE SALTO en el aire · Vasija +10 · Dorada +30 + dato · Pieza +50 · Ruta completa +200", {
        fontSize: "10px",
        color: "#6a7580",
      })
      .setOrigin(0, 0)
      .setDepth(15);
    this.add
      .text(
        LAYOUT.WIDTH / 2,
        LAYOUT.CONTROLS_TOP + 52,
        "TIP: vasijas doradas y piezas culturales desbloquean datos históricos · Recoge y evita rocas",
        { fontSize: "10px", color: "#555c64", align: "center" },
      )
      .setOrigin(0.5)
      .setDepth(15);
  }

  doJump() {
    if (!this.runActive) return;
    const b = this.player.body;
    if (b.touching.down || (this.playerJumps > 0 && this.playerJumps < MAX_AIR_JUMPS)) {
      if (b.touching.down) {
        this.playerJumps = 0;
      }
      this.player.setVelocityY(-620);
      this.playerJumps += 1;
    }
  }

  flashHint(title, sub) {
    if (title) {
      this.hintLine.setText(`${title}\n${sub}`);
    } else {
      this.hintLine.setText(sub);
    }
    this.time.delayedCall(2800, () => {
      this.hintLine.setText(
        "El escenario avanza solo — ESPACIO / ↑ / toca la pista: salta; segundo toque en el aire = doble salto · Recoge vasijas y evita rocas.",
      );
    });
  }

  flashBanner(text) {
    if (!text) return;
    this.bannerText.setText(text);
    this.tweens.killTweensOf(this.bannerText);
    this.bannerText.setAlpha(0);
    this.tweens.add({
      targets: this.bannerText,
      alpha: 1,
      duration: 320,
      yoyo: true,
      hold: 2000,
      onComplete: () => {
        this.bannerText.setAlpha(0);
      },
    });
  }

  tryAdvanceZoneFromDistance() {
    const targetZone = Math.min(4, Math.floor(this.runDistance / DIST_PER_ZONE));
    let advancedZone = false;
    while (this.zoneIndex < targetZone) {
      this.zoneIndex += 1;
      const z = this.zones[this.zoneIndex];
      this.scrollSpeed = z.scrollSpeed;
      this.applyZoneVisuals();
      this.flashBanner(z.bannerText);
      advancedZone = true;
    }
    if (advancedZone) {
      this.refreshSpawnTimers();
    }
    if (this.zoneIndex === 4 && this.runDistance >= 5 * DIST_PER_ZONE && !this.winTriggered) {
      this.winTriggered = true;
      this.runActive = false;
      this.points += 200;
      this.scene.start("ResultScene", {
        game: "runner",
        score: this.points,
        vainas: this.vainasCount,
        datos: this.countDatosUnlocked(),
        allZones: true,
      });
    }
  }

  spawnObstacle(groundCenterY) {
    const x = LAYOUT.WIDTH + 50;
    const typeRoll = Math.random();
    let y = groundCenterY - 36;
    let scaleY = 1;
    if (typeRoll > 0.68) {
      y = groundCenterY - 54;
      scaleY = 1.18;
    } else if (typeRoll > 0.38) {
      y = groundCenterY - 44;
      scaleY = 1.08;
    }
    const o = this.obtainObstacle();
    o.setPosition(x, y);
    o.setDepth(8);
    o.setScale(1, scaleY);
    o.setVelocity(0, 0);
    const bw = 48;
    const bh = Math.round(30 * scaleY);
    o.body.setSize(bw, bh);
    o.body.setOffset((o.displayWidth - bw) / 2, (o.displayHeight - bh) * 0.55);
    o.body.updateFromGameObject();
  }

  spawnCollectible(groundCenterY) {
    const x = LAYOUT.WIDTH + 46;
    const zid = this.zones[this.zoneIndex]?.id;
    const zoneOrder = this.zones[this.zoneIndex]?.order ?? this.zoneIndex;
    const canCultural = zoneOrder >= 2 && Math.random() < 0.09;
    const hasPiece = zid && this.unlockedFacts.has(`piece_${zid}`);

    const isCultural = canCultural && !hasPiece;
    const isGold = !isCultural && Math.random() < 0.125;
    const yJitter = Phaser.Math.Between(-8, -52);

    const fitVesselBody = (p) => {
      if (!p.body) return;
      const pw = 30;
      const ph = 34;
      p.body.setSize(pw, ph);
      p.body.setOffset((p.displayWidth - pw) / 2, (p.displayHeight - ph) * 0.55);
      p.body.updateFromGameObject();
    };

    const p = this.obtainPod();
    p.setPosition(x, groundCenterY + yJitter);
    p.setDepth(8);
    p.setVelocity(0, 0);

    if (isCultural) {
      p.setTexture("ph_vessel");
      p.clearTint();
      p.setTint(0xaa77dd);
      p.setScale(0.72);
      p.setData("isGolden", false);
      p.setData("isCultural", true);
    } else {
      const key = isGold ? "ph_vessel_gold" : "ph_vessel";
      p.setTexture(key);
      p.clearTint();
      p.setScale(isGold ? 0.7 : 0.68);
      p.setData("isGolden", isGold);
      p.setData("isCultural", false);
    }
    fitVesselBody(p);
  }

  heartsLine() {
    return "♥".repeat(Math.max(0, this.lives)) + "♡".repeat(Math.max(0, START_LIVES - this.lives));
  }

  updateHud() {
    const z = this.zones[this.zoneIndex];
    const datosN = this.countDatosUnlocked();
    this.hudVainas.setText(`VASIJAS: ${this.vainasCount.toString().padStart(2, "0")}`);
    this.hudZona.setText(`ZONA: ${z.name.toUpperCase()}`);
    this.hudDatos.setText(`DATOS: ${datosN} / 5 desbloqueados\n${this.heartsLine()}`);
    if (this.hudVesselIcon && !this.tweens.isTweening(this.hudVesselIcon)) {
      this.hudVesselIcon.setScale(this.hudVesselScaleForCount());
    }
    this.hintLine.setText(
      "El escenario avanza solo — ESPACIO / ↑ / toca la pista: salta; segundo toque en el aire = doble salto · Recoge vasijas y evita rocas.",
    );
  }

  update(_t, dt) {
    if (!this.runActive) return;

    const delta = typeof dt === "number" && dt > 0 ? dt : 16.67;

    if (this.invulnerableMs > 0) {
      this.invulnerableMs -= delta;
    }

    const ds = (this.scrollSpeed * delta) / 1000;
    this.runDistance += ds;

    if (this.bgParallaxFar) {
      this.bgParallaxFar.tilePositionX += ds * 0.09;
    }
    if (this.bgJungle) {
      this.bgJungle.tilePositionX += ds * 0.24;
    }
    if (this.bgParallaxNear) {
      this.bgParallaxNear.tilePositionX += ds * 0.48;
    }

    if (this.player.body.touching.down && this.invulnerableMs <= 0) {
      this.playerRunPhase += delta * 0.014;
      const bob = Math.sin(this.playerRunPhase) * 0.04;
      this.player.setScale(1.12 + bob);
    } else if (this.invulnerableMs <= 0) {
      this.player.setScale(1.12);
    }

    this.tryAdvanceZoneFromDistance();
    this.updateRouteBar();

    this.obstacles.getChildren().forEach((o) => {
      if (!o.active) return;
      o.x -= ds;
      if (o.body) o.body.updateFromGameObject();
      if (o.x < -60) this.releaseObstacle(o);
    });
    this.pods.getChildren().forEach((o) => {
      if (!o.active) return;
      o.x -= ds;
      if (o.body) o.body.updateFromGameObject();
      if (o.x < -60) this.releasePod(o);
    });

    if (Phaser.Input.Keyboard.JustDown(this.space) || Phaser.Input.Keyboard.JustDown(this.keyUp)) {
      this.doJump();
    }
  }
}
