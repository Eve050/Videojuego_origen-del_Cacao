import Phaser from "phaser";
import { LAYOUT } from "../layout.js";
import Player from "../entities/Player.js";
import { exitToMainMap } from "../data/introCopy.js";
import { completeMissionByNumber } from "../../modules/gameState.js";
import { duckAmbientAudio } from "../../modules/audioManager.js";

/** Doc §2.7 — prompt exacto */
const TXT_PROMPT = "¡Objeto arqueológico encontrado! Presiona [E] o toca para examinar";

const WORLD_W = 1920;
/** Radio exterior de la plaza hundida (más grande que el boceto inicial). */
const PLAZA_OUTER_R = 338;
/** Radio mínimo del anillo de empedrado / tierra clara. */
const PLAZA_INNER_R = 48;
/** Distancia al centro de las casas con colisión (anillo habitacional). */
const HOUSE_RING_R = PLAZA_OUTER_R - 76;
/** Área de juego documentada */
const AREA_LABEL = "PLAZA CIRCULAR HUNDIDA";
const GAME1_LEVELS = 1;
const LEVEL_ITEMS_TOTAL = 3;

/**
 * Minijuego 1 — El Origen del Cacao (doc §2.x).
 * Mapa amplio, cámara, colisiones, minimapa, joystick/action en móvil,
 * examen solo con [E] / botón ACCIÓN / toque sobre objeto en radio.
 */
export default class Game1Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Game1Scene" });
  }

  onGame1DomKey(ev, isDown) {
    const el = ev.target;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
    const byCode = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      KeyW: "up",
      KeyS: "down",
      KeyA: "left",
      KeyD: "right",
      KeyE: "action",
      Enter: "result",
    };
    const byKey = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      W: "up",
      s: "down",
      S: "down",
      a: "left",
      A: "left",
      d: "right",
      D: "right",
      e: "action",
      E: "action",
      Enter: "result",
    };
    const slot = byCode[ev.code] ?? byKey[ev.key];
    if (!slot || !this._domGame1) return;
    ev.preventDefault();
    if (isDown) this.ensureSfxUnlocked();
    this._domGame1[slot] = isDown;
  }

  readGame1Steer() {
    const d = this._domGame1;
    const m = this.game1Keys;
    const t = this.touchGame1;
    const ex = this.externalTouchpadState;
    const tHasDirection = !!(t && (t.left || t.right || t.up || t.down));
    const exHasDirection = !!(ex && (ex.left || ex.right || ex.up || ex.down));
    let vx = 0;
    let vy = 0;
    const j = this.player?.stickVector;
    if (j && (j.x !== 0 || j.y !== 0)) {
      vx = j.x;
      vy = j.y;
      const len = Math.hypot(vx, vy) || 1;
      if (len > 1) {
        vx /= len;
        vy /= len;
      }
    } else if (exHasDirection) {
      if (ex.left) vx = -1;
      else if (ex.right) vx = 1;
      if (ex.up) vy = -1;
      else if (ex.down) vy = 1;
    } else if (tHasDirection) {
      if (t.left) vx = -1;
      else if (t.right) vx = 1;
      if (t.up) vy = -1;
      else if (t.down) vy = 1;
    } else if (d) {
      if (d.left || m?.left?.isDown || m?.a?.isDown) vx = -1;
      else if (d.right || m?.right?.isDown || m?.d?.isDown) vx = 1;
      if (d.up || m?.up?.isDown || m?.w?.isDown) vy = -1;
      else if (d.down || m?.down?.isDown || m?.s?.isDown) vy = 1;
    } else if (m) {
      if (m.left.isDown || m.a.isDown) vx = -1;
      else if (m.right.isDown || m.d.isDown) vx = 1;
      if (m.up.isDown || m.w.isDown) vy = -1;
      else if (m.down.isDown || m.s.isDown) vy = 1;
    } else {
      const cu = this.player?.cursors;
      const w = this.player?.wasd;
      if (cu?.left.isDown || w?.A.isDown) vx = -1;
      else if (cu?.right.isDown || w?.D.isDown) vx = 1;
      if (cu?.up.isDown || w?.W.isDown) vy = -1;
      else if (cu?.down.isDown || w?.S.isDown) vy = 1;
    }
    if (vx !== 0 && vy !== 0) {
      const n = 1 / Math.SQRT2;
      vx *= n;
      vy *= n;
    }
    return { vx, vy };
  }

  ensureSfxUnlocked() {
    const ctx = this.sound?.context;
    if (!ctx) return;
    if (ctx.state === "suspended" && typeof ctx.resume === "function") {
      ctx.resume().catch(() => {});
    }
  }

  playClippedSfx(key, volume = 0.5, maxMs = 2000) {
    this.ensureSfxUnlocked();
    if (!this.cache.audio.exists(key)) return;
    const s = this.sound.add(key);
    s.play({ volume });
    this.time.delayedCall(maxMs, () => {
      if (s.isPlaying) s.stop();
      s.destroy();
    });
  }

  preload() {
    this.load.tilemapTiledJSON("game1_plaza", "/assets/tilemaps/game1-plaza.json");
    this.load.audio("sfx_relic", "/assets/audio/reliquia-encontrada.mp3");
  }

  create() {
    this.registry.set("game1Score", 0);
    this.pendingCollectible = null;
    this.finishedAutoTransition = false;
    this.levelTransitionActive = false;
    this.levelTransitionUi = null;
    this.levelCollectibleDecor = [];
    this.currentLevel = 1;
    this.levelTotals = { 1: LEVEL_ITEMS_TOTAL };
    this.joystickActive = false;
    this.stickCx = 0;
    this.stickCy = 0;
    this.stickR = 60;
    this.touchGame1 = { up: false, down: false, left: false, right: false };
    this.externalTouchpadState =
      this.registry.get("externalTouchpad") === true && typeof window !== "undefined"
        ? window.__enigmaTouchpadState || null
        : null;
    this.externalActionPrev = false;

    this.events.off("quiz-finished");
    this.events.on("quiz-finished", (data) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("enigma-quiz-visibility", {
            detail: { visible: false },
          }),
        );
      }
      const item = this.pendingCollectible;
      this.pendingCollectible = null;
      if (item && item.active) {
        if (data.correct || data.exhausted) {
          this.playClippedSfx("sfx_relic", 0.46, 2000);
          item.destroy();
        } else {
          item.setData("quizBusy", false);
          item.setData("overlapLock", true);
        }
      }
    });

    this.drawChrome();

    this.physics.world.setBounds(0, LAYOUT.GAME_TOP, WORLD_W, LAYOUT.GAME_H);

    this.collisionTileLayer = null;
    this.buildTilemapFromTiled();
    this.buildScenery();
    this.buildObstacles();

    const startX = 960;
    const startY = LAYOUT.GAME_TOP + LAYOUT.GAME_H / 2 + 20;
    this.player = new Player(this, startX, startY);
    this.player.setTexture("ph_player");
    this.player.setDepth(8);
    this.player.setScale(1.48);
    if (this.player.body) {
      this.player.body.setSize(33, 35, true);
    }

    this.physics.add.collider(this.player, this.obstacles);
    if (this.collisionTileLayer) {
      this.physics.add.collider(this.player, this.collisionTileLayer);
    }

    this.collectibles = this.add.group();
    this.buildCollectibles();

    this.cameras.main.setBounds(0, LAYOUT.GAME_TOP, WORLD_W, LAYOUT.GAME_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);
    this.cameras.main.setBackgroundColor(0x1a2e22);

    this.setupHudAndMinimap();
    this.setupTouchControls();

    const kb = this.input.keyboard;
    if (kb) kb.enabled = true;
    this.game1Keys =
      kb?.addKeys(
        {
          up: Phaser.Input.Keyboard.KeyCodes.UP,
          down: Phaser.Input.Keyboard.KeyCodes.DOWN,
          left: Phaser.Input.Keyboard.KeyCodes.LEFT,
          right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
          w: Phaser.Input.Keyboard.KeyCodes.W,
          a: Phaser.Input.Keyboard.KeyCodes.A,
          s: Phaser.Input.Keyboard.KeyCodes.S,
          d: Phaser.Input.Keyboard.KeyCodes.D,
          e: Phaser.Input.Keyboard.KeyCodes.E,
          enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
        },
        true,
        true,
      ) ?? null;
    this.keyE = this.game1Keys?.e ?? this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this._domGame1 = { up: false, down: false, left: false, right: false, action: false, result: false };
    this._domActionPrev = false;
    this._domResultPrev = false;
    this._domKeyDown = (ev) => this.onGame1DomKey(ev, true);
    this._domKeyUp = (ev) => this.onGame1DomKey(ev, false);
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this._domKeyDown, { capture: true });
      window.addEventListener("keyup", this._domKeyUp, { capture: true });
    }
    if (this.game?.canvas) {
      this.game.canvas.setAttribute("tabindex", "0");
      this.game.canvas.style.outline = "none";
    }
    this.input.on("pointerdown", () => {
      this.ensureSfxUnlocked();
      if (this.input.keyboard && !this.input.keyboard.enabled) this.input.keyboard.enabled = true;
      const canvas = this.game?.canvas;
      if (canvas && typeof canvas.focus === "function") {
        try {
          canvas.focus({ preventScroll: true });
        } catch {
          canvas.focus();
        }
      }
    });

    this.add
      .text(18, 40, "VOLVER AL MAPA", {
        fontSize: "11px",
        color: "#c8921a",
        fontStyle: "bold",
        fontFamily: "Segoe UI, Tahoma, sans-serif",
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => exitToMainMap());

    this.hint = this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.HINT_TOP + 20, "", {
        fontSize: "13px",
        color: "#dddddd",
        align: "center",
        wordWrap: { width: 1050 },
        fontFamily: "Segoe UI, Tahoma, sans-serif",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(115);

    this.resultPrompt = this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.CONTROLS_TOP + 22, "", {
        fontSize: "14px",
        color: "#c8921a",
        align: "center",
        fontStyle: "bold",
        wordWrap: { width: 900 },
        fontFamily: "Segoe UI, Tahoma, sans-serif",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(115)
      .setInteractive({ useHandCursor: true });

    this.resultPrompt.on("pointerdown", () => this.tryShowResults());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (typeof window !== "undefined" && this._domKeyDown) {
        window.removeEventListener("keydown", this._domKeyDown, { capture: true });
        window.removeEventListener("keyup", this._domKeyUp, { capture: true });
      }
      this._domKeyDown = null;
      this._domKeyUp = null;
    });
  }

  drawChrome() {
    /**
     * Solo bandas HUD / pista / controles (scrollFactor 0). Nunca tapar la zona de juego (60–540):
     * un rectángulo a pantalla completa por encima del mundo dejaba el mapa en negro.
     */
    const z = 40;
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HUD_TOP_H, 0x101820, 0.96).setOrigin(0).setScrollFactor(0).setDepth(z + 1);
    this.add.rectangle(0, LAYOUT.HINT_TOP, LAYOUT.WIDTH, LAYOUT.HINT_BAR_H, 0x151820, 0.94).setOrigin(0).setScrollFactor(0).setDepth(z + 1);
    this.add.rectangle(0, LAYOUT.CONTROLS_TOP, LAYOUT.WIDTH, LAYOUT.CONTROLS_H_ACTUAL, 0x0a0e12, 0.94).setOrigin(0).setScrollFactor(0).setDepth(z + 1);

    this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.CONTROLS_TOP + 96, "Presiona [E] o toca ACCIÓN para examinar los objetos · CONTROLES TÁCTILES (solo en móvil)", {
        fontSize: "10px",
        color: "#5a6068",
        fontFamily: "Segoe UI, Tahoma, sans-serif",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(z + 2);
  }

  /**
   * Suelo y bordes desde Tiled (export game1-plaza.json, tileset name game1_tiles).
   * Textura ph_g1_tileset se genera en BootScene; al editar en Tiled añade game1-tiles.png de 160×32 (opcional).
   */
  buildTilemapFromTiled() {
    if (!this.textures.exists("ph_g1_tileset")) return;
    const map = this.make.tilemap({ key: "game1_plaza" });
    const tileset = map.addTilesetImage("game1_tiles", "ph_g1_tileset");
    if (!tileset) return;
    const ground = map.createLayer("Ground", tileset, 0, LAYOUT.GAME_TOP);
    if (ground) {
      ground.setDepth(-4.8);
      ground.setAlpha(0.94);
    }
    const coll = map.createLayer("Collision", tileset, 0, LAYOUT.GAME_TOP);
    if (coll) {
      coll.setDepth(-4.7);
      coll.setAlpha(0);
      coll.setCollision([5]);
      this.collisionTileLayer = coll;
    }
  }

  buildScenery() {
    const midY = LAYOUT.GAME_TOP + LAYOUT.GAME_H / 2;
    const cx = 960;
    const cy = midY;

    if (this.textures.exists("bg_selva_run")) {
      this.atmosphereTile = this.add
        .tileSprite(WORLD_W / 2, midY, WORLD_W + 240, LAYOUT.GAME_H + 100, "bg_selva_run")
        .setDepth(-6)
        .setTint(0x5a7a68)
        .setAlpha(0.38)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);
    }

    this.add
      .rectangle(WORLD_W / 2, midY, WORLD_W + 180, LAYOUT.GAME_H + 100, 0x152820, 1)
      .setDepth(-5);

    const grad = [
      0x101810, 0x141c14, 0x18241c, 0x1e2c22, 0x24362a, 0x2c4234, 0x34503e, 0x3d5c48,
      0x4a6a54, 0x587a60, 0x688c6c, 0x789e78, 0x8cb084, 0x9ec090, 0xb0d09c,
    ];
    const steps = 14;
    const radii = [];
    for (let i = 0; i <= steps; i += 1) {
      radii.push(
        Math.round(PLAZA_OUTER_R - ((PLAZA_OUTER_R - PLAZA_INNER_R) * i) / steps),
      );
    }
    const plaza = this.add.graphics().setDepth(1);
    for (let i = 0; i < radii.length; i += 1) {
      plaza.fillStyle(grad[Math.min(i, grad.length - 1)], 1);
      plaza.fillCircle(cx, cy, radii[i]);
    }

    plaza.lineStyle(2, 0xe8c878, 0.5);
    plaza.strokeCircle(cx, cy, PLAZA_OUTER_R - 18);
    plaza.lineStyle(3, 0x8a6020, 0.35);
    plaza.strokeCircle(cx, cy, PLAZA_OUTER_R - 42);
    plaza.lineStyle(1, 0x4a3020, 0.45);
    plaza.strokeCircle(cx, cy, PLAZA_OUTER_R - 92);

    const cobInner = PLAZA_INNER_R + 20;
    const cobOuter = PLAZA_OUTER_R - 10;
    const cob = this.add.graphics().setDepth(1);
    for (let i = 0; i < 145; i += 1) {
      const ang = Math.random() * Math.PI * 2;
      const rad = cobInner + Math.sqrt(Math.random()) * (cobOuter - cobInner);
      const px = cx + Math.cos(ang) * rad;
      const py = cy + Math.sin(ang) * rad;
      cob.fillStyle(Phaser.Math.RND.pick([0x3a4830, 0x4a5840, 0x5a6850]), Phaser.Math.FloatBetween(0.2, 0.45));
      cob.fillEllipse(px, py, Phaser.Math.Between(3, 8), Phaser.Math.Between(2, 6));
    }

    const glow = this.add.graphics().setDepth(1);
    for (let i = 10; i >= 1; i -= 1) {
      glow.fillStyle(0xfff8d0, 0.018 + (11 - i) * 0.016);
      glow.fillCircle(cx, cy - 10, 12 + i * 9);
    }

    this.add
      .text(cx, cy + 6, "Plaza circular ceremonial  ·  ~40 m", {
        fontSize: "13px",
        color: "#c4b898",
        fontFamily: "Georgia, 'Palatino Linotype', serif",
        fontStyle: "italic",
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setAlpha(0.48);

    const bushAt = (bx, by, sc) => {
      const g = this.add.graphics().setDepth(1);
      const cols = [0x1a4828, 0x246038, 0x2e7844];
      for (let k = 0; k < 7; k += 1) {
        g.fillStyle(Phaser.Math.RND.pick(cols), Phaser.Math.FloatBetween(0.75, 1));
        const ox = Phaser.Math.Between(-12, 12) * sc;
        const oy = Phaser.Math.Between(-7, 7) * sc;
        g.fillEllipse(bx + ox, by + oy, (16 + Phaser.Math.Between(0, 10)) * sc, (11 + Phaser.Math.Between(0, 8)) * sc);
      }
    };

    const grassTuftAt = (bx, by, sc = 1) => {
      const g = this.add.graphics().setDepth(1);
      const greens = [0x2a6040, 0x348050, 0x1e4830, 0x3a7050];
      for (let i = 0; i < 8; i += 1) {
        const t = (i / 7 - 0.5) * 1.1;
        g.fillStyle(Phaser.Math.RND.pick(greens), 1);
        g.beginPath();
        g.moveTo(bx, by + 5 * sc);
        g.lineTo(bx + Math.sin(t) * 4 * sc, by - (11 + i * 0.4) * sc);
        g.lineTo(bx + Math.sin(t + 0.18) * 4 * sc, by + 5 * sc);
        g.closePath();
        g.fillPath();
      }
    };

    const fernAt = (bx, by, sc = 1) => {
      const g = this.add.graphics().setDepth(1);
      for (let frond = 0; frond < 6; frond += 1) {
        const ang = -Math.PI / 2 + (frond - 2.5) * 0.32;
        const len = (20 + Phaser.Math.Between(0, 8)) * sc;
        g.fillStyle(Phaser.Math.RND.pick([0x246038, 0x2e8850, 0x1a5830]), 0.92);
        g.fillEllipse(
          bx + Math.cos(ang) * len * 0.48,
          by + Math.sin(ang) * len * 0.48,
          9 * sc,
          len * 0.52,
        );
      }
    };

    const flowerClusterAt = (bx, by, sc = 1) => {
      const g = this.add.graphics().setDepth(1);
      for (let p = 0; p < 6; p += 1) {
        const a = (p / 6) * Math.PI * 2;
        g.fillStyle(Phaser.Math.RND.pick([0xc87098, 0xffc860, 0xe89840, 0xf0e8a0]), 0.92);
        g.fillCircle(bx + Math.cos(a) * 5.5 * sc, by + Math.sin(a) * 5.5 * sc, 3.2 * sc);
      }
      g.fillStyle(0xfff8c8, 1);
      g.fillCircle(bx, by, 2.6 * sc);
    };

    const palmAt = (bx, by, sc = 1) => {
      const g = this.add.graphics().setDepth(1);
      g.fillStyle(0x4a3020, 1);
      g.fillRoundedRect(bx - 2 * sc, by - 6 * sc, 4 * sc, 20 * sc, 2);
      const fr = [0x2a6040, 0x348858, 0x2a7850];
      for (let u = 0; u < 5; u += 1) {
        const a = -Math.PI / 2 + (u - 2) * 0.35;
        g.fillStyle(Phaser.Math.RND.pick(fr), 0.95);
        g.fillEllipse(
          bx + Math.cos(a) * 14 * sc,
          by - 8 * sc + Math.sin(a) * 7 * sc,
          22 * sc,
          10 * sc,
        );
      }
    };

    const broadleafAt = (bx, by, sc = 1) => {
      const g = this.add.graphics().setDepth(1);
      g.fillStyle(0x1a4830, 1);
      g.fillEllipse(bx, by + 2 * sc, 28 * sc, 14 * sc);
      g.fillStyle(0x2a7050, 0.92);
      g.fillEllipse(bx - 10 * sc, by - 4 * sc, 13 * sc, 19 * sc);
      g.fillEllipse(bx + 11 * sc, by - 2 * sc, 12 * sc, 16 * sc);
      g.fillStyle(0x3a8860, 0.5);
      g.fillEllipse(bx + 2 * sc, by - 8 * sc, 17 * sc, 9 * sc);
    };

    const reedClusterAt = (bx, by, sc = 1) => {
      const g = this.add.graphics().setDepth(1);
      const cols = [0x3a5848, 0x2a4838, 0x4a6860];
      for (let i = -3; i <= 3; i += 1) {
        g.lineStyle(Phaser.Math.Between(2, 3), Phaser.Math.RND.pick(cols), 0.9);
        g.beginPath();
        const ox = i * 2.2 * sc;
        const sway = i * 0.35 * sc;
        g.moveTo(bx + ox, by + 10 * sc);
        g.lineTo(bx + ox + sway, by - (15 + Math.abs(i)) * sc);
        g.strokePath();
      }
    };

    const bambooClumpAt = (bx, by, sc = 1) => {
      const g = this.add.graphics().setDepth(1);
      for (let j = 0; j < 6; j += 1) {
        const ox = (j - 2.5) * 2.8 * sc;
        g.fillStyle(Phaser.Math.RND.pick([0x3a5040, 0x2e4030]), 1);
        g.fillRoundedRect(bx + ox - 1.2 * sc, by - (20 + j * 0.35) * sc, 2.8 * sc, 28 * sc, 2);
        g.fillStyle(0x4a9060, 0.33);
        g.fillEllipse(bx + ox, by - 22 * sc, 8 * sc, 4 * sc);
      }
    };

    const vineTangleAt = (bx, by, sc = 1) => {
      const g = this.add.graphics().setDepth(1);
      g.lineStyle(2, 0x2a5038, 0.85);
      g.beginPath();
      g.moveTo(bx - 8 * sc, by + 6 * sc);
      g.lineTo(bx - 2 * sc, by - 2 * sc);
      g.lineTo(bx + 6 * sc, by + 4 * sc);
      g.lineTo(bx + 10 * sc, by - 6 * sc);
      g.strokePath();
      g.fillStyle(0x348050, 0.7);
      for (let v = 0; v < 4; v += 1) {
        g.fillCircle(bx + (v - 1.5) * 5 * sc, by - v * 2 * sc, 3.2 * sc);
      }
    };

    const scatterFloraWild = (avoidFn) => {
      for (let n = 0; n < 95; n += 1) {
        const x = Phaser.Math.Between(55, WORLD_W - 55);
        const y = Phaser.Math.Between(LAYOUT.GAME_TOP + 18, LAYOUT.GAME_TOP + LAYOUT.GAME_H - 18);
        const d = Math.hypot(x - cx, y - cy);
        if (d < PLAZA_OUTER_R + 5) continue;
        if (avoidFn && avoidFn(x, y)) continue;
        const sc = Phaser.Math.FloatBetween(0.65, 1.22);
        const pick = Phaser.Math.Between(0, 99);
        if (pick < 16) grassTuftAt(x, y, sc);
        else if (pick < 31) bushAt(x, y, sc);
        else if (pick < 45) fernAt(x, y, sc);
        else if (pick < 56) flowerClusterAt(x, y, sc);
        else if (pick < 66) palmAt(x, y, sc);
        else if (pick < 76) broadleafAt(x, y, sc);
        else if (pick < 86) reedClusterAt(x, y, sc);
        else if (pick < 93) bambooClumpAt(x, y, sc);
        else vineTangleAt(x, y, sc);
      }
    };

    const decoHouseAt = (bx, by, sc, rot) => {
      this.add
        .sprite(bx, by, "ph_g1_house")
        .setScale(sc)
        .setDepth(2)
        .setAlpha(0.93)
        .setRotation(rot);
    };

    const cellW = 74;
    const cellH = 96;
    const settleCols = 3;
    const settleRows = 3;
    const leftX0 = 54;
    const gridY0 = LAYOUT.GAME_TOP + 128;
    const rightBase = WORLD_W - leftX0 - (settleCols - 1) * cellW;
    const settlePad = 26;
    const settleL = {
      l: leftX0 - settlePad,
      r: leftX0 + (settleCols - 1) * cellW + settlePad,
      t: gridY0 - settlePad,
      b: gridY0 + (settleRows - 1) * cellH + settlePad,
    };
    const settleRR = {
      l: rightBase - settlePad,
      r: rightBase + (settleCols - 1) * cellW + settlePad,
      t: gridY0 - settlePad,
      b: gridY0 + (settleRows - 1) * cellH + settlePad,
    };
    const inSettle = (px, py) =>
      (px >= settleL.l && px <= settleL.r && py >= settleL.t && py <= settleL.b) ||
      (px >= settleRR.l && px <= settleRR.r && py >= settleRR.t && py <= settleRR.b);

    for (let n = 0; n < 64; n += 1) {
      let x = 0;
      let y = 0;
      let tries = 0;
      while (tries < 45) {
        tries += 1;
        const edge = Phaser.Math.Between(0, 3);
        if (edge === 0) {
          x = Phaser.Math.Between(24, 130);
          y = Phaser.Math.Between(LAYOUT.GAME_TOP + 36, LAYOUT.GAME_TOP + LAYOUT.GAME_H - 36);
        } else if (edge === 1) {
          x = Phaser.Math.Between(WORLD_W - 130, WORLD_W - 24);
          y = Phaser.Math.Between(LAYOUT.GAME_TOP + 36, LAYOUT.GAME_TOP + LAYOUT.GAME_H - 36);
        } else if (edge === 2) {
          x = Phaser.Math.Between(80, WORLD_W - 80);
          y = Phaser.Math.Between(LAYOUT.GAME_TOP + 14, LAYOUT.GAME_TOP + 52);
        } else {
          x = Phaser.Math.Between(80, WORLD_W - 80);
          y = Phaser.Math.Between(LAYOUT.GAME_TOP + LAYOUT.GAME_H - 52, LAYOUT.GAME_TOP + LAYOUT.GAME_H - 14);
        }
        if (!inSettle(x, y)) break;
      }
      if (tries >= 45) continue;
      const roll = Phaser.Math.Between(0, 99);
      const sc = Phaser.Math.FloatBetween(0.82, 1.28);
      if (roll < 16) grassTuftAt(x, y, sc);
      else if (roll < 32) bushAt(x, y, sc);
      else if (roll < 49) fernAt(x, y, sc);
      else if (roll < 60) flowerClusterAt(x, y, sc);
      else if (roll < 69) palmAt(x, y, sc);
      else if (roll < 77) broadleafAt(x, y, sc);
      else if (roll < 86) reedClusterAt(x, y, sc);
      else if (roll < 93) bambooClumpAt(x, y, sc);
      else vineTangleAt(x, y, sc);
    }

    const decoRingR = PLAZA_OUTER_R + 38;
    const nRing = 28;
    const ringPhase = 0;
    for (let i = 0; i < nRing; i += 1) {
      const t = ((i + ringPhase) / nRing) * Math.PI * 2;
      const x = cx + Math.cos(t) * decoRingR;
      const y = cy + Math.sin(t) * decoRingR;
      if (x < 46 || x > WORLD_W - 46) continue;
      if (y < LAYOUT.GAME_TOP + 34 || y > LAYOUT.GAME_TOP + LAYOUT.GAME_H - 34) continue;
      if (x > cx - 140 && x < cx + 140 && y < LAYOUT.GAME_TOP + 215) continue;
      decoHouseAt(x, y, 0.51, 0);
    }

    for (let r = 0; r < settleRows; r += 1) {
      for (let c = 0; c < settleCols; c += 1) {
        decoHouseAt(leftX0 + c * cellW, gridY0 + r * cellH, 0.49, 0);
      }
    }
    for (let r = 0; r < settleRows; r += 1) {
      for (let c = 0; c < settleCols; c += 1) {
        decoHouseAt(rightBase + c * cellW, gridY0 + r * cellH, 0.49, 0);
      }
    }
    for (let n = 0; n < 60; n += 1) {
      const ang = Math.random() * Math.PI * 2;
      const rad = PLAZA_OUTER_R + Phaser.Math.Between(16, 98);
      const px = cx + Math.cos(ang) * rad;
      const py = cy + Math.sin(ang) * rad;
      if (inSettle(px, py)) continue;
      const r = Phaser.Math.Between(0, 99);
      const sc = Phaser.Math.FloatBetween(0.72, 1.12);
      if (r < 30) grassTuftAt(px, py, sc);
      else if (r < 54) fernAt(px, py, sc);
      else if (r < 72) flowerClusterAt(px, py, sc * 0.85);
      else if (r < 82) palmAt(px, py, sc * 0.72);
      else if (r < 90) broadleafAt(px, py, sc * 0.88);
      else if (r < 96) reedClusterAt(px, py, sc * 0.78);
      else bambooClumpAt(px, py, sc * 0.7);
    }

    scatterFloraWild(inSettle);
  }

  buildObstacles() {
    this.obstacles = this.physics.add.staticGroup();
    const cx = 960;
    const cy = LAYOUT.GAME_TOP + LAYOUT.GAME_H / 2;
    const anglesOuter = Array.from({ length: 7 }, (_, i) => (i / 7) * 2);
    const anglesInner = Array.from({ length: 6 }, (_, i) => ((i + 0.5) / 6) * 2);
    const rOuter = HOUSE_RING_R;
    const rInner = HOUSE_RING_R - 34;

    const placeHouse = (a, ringR) => {
      const hx = cx + Math.cos(a * Math.PI) * ringR;
      const hy = cy + Math.sin(a * Math.PI) * ringR;
      const h = this.physics.add.staticSprite(hx, hy, "ph_g1_house");
      h.setScale(0.82);
      h.setAngle(0);
      h.setDepth(3);
      h.refreshBody();
      if (h.body) {
        const bw = 50;
        const bh = 44;
        h.body.setSize(bw, bh);
        h.body.setOffset((h.width - bw) / 2, (h.height - bh) * 0.52);
      }
      this.obstacles.add(h);
    };

    anglesOuter.forEach((a) => placeHouse(a, rOuter));
    anglesInner.forEach((a) => placeHouse(a, rInner));

    /* Bordes: capa Collision del Tiled (tile gid 5) */
  }

  buildCollectibles() {
    const cy = LAYOUT.GAME_TOP + LAYOUT.GAME_H / 2;
    const levelDefs =
      this.currentLevel === 1
        ? [
            { kind: "bottle", x: 835, y: cy + 2, shadowY: cy + 30, qid: "objeto-1-botella" },
            { kind: "vasija", x: 960, y: LAYOUT.GAME_TOP + 148, shadowY: LAYOUT.GAME_TOP + 180, qid: "objeto-2-vasija" },
            { kind: "turquesa", x: 1098, y: cy + 4, shadowY: cy + 34, qid: "objeto-3-turquesa" },
          ]
        : [
            { kind: "bottle", x: 736, y: LAYOUT.GAME_TOP + 224, shadowY: LAYOUT.GAME_TOP + 252, qid: "objeto-1-botella" },
            { kind: "vasija", x: 1168, y: LAYOUT.GAME_TOP + 214, shadowY: LAYOUT.GAME_TOP + 244, qid: "objeto-2-vasija" },
            { kind: "turquesa", x: 957, y: LAYOUT.GAME_TOP + 360, shadowY: LAYOUT.GAME_TOP + 392, qid: "objeto-3-turquesa" },
          ];

    for (const def of levelDefs) {
      const shadow = this.add.ellipse(def.x, def.shadowY, 58, 16, 0x081210, 0.4).setDepth(4);
      this.levelCollectibleDecor.push(shadow);
      if (def.kind === "bottle") {
        const bottle = this.add.sprite(def.x, def.y, "ph_g1_bottle");
        bottle.setScale(1.02);
        bottle.setDepth(5);
        this.decorateCollectible(bottle, def.qid, 72, 92, "bottle");
      } else if (def.kind === "vasija") {
        const vasija = this.add.sprite(def.x, def.y, "ph_vessel");
        vasija.setScale(1.52);
        vasija.setDepth(6);
        this.decorateCollectible(vasija, def.qid, 72, 92, "vasija");
      } else {
        const turq = this.add.container(def.x, def.y);
        const neckSpr = this.add.sprite(0, 0, "ph_g1_necklace");
        neckSpr.setScale(1.12);
        turq.add(neckSpr);
        turq.setDepth(5);
        turq.setData("questionId", def.qid);
        turq.setData("quizBusy", false);
        turq.setData("overlapLock", false);
        turq.setData("interactR", 78);
        turq.setData("promptR", 96);
        turq.setInteractive(new Phaser.Geom.Circle(0, 0, 44), Phaser.Geom.Circle.Contains);
        turq.on("pointerdown", () => this.pointerExamine(turq));
        this.collectibles.add(turq);
        this.tweens.add({
          targets: turq,
          y: def.y - 2,
          duration: 1400,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    }
  }

  decorateCollectible(sprite, qid, interactR, promptR, kind) {
    sprite.setData("questionId", qid);
    sprite.setData("quizBusy", false);
    sprite.setData("overlapLock", false);
    sprite.setData("interactR", interactR);
    sprite.setData("promptR", promptR);
    sprite.setInteractive({ useHandCursor: true });
    sprite.on("pointerdown", () => this.pointerExamine(sprite));

    if (kind === "bottle") {
      this.tweens.add({
        targets: sprite,
        alpha: { from: 0.94, to: 1 },
        duration: 2200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else if (kind === "vasija") {
      this.tweens.add({
        targets: sprite,
        angle: 360,
        duration: 12000,
        repeat: -1,
      });
    }
    this.collectibles.add(sprite);
  }

  setupHudAndMinimap() {
    const hudFont = "Segoe UI, Tahoma, sans-serif";
    this.hudPts = this.add
      .text(18, 16, "", { fontSize: "14px", color: "#ffdd66", fontStyle: "bold", fontFamily: hudFont })
      .setScrollFactor(0)
      .setDepth(110);

    this.hudObj = this.add
      .text(LAYOUT.WIDTH / 2, 16, "", { fontSize: "14px", color: "#f0f4e8", fontStyle: "bold", fontFamily: hudFont })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(110);

    const mx = LAYOUT.WIDTH - 14 - 150;
    /** Área: a la izquierda del minimapa, sin chocar con VOLVER (esquina sup. izq.) */
    this.hudArea = this.add
      .text(mx - 10, 16, "", {
        fontSize: "11px",
        color: "#c8d4b8",
        fontStyle: "bold",
        fontFamily: hudFont,
        align: "right",
        wordWrap: { width: 210 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(110);

    this.hudArea.setText(AREA_LABEL);
    const my = LAYOUT.GAME_TOP + 8;
    this.mmX = mx;
    this.mmY = my;
    this.mmW = 150;
    this.mmH = 100;
    this.add
      .rectangle(mx + this.mmW / 2, my + this.mmH / 2, this.mmW, this.mmH, 0x0c1014, 0.94)
      .setStrokeStyle(2, 0x8a7840)
      .setScrollFactor(0)
      .setDepth(108);
    this.miniGfx = this.add.graphics().setScrollFactor(0).setDepth(109);
  }

  setupTouchControls() {
    const mobile = !this.sys.game.device.os.desktop;
    if (!mobile) return;
    if (this.registry.get("externalTouchpad") === true) return;

    const padX = 132;
    const padY = LAYOUT.CONTROLS_TOP + 72;
    const size = 64;
    const gap = 72;

    this.createTouchArrowButton(padX, padY - gap, size, "↑", "up");
    this.createTouchArrowButton(padX - gap, padY, size, "←", "left");
    this.createTouchArrowButton(padX + gap, padY, size, "→", "right");
    this.createTouchArrowButton(padX, padY + gap, size, "↓", "down");

    const ax = LAYOUT.WIDTH - 104;
    const ay = LAYOUT.CONTROLS_TOP + 72;
    const actBtn = this.add
      .rectangle(ax, ay, 148, 58, 0x7a4a24, 1)
      .setStrokeStyle(2, 0xd4a574)
      .setScrollFactor(0)
      .setDepth(112)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(ax, ay, "ACCION", { fontSize: "14px", color: "#fff8f0", fontStyle: "bold" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(113);
    actBtn.on("pointerdown", () => this.tryExamineNearest());
    actBtn.on("pointerup", () => actBtn.setFillStyle(0x7a4a24, 1));
    actBtn.on("pointerout", () => actBtn.setFillStyle(0x7a4a24, 1));
  }

  createTouchArrowButton(x, y, size, label, dir) {
    const btn = this.add
      .rectangle(x, y, size, size, 0x1f3a6d, 0.95)
      .setStrokeStyle(2, 0x9cc8ff)
      .setScrollFactor(0)
      .setDepth(112)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, { fontSize: "24px", color: "#f0f8ff", fontStyle: "bold" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(113);

    const press = () => {
      if (!this.touchGame1) return;
      this.touchGame1[dir] = true;
      btn.setFillStyle(0x2b5ca6, 1);
    };
    const release = () => {
      if (!this.touchGame1) return;
      this.touchGame1[dir] = false;
      btn.setFillStyle(0x1f3a6d, 0.95);
    };

    btn.on("pointerdown", press);
    btn.on("pointerup", release);
    btn.on("pointerout", release);
  }

  refreshHud() {
    const total = this.levelTotals[this.currentLevel] ?? LEVEL_ITEMS_TOTAL;
    const found = total - this.collectibles.countActive(true);
    const score = this.registry.get("game1Score") ?? 0;
    this.hudPts.setText(`PUNTOS: ${String(score).padStart(3, "0")}`);
    this.hudObj.setText(`OBJETOS: ${found} / ${total}`);
  }

  showLevelTransition() {
    if (this.levelTransitionActive) return;
    this.levelTransitionActive = true;
    this.pendingCollectible = null;
    if (this.cache.audio.exists("sfx_mission_complete")) {
      duckAmbientAudio({ duckTo: 0.12, holdMs: 1200, restoreMs: 950 });
      this.sound.play("sfx_mission_complete", { volume: 0.66 });
    }
    if (this.player?.body) {
      this.player.setVelocity(0, 0);
    }

    const ui = [];
    const depth = 220;
    const dim = this.add
      .rectangle(LAYOUT.WIDTH / 2, LAYOUT.HEIGHT / 2, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x05070c, 0.88)
      .setScrollFactor(0)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });
    ui.push(dim);

    const panel = this.add
      .rectangle(LAYOUT.WIDTH / 2, LAYOUT.HEIGHT / 2, 780, 330, 0x1a241a, 0.98)
      .setScrollFactor(0)
      .setDepth(depth + 1)
      .setStrokeStyle(3, 0xc8921a);
    ui.push(panel);

    const title = this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.HEIGHT / 2 - 98, "¡FELICIDADES!", {
        fontSize: "54px",
        fontFamily: "Arial, sans-serif",
        color: "#6cfc8a",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 2);
    ui.push(title);

    const subtitle = this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.HEIGHT / 2 - 6, "MISIÓN 1 SUPERADA\nYa puedes continuar con la Misión 2.", {
        fontSize: "36px",
        fontFamily: "Arial, sans-serif",
        color: "#f9f2dd",
        align: "center",
        lineSpacing: 10,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 2);
    ui.push(subtitle);

    const mapBg = this.add
      .rectangle(LAYOUT.WIDTH / 2, LAYOUT.HEIGHT / 2 + 118, 360, 54, 0x2a2418, 1)
      .setStrokeStyle(2, 0xc8921a)
      .setScrollFactor(0)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true });
    ui.push(mapBg);
    const mapTxt = this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.HEIGHT / 2 + 118, "VOLVER AL MAPA", {
        fontSize: "21px",
        fontFamily: "Arial, sans-serif",
        color: "#f9f2dd",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 3);
    ui.push(mapTxt);

    mapBg.on("pointerdown", () => {
      completeMissionByNumber(1);
      exitToMainMap();
    });
    mapBg.on("pointerover", () => mapTxt.setColor("#fff8cc"));
    mapBg.on("pointerout", () => mapTxt.setColor("#f9f2dd"));
    dim.on("pointerdown", () => {});

    this.levelTransitionUi = ui;
  }

  redrawMinimap() {
    if (!this.miniGfx) return;
    const ox = this.mmX;
    const oy = this.mmY;
    const sx = this.mmW / WORLD_W;
    const sy = this.mmH / LAYOUT.GAME_H;
    this.miniGfx.clear();
    this.miniGfx.fillStyle(0x1e3028, 1);
    this.miniGfx.fillRect(ox, oy, this.mmW, this.mmH);
    const tcx = 960 * sx + ox;
    const tcy = (LAYOUT.GAME_TOP + LAYOUT.GAME_H / 2 - LAYOUT.GAME_TOP) * sy + oy;
    this.miniGfx.lineStyle(1, 0x4a6054, 0.65);
    this.miniGfx.strokeCircle(tcx, tcy, PLAZA_OUTER_R * sx);

    for (const c of this.collectibles.getChildren()) {
      if (!c.active) continue;
      const cx = c.x * sx + ox;
      const cy = (c.y - LAYOUT.GAME_TOP) * sy + oy;
      this.miniGfx.fillStyle(0xffb030, 1);
      this.miniGfx.fillCircle(cx, cy, 4);
    }

    const px = this.player.x * sx + ox;
    const py = (this.player.y - LAYOUT.GAME_TOP) * sy + oy;
    this.miniGfx.fillStyle(0x4a9cff, 1);
    this.miniGfx.fillCircle(px, py, 5);
    this.miniGfx.lineStyle(1, 0xffffff, 0.9);
    this.miniGfx.strokeCircle(px, py, 5);
  }

  tryExamineNearest() {
    let best = null;
    let bestD = Infinity;
    for (const c of this.collectibles.getChildren()) {
      if (!c.active || c.getData("quizBusy")) continue;
      const r = c.getData("interactR") ?? 60;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
      if (d <= r && d < bestD) {
        bestD = d;
        best = c;
      }
    }
    if (best) this.openQuiz(best);
  }

  pointerExamine(item) {
    const r = item.getData("interactR") ?? 60;
    const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
    if (d > r) return;
    this.openQuiz(item);
  }

  openQuiz(item) {
    if (!item.active || item.getData("quizBusy")) return;
    if (item.getData("overlapLock")) return;
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("enigma-quiz-visibility", {
          detail: { visible: true },
        }),
      );
    }
    this.joystickActive = false;
    if (this.touchGame1) {
      this.touchGame1.up = false;
      this.touchGame1.down = false;
      this.touchGame1.left = false;
      this.touchGame1.right = false;
    }
    if (this.player) this.player.stickVector = null;
    item.setData("quizBusy", true);
    this.pendingCollectible = item;
    this.scene.pause();
    this.scene.launch("QuizScene", {
      questionId: item.getData("questionId"),
      returnScene: "Game1Scene",
    });
  }

  tryShowResults() {
    const total = this.levelTotals[this.currentLevel] ?? LEVEL_ITEMS_TOTAL;
    const found = total - this.collectibles.countActive(true);
    if (found < total) return;
    this.showLevelTransition();
  }

  update() {
    if (this.sceneryTile) {
      this.sceneryTile.tilePositionX += 0.05;
      this.sceneryTile.tilePositionY += 0.018;
    }
    if (this.atmosphereTile) {
      this.atmosphereTile.tilePositionX += 0.012;
    }
    if (this.levelTransitionActive) {
      if (this.player?.body) this.player.setVelocity(0, 0);
      this.refreshHud();
      this.redrawMinimap();
      this._domActionPrev = !!this._domGame1?.action;
      this._domResultPrev = !!this._domGame1?.result;
      return;
    }
    const { vx, vy } = this.readGame1Steer();
    this.player.setVelocity(vx * this.player.speed, vy * this.player.speed);

    for (const c of this.collectibles.getChildren()) {
      if (!c.active || !c.getData("overlapLock")) continue;
      const r = (c.getData("interactR") ?? 60) + 14;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
      if (d > r) c.setData("overlapLock", false);
    }

    const doAction =
      (this.keyE && Phaser.Input.Keyboard.JustDown(this.keyE)) ||
      (this._domGame1?.action && !this._domActionPrev) ||
      (this.externalTouchpadState?.action && !this.externalActionPrev) ||
      this.externalTouchpadState?.actionPulse;
    if (doAction) {
      this.tryExamineNearest();
    }
    if (this.externalTouchpadState) {
      this.externalActionPrev = !!this.externalTouchpadState.action;
      this.externalTouchpadState.actionPulse = false;
    }
    this._domActionPrev = !!this._domGame1?.action;

    this.refreshHud();
    this.redrawMinimap();

    const total = this.levelTotals[this.currentLevel] ?? LEVEL_ITEMS_TOTAL;
    const foundCount = total - this.collectibles.countActive(true);

    if (foundCount >= total) {
      this.hint.setText("¡Misión 1 completada! Pulsa VOLVER AL MAPA para continuar.");
      this.resultPrompt.setText("Misión completada");
      if (!this.levelTransitionActive) {
        this.showLevelTransition();
      }
    } else {
      const near = this.collectibles.getChildren().some((c) => {
        if (!c.active || c.getData("quizBusy")) return false;
        const pr = c.getData("promptR") ?? 72;
        return Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y) <= pr;
      });
      this.hint.setText(
        near
          ? TXT_PROMPT
          : "Explora el sitio Santa Ana – La Florida y localiza los tres objetos del descubrimiento de 2002.",
      );
      this.resultPrompt.setText("");
    }
    const doResult =
      (this.game1Keys?.enter && Phaser.Input.Keyboard.JustDown(this.game1Keys.enter)) ||
      (this._domGame1?.result && !this._domResultPrev);
    if (doResult) this.tryShowResults();
    this._domResultPrev = !!this._domGame1?.result;
  }
}
