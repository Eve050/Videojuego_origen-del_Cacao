import Phaser from "phaser";
import { LAYOUT } from "../layout.js";
import Player from "../entities/Player.js";
import Guardian from "../entities/Guardian.js";
import { exitToMainMap } from "../data/introCopy.js";

/**
 * Laberinto ampliado (~5–8 min a ritmo calmado). Leyenda: # muro · o grano · . vacío · p pieza · * poder · V vasija.
 * Niveles 1–2 comparten mapa; nivel 3 sube agresividad de guardianes.
 */
const MAZE_L1 = [
  "#####################",
  "#pooooooo#oooooooopo#",
  "#o###o##o#o##o###o#o#",
  "#o#ooooo#o#ooooo#o#o#",
  "#o#o###o#o#o###o#o#o#",
  "#o#o#ooooooo#o#o#o#o#",
  "#ooo#o###V###o#ooo#o#",
  "#o#o#ooooooo#o#o#o#o#",
  "#o#o###o#o#o###o#o#o#",
  "#o#ooooo#o#ooooo#o#o#",
  "#o###o##o#o##o###o#o#",
  "#opoooooo#oooooooopo#",
  "#####################",
];

const TILE = 36;
const PANEL_W = 300;
const WALL_COLOR_BORDER = 0x8855cc;
const POWER_MS_BY_LEVEL = [12000, 10000, 8000];
const SCARED_GUARDIAN_SPEED = 80;
/** Partida pensada ~5–8 min; al pasar 8:00 el ritual termina en derrota. */
const LEVEL_TIME_MAX_MS = 8 * 60 * 1000;

const GUARDIAN_CATCH = {
  KUNKU: "¡El guardián del fuego te encontró! Cuidado.",
  SUMAK: "¡Sumak predijo tu camino! Cambia de dirección.",
  ALLPA: "¡Allpa apareció de la nada! Mantente alerta.",
  WASI: "¡Wasi protege las reliquias del templo sagrado!",
};

const PANEL_COPY = [
  {
    name: "KUNKU",
    color: "#dc3232",
    role: "Direct Chase",
    lore: "Perseguidor directo",
  },
  {
    name: "SUMAK",
    color: "#3290dc",
    role: "Intercept",
    lore: "Emboscador / Río",
  },
  {
    name: "ALLPA",
    color: "#32aa50",
    role: "Random Walk",
    lore: "Guardián errante",
  },
  {
    name: "WASI",
    color: "#dcb432",
    role: "Protect",
    lore: "Guardián templo",
  },
];

const ACTIVE_BY_LEVEL = [
  [0, 2],
  [0, 2, 1],
  [0, 1, 2, 3],
];

const GUARDIAN_SPEED_PX = [120, 160, 200];
const AI_INTERVAL_MS = [800, 500, 300];
const BEANS_BY_LEVEL = [80, 72, 64];
/** Nivel 1 y 2: mismo ritmo del jugador (~5–8 min); nivel 3 más veloz. */
const PLAYER_SPEED_BY_LV = [86, 86, 108];
const PIECE_FACTS = [
  "Santa Ana – La Florida: evidencia más antigua del uso de cacao en el mundo (5.500 AP).",
  "La plaza ceremonial circular tiene 40 m de diámetro y fue centro cívico-ritual.",
  "En 2024 visitaron 1.395 personas el sitio; en 2017 eran 456 (crecimiento del 200%).",
  "En 2025–2026 se registraron más de 70 nuevos sitios arqueológicos en Palanda y Chinchipe.",
];

function fmtTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default class Game3Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Game3Scene" });
  }

  walkable(r, c) {
    if (r < 0 || c < 0 || r >= this.maze.length || c >= this.maze[0].length) return false;
    const ch = this.maze[r][c];
    return ch !== "#";
  }

  worldToCell(x, y) {
    const c = Phaser.Math.Clamp(Math.floor((x - this.offsetX) / TILE), 0, this.maze[0].length - 1);
    const r = Phaser.Math.Clamp(Math.floor((y - this.offsetY) / TILE), 0, this.maze.length - 1);
    return { r, c };
  }

  onMazeDomKey(ev, isDown) {
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
    };
    const slot = byCode[ev.code] ?? byKey[ev.key];
    if (!slot || !this._domMaze) return;
    ev.preventDefault();
    this._domMaze[slot] = isDown;
  }

  findWalkableNear(anchorR, anchorC, maxRadius = 6) {
    if (this.walkable(anchorR, anchorC)) return { r: anchorR, c: anchorC };
    for (let rad = 1; rad <= maxRadius; rad += 1) {
      for (let dr = -rad; dr <= rad; dr += 1) {
        for (let dc = -rad; dc <= rad; dc += 1) {
          const r = anchorR + dr;
          const c = anchorC + dc;
          if (this.walkable(r, c)) return { r, c };
        }
      }
    }
    return { r: this.startGrid.r, c: this.startGrid.c };
  }

  trimBeansForLevel() {
    const target = BEANS_BY_LEVEL[this.mazeLevel - 1] ?? this.beans.getLength();
    const beans = this.beans.getChildren();
    if (beans.length <= target) {
      this.beansTotal = beans.length;
      this.beansLeft = beans.length;
      return;
    }
    const excess = beans.length - target;
    const sorted = [...beans].sort((a, b) => a.y - b.y || a.x - b.x);
    for (let i = 0; i < excess; i += 1) {
      const idx = (i * 7 + this.mazeLevel * 5) % sorted.length;
      const bean = sorted.splice(idx, 1)[0];
      bean?.destroy();
    }
    const finalCount = this.beans.getLength();
    this.beansTotal = finalCount;
    this.beansLeft = finalCount;
  }

  createPowerPods() {
    this.powerPods = this.physics.add.group();
    const rows = this.maze.length;
    const cols = this.maze[0].length;
    const anchors = [
      { r: 2, c: 2 },
      { r: 2, c: cols - 3 },
      { r: rows - 3, c: 2 },
      { r: rows - 3, c: cols - 3 },
    ];
    for (const { r, c } of anchors) {
      const p = this.findWalkableNear(r, c);
      const px = this.offsetX + p.c * TILE + TILE / 2;
      const py = this.offsetY + p.r * TILE + TILE / 2;
      const orb = this.physics.add.sprite(px, py, "ph_power_orb");
      orb.body.setImmovable(true);
      orb.body.setAllowGravity(false);
      orb.setDepth(3);
      this.tweens.add({
        targets: orb,
        scale: { from: 0.92, to: 1.12 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
      this.powerPods.add(orb);
    }
  }

  bfsFirstStep(sr, sc, tr, tc) {
    const key = (r, c) => `${r},${c}`;
    if (!this.walkable(sr, sc) || !this.walkable(tr, tc)) return { dr: 0, dc: 0 };
    const q = [[sr, sc]];
    const came = new Map([[key(sr, sc), null]]);
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    let hit = false;
    while (q.length) {
      const [r, c] = q.shift();
      if (r === tr && c === tc) {
        hit = true;
        break;
      }
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (!this.walkable(nr, nc)) continue;
        const k = key(nr, nc);
        if (came.has(k)) continue;
        came.set(k, [r, c]);
        q.push([nr, nc]);
      }
    }
    if (!hit) return { dr: 0, dc: 0 };
    let r = tr;
    let c = tc;
    let prev = null;
    while (!(r === sr && c === sc)) {
      prev = [r, c];
      const p = came.get(key(r, c));
      if (p == null) break;
      [r, c] = p;
    }
    if (!prev) return { dr: 0, dc: 0 };
    return { dr: prev[0] - sr, dc: prev[1] - sc };
  }

  fleeFirstStep(gr, gc, pr, pc) {
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    let best = { dr: 0, dc: 0, d: -1 };
    for (const [dr, dc] of dirs) {
      if (!this.walkable(gr + dr, gc + dc)) continue;
      const nr = gr + dr;
      const nc = gc + dc;
      const d = Math.abs(nr - pr) + Math.abs(nc - pc);
      if (d > best.d) {
        best = { dr, dc, d };
      }
    }
    return { dr: best.dr, dc: best.dc };
  }

  create() {
    let lv = Number(this.registry.get("mazeLevel")) || 1;
    if (lv < 1) lv = 1;
    if (lv > 3) lv = 3;
    this.mazeLevel = lv;
    this.maze = MAZE_L1;

    this.maxLives = lv === 3 ? 2 : 3;
    this.guardianSpeedPx = GUARDIAN_SPEED_PX[lv - 1];
    this.guardianAiMs = AI_INTERVAL_MS[lv - 1];
    this.aiAccum = this.guardianAiMs;
    this.wasiPatrolIndex = 0;
    this.vasijaCell = { r: 0, c: 0 };
    this.vasijaReached = false;
    this.vasijaHintCd = 0;
    this.powerUntil = 0;
    this.powerMs = POWER_MS_BY_LEVEL[lv - 1] ?? 10000;
    this.levelStartTime = this.time.now;
    this.timeOver = false;

    this.beansTotal = 0;
    this.piecesTotal = 0;
    this.pieceCells = [];

    for (let r = 0; r < this.maze.length; r += 1) {
      for (let c = 0; c < this.maze[r].length; c += 1) {
        const ch = this.maze[r][c];
        if (ch === "o") this.beansTotal += 1;
        if (ch === "p") {
          this.piecesTotal += 1;
          this.pieceCells.push({ r, c });
        }
        if (ch === "V") {
          this.vasijaCell = { r, c };
          this.pieceCells.push({ r, c });
        }
      }
    }

    this.beansLeft = this.beansTotal;
    this.piecesFound = 0;
    this.score = 0;
    this.lives = this.maxLives;
    this.level = this.mazeLevel;
    this.hitCooldown = 0;
    this.startGrid = { r: 1, c: 2 };

    this.physics.world.setBounds(0, LAYOUT.GAME_TOP, LAYOUT.WIDTH, LAYOUT.GAME_H);

    const rows = this.maze.length;
    const cols = this.maze[0].length;
    const mazePxW = cols * TILE;
    const leftMax = LAYOUT.WIDTH - PANEL_W - 16;
    this.offsetX = Math.max(10, Math.floor((leftMax - mazePxW) / 2));
    this.offsetY = LAYOUT.GAME_TOP + (LAYOUT.GAME_H - rows * TILE) / 2;

    this.drawChrome();

    this.mazeBg = this.add
      .rectangle(this.offsetX + mazePxW / 2, this.offsetY + (rows * TILE) / 2, mazePxW + 8, rows * TILE + 8, 0x120820, 1)
      .setStrokeStyle(3, WALL_COLOR_BORDER)
      .setDepth(0);

    this.walls = this.physics.add.staticGroup();
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const ch = this.maze[r][c];
        if (ch === "#") {
          const wx = this.offsetX + c * TILE + TILE / 2;
          const wy = this.offsetY + r * TILE + TILE / 2;
          const w = this.walls.create(wx, wy, "ph_wall_maze");
          w.setDisplaySize(TILE, TILE);
          w.setTint(0x5c3a8f);
          w.setDepth(1);
          if (typeof w.refreshBody === "function") {
            w.refreshBody();
          }
          if ((r + c) % 5 === 0) {
            this.add
              .text(wx, wy, "◆", {
                fontSize: `${Math.round(TILE * 0.22)}px`,
                color: "#9f87d8",
              })
              .setOrigin(0.5)
              .setDepth(2);
          }
        }
      }
    }

    const startCx = this.offsetX + this.startGrid.c * TILE + TILE / 2;
    const startCy = this.offsetY + this.startGrid.r * TILE + TILE / 2;

    this.player = new Player(this, startCx, startCy, "ph_player");
    this.player.clearTint();
    this.player.speed = PLAYER_SPEED_BY_LV[lv - 1];
    this.player.setDepth(5);
    this.player.setScale(0.58);
    if (typeof this.player.refreshBody === "function") {
      this.player.refreshBody();
    }
    if (this.player.body) {
      const pr = Math.max(6, Math.round(Math.min(this.player.displayWidth, this.player.displayHeight) * 0.38));
      this.player.body.setCircle(pr);
      this.player.body.setCollideWorldBounds(false);
      this.player.body.setAllowGravity(false);
    }
    this.physics.add.collider(this.player, this.walls);

    const kb = this.input.keyboard;
    if (kb) {
      kb.enabled = true;
    }
    this.mazeKeys =
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
        },
        true,
        true,
      ) ?? null;

    this._domKeyDown = (ev) => this.onMazeDomKey(ev, true);
    this._domKeyUp = (ev) => this.onMazeDomKey(ev, false);
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this._domKeyDown, { capture: true });
      window.addEventListener("keyup", this._domKeyUp, { capture: true });
    }

    this._domMaze = { up: false, down: false, left: false, right: false };
    this.input.on("pointerdown", () => {
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

    if (this.game?.canvas) {
      this.game.canvas.setAttribute("tabindex", "0");
      this.game.canvas.style.outline = "none";
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (typeof window !== "undefined" && this._domKeyDown) {
        window.removeEventListener("keydown", this._domKeyDown, { capture: true });
        window.removeEventListener("keyup", this._domKeyUp, { capture: true });
      }
      this._domKeyDown = null;
      this._domKeyUp = null;
    });

    const vx = this.offsetX + this.vasijaCell.c * TILE + TILE / 2;
    const vy = this.offsetY + this.vasijaCell.r * TILE + TILE / 2;

    this.vasijaGlow = this.add.circle(vx, vy, 24, 0xffdc66, 0.18).setDepth(2);
    this.tweens.add({
      targets: this.vasijaGlow,
      scale: { from: 0.94, to: 1.1 },
      alpha: { from: 0.1, to: 0.28 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    this.vasijaIcon = this.add.sprite(vx, vy, "ph_vessel").setScale(1.05).setDepth(3).setAngle(0);

    this.poderLabel = this.add
      .text(vx, vy - 44, "PODER ANCESTRAL", {
        fontSize: "9px",
        color: "#ffecc8",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(4);

    this.metaVasijaLabel = this.add
      .text(vx, vy + 30, "VASIJA → META FINAL", {
        fontSize: "8px",
        color: "#e8c896",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(4);

    this.tweens.add({
      targets: [this.poderLabel, this.metaVasijaLabel],
      alpha: { from: 0.65, to: 1 },
      duration: 750,
      yoyo: true,
      repeat: -1,
    });

    this.vasijaSensor = this.add.circle(vx, vy, 18, 0xffffff, 0.001);
    this.physics.add.existing(this.vasijaSensor, true);
    if (this.vasijaSensor.body) {
      this.vasijaSensor.body.setCircle(18);
    }

    this.beans = this.physics.add.group();
    this.pieces = this.physics.add.group();

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const ch = this.maze[r][c];
        const px = this.offsetX + c * TILE + TILE / 2;
        const py = this.offsetY + r * TILE + TILE / 2;
        if (ch === "o") {
          const pod = this.physics.add.sprite(px, py, "ph_pellet");
          pod.body.setImmovable(true);
          pod.body.setAllowGravity(false);
          pod.setDepth(2);
          this.beans.add(pod);
        }
        if (ch === "p") {
          const pcSpr = this.physics.add.sprite(px, py, "ph_diamond_piece");
          pcSpr.body.setImmovable(true);
          pcSpr.body.setAllowGravity(false);
          if (typeof pcSpr.refreshBody === "function") pcSpr.refreshBody();
          pcSpr.body.setCircle(14, 0, 0);
          pcSpr.setDepth(2);
          this.pieces.add(pcSpr);
        }
      }
    }

    this.trimBeansForLevel();
    this.createPowerPods();

    const types = ["KUNKU", "SUMAK", "ALLPA", "WASI"];
    const spawnRc = [
      { r: 11, c: 19 },
      { r: 1, c: 18 },
      { r: 6, c: 1 },
      { r: 11, c: 1 },
    ];
    this.guardians = [];
    this.guardianGroup = this.physics.add.group();
    this.guardianSpawns = spawnRc.map(({ r, c }) => ({
      x: this.offsetX + c * TILE + TILE / 2,
      y: this.offsetY + r * TILE + TILE / 2,
    }));

    const activeIdx = ACTIVE_BY_LEVEL[lv - 1];
    this.activeGuardianIndices = new Set(activeIdx);

    for (let i = 0; i < 4; i += 1) {
      const sp = this.guardianSpawns[i];
      const g = new Guardian(this, sp.x, sp.y, types[i]);
      g.guardianIndex = i;
      g.setScale(1.02);
      g.setDepth(4);
      this.physics.add.collider(g, this.walls);
      if (!this.activeGuardianIndices.has(i)) {
        g.setVisible(false);
        g.body.checkCollision.none = true;
        g.body.enable = false;
      }
      this.guardians.push(g);
      this.guardianGroup.add(g);

      const label = this.add
        .text(sp.x, sp.y + 20, types[i], {
          fontSize: "8px",
          color: "#f0e8d8",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(5);
      g.guardianLabel = label;
    }

    this.physics.add.overlap(this.player, this.guardianGroup, (_p, g) => {
      if (!g.body?.enable) return;
      if (this.time.now < this.powerUntil) {
        const sp = this.guardianSpawns[g.guardianIndex];
        g.setPosition(sp.x, sp.y);
        g.setVelocity(0, 0);
        this.hint.setText(`¡Guardián disipado! · Poder: ${Math.ceil((this.powerUntil - this.time.now) / 1000)}s`);
        return;
      }
      if (this.hitCooldown > 0) return;
      const name = g.guardianType || "KUNKU";
      this.hitCooldown = 1800;
      this.lives -= 1;
      this.hint.setText(GUARDIAN_CATCH[name] || GUARDIAN_CATCH.KUNKU);
      this.time.delayedCall(2800, () => {
        this.hint.setText(
          "Recoge todos los granos para completar el ritual; piezas y poder suman puntos y ayudan frente a los guardianes.",
        );
      });
      if (this.lives <= 0) {
        const hi = Math.max(this.registry.get("mazeHighScore") ?? 0, this.score);
        this.registry.set("mazeHighScore", hi);
        this.scene.start("ResultScene", {
          game: "mazeLose",
          score: this.score,
          highScore: hi,
        });
      } else {
        this.player.setPosition(startCx, startCy);
        this.player.setVelocity(0, 0);
      }
    });

    this.physics.add.overlap(this.player, this.beans, (_p, pod) => {
      pod.destroy();
      this.beansLeft -= 1;
      this.score += 10;
      this.updateHud();
      if (this.beansLeft === 0) {
        this.winMazeByGranos();
        return;
      }
      this.hint.setText(`Recolecta todos los granos (${this.beansTotal - this.beansLeft}/${this.beansTotal}).`);
    });

    this.physics.add.overlap(this.player, this.powerPods, (_p, pod) => {
      if (!pod?.active) return;
      this.tweens.killTweensOf(pod);
      pod.destroy();
      this.powerUntil = this.time.now + this.powerMs;
      this.poderLabel.setVisible(false);
      this.score += 5;
      this.hint.setText(
        `¡PODER ANCESTRAL! +5 · Guardianes en modo scared (${Math.round(this.powerMs / 1000)}s).`,
      );
    });

    this.physics.add.overlap(this.player, this.vasijaSensor, () => {
      if (this.vasijaReached) return;
      if (this.time.now > this.vasijaHintCd) {
        this.vasijaHintCd = this.time.now + 2200;
        if (this.beansLeft > 0) {
          this.hint.setText(
            `Meta: todos los granos (${this.beansTotal - this.beansLeft}/${this.beansTotal}). La vasija es el corazón del ritual.`,
          );
        } else {
          this.hint.setText("¡Cosecha lista! El ritual se completa al reunir todos los granos del laberinto.");
        }
      }
    });

    this.buildSidePanel();

    this.add
      .text(LAYOUT.WIDTH - 12, LAYOUT.GAME_TOP + 12, "[ VOLVER AL MAPA ]", { fontSize: "10px", color: "#c8921a" })
      .setOrigin(1, 0)
      .setDepth(25)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => exitToMainMap());

    this.hint = this.add
      .text(this.offsetX + mazePxW / 2, LAYOUT.HINT_TOP + 16, "", {
        fontSize: "12px",
        color: "#d8d0c8",
        align: "center",
        wordWrap: { width: mazePxW + PANEL_W * 0.35 },
      })
      .setOrigin(0.5)
      .setDepth(25);

    this.hudTitle = this.add
      .text(LAYOUT.WIDTH / 2, 8, "JUEGO 3 - CACAO MAZE | Laberinto Cultural | 1280 x 720 px", {
        fontSize: "11px",
        color: "#c5a3ff",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0)
      .setDepth(25);

    this.hudLeft = this.add.text(16, 22, "", { fontSize: "11px", color: "#ffdd44" }).setDepth(25);
    this.hudMid = this.add
      .text(LAYOUT.WIDTH / 2 - PANEL_W / 2, 22, "", { fontSize: "11px", color: "#eeeeee" })
      .setOrigin(0.5, 0)
      .setDepth(25);
    this.hudTime = this.add
      .text(LAYOUT.WIDTH / 2, 40, "", { fontSize: "10px", color: "#aaa0c8" })
      .setOrigin(0.5, 0)
      .setDepth(25);
    this.hudRight = this.add
      .text(LAYOUT.WIDTH - PANEL_W - 28, 22, "", { fontSize: "11px", color: "#ffaaaa" })
      .setOrigin(1, 0)
      .setDepth(25);

    this.hint.setText(
      "Recolecta todos los granos (HUD) y evita guardianes. Flechas / WASD para moverse.",
    );
    this.updateHud();
  }

  buildSidePanel() {
    const px = LAYOUT.WIDTH - PANEL_W + 8;
    const py = LAYOUT.GAME_TOP + LAYOUT.GAME_H / 2;
    this.add
      .rectangle(px + PANEL_W / 2 - 8, py, PANEL_W - 16, LAYOUT.GAME_H - 24, 0x120a18, 0.94)
      .setStrokeStyle(2, WALL_COLOR_BORDER)
      .setDepth(6);

    this.add
      .text(px + 14, LAYOUT.GAME_TOP + 18, "GUARDIANES\nESPIRITUALES", {
        fontSize: "24px",
        color: "#e8c048",
        fontStyle: "bold",
        lineSpacing: 4,
      })
      .setDepth(7);

    let y = LAYOUT.GAME_TOP + 92;
    PANEL_COPY.forEach((row) => {
      this.add.circle(px + 24, y + 13, 12, Phaser.Display.Color.HexStringToColor(row.color).color, 1).setDepth(7);
      this.add
        .text(px + 24, y + 13, row.name.slice(0, 3), {
          fontSize: "9px",
          color: "#121212",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(8);
      this.add
        .text(px + 42, y, `${row.name}`, {
          fontSize: "19px",
          color: row.color,
          fontStyle: "bold",
        })
        .setDepth(7);
      this.add
        .text(px + 42, y + 16, row.lore, {
          fontSize: "16px",
          color: "#d8d0c8",
          fontStyle: "bold",
          wordWrap: { width: PANEL_W - 36 },
        })
        .setDepth(7);
      this.add
        .text(px + 42, y + 34, row.role, {
          fontSize: "14px",
          color: "#9a9488",
          wordWrap: { width: PANEL_W - 36 },
          lineSpacing: 1,
        })
        .setDepth(7);
      y += 88;
    });
  }

  drawChrome() {
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x1a1a2e).setOrigin(0);
    this.add.rectangle(0, LAYOUT.GAME_TOP, LAYOUT.WIDTH, LAYOUT.GAME_H, 0x07040c).setOrigin(0);
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HUD_TOP_H, 0x1e1430, 0.97).setOrigin(0).setStrokeStyle(2, 0x5a3a7a);
    this.add.rectangle(0, LAYOUT.HINT_TOP, LAYOUT.WIDTH, LAYOUT.HINT_BAR_H, 0x151018, 0.92).setOrigin(0);
    this.add.rectangle(0, LAYOUT.CONTROLS_TOP, LAYOUT.WIDTH, LAYOUT.CONTROLS_H_ACTUAL, 0x0a0610, 0.95).setOrigin(0);

    this.add
      .text(
        20,
        LAYOUT.CONTROLS_TOP + 14,
        "Flechas / WASD = Moverse | Joystick virtual en móvil",
        {
          fontSize: "10px",
          color: "#7a7288",
          wordWrap: { width: 820 },
        },
      )
      .setOrigin(0, 0);

    this.add
      .text(LAYOUT.WIDTH - 24, LAYOUT.CONTROLS_TOP + 18, "Palanda, Ecuador — Mayo Chinchipe · Marañón — 5.500 AP", {
        fontSize: "10px",
        color: "#9a8a68",
      })
      .setOrigin(1, 0);
  }

  heartsLine() {
    const lost = Math.max(0, this.maxLives - this.lives);
    return "♥".repeat(Math.max(0, this.lives)) + "♡".repeat(lost);
  }

  /**
   * Victoria principal: último grano del laberinto. Evita doble disparo con vasija o tiempo.
   */
  winMazeByGranos() {
    if (this.vasijaReached) return;
    this.vasijaReached = true;
    this.score += 180;
    const hi = Math.max(this.registry.get("mazeHighScore") ?? 0, this.score);
    this.registry.set("mazeHighScore", hi);
    this.hint.setText("¡Cosecha completa! Los guardianes honran tu recorrido.");
    this.scene.start("ResultScene", {
      game: "mazeWin",
      score: this.score,
      pieces: this.piecesFound,
      piecesTotal: this.piecesTotal,
    });
  }

  updateHud() {
    const got = this.beansTotal - this.beansLeft;
    this.hudLeft.setText(`GRANOS: ${got}/${this.beansTotal}`);
    this.hudMid.setText(`PIEZAS: ${this.piecesFound}/${this.piecesTotal}`);
    const scared = this.time.now < this.powerUntil;
    const extra = scared ? `  PODER ${Math.ceil((this.powerUntil - this.time.now) / 1000)}s` : "";
    this.hudRight.setText(`${this.heartsLine()}     Nv. ${this.level}${extra}`);
    this.hudRight.setColor(scared ? "#aaddff" : "#ffaaaa");
  }

  /**
   * Entrada: listeners DOM (ev.code) + teclas Phaser. Movimiento Arcade con collider a muros.
   */
  readMazeSteer() {
    const d = this._domMaze;
    const m = this.mazeKeys;
    let vx = 0;
    let vy = 0;
    if (d) {
      if (d.left || m?.left?.isDown || m?.a?.isDown) vx = -1;
      else if (d.right || m?.right?.isDown || m?.d?.isDown) vx = 1;
      if (d.up || m?.up?.isDown || m?.w?.isDown) vy = -1;
      else if (d.down || m?.down?.isDown || m?.s?.isDown) vy = 1;
    } else if (m) {
      if (m.left.isDown || m.a.isDown) vx = -1;
      else if (m.right.isDown || m.d.isDown) vx = 1;
      if (m.up.isDown || m.w.isDown) vy = -1;
      else if (m.down.isDown || m.s.isDown) vy = 1;
    }
    if (!d && !m) {
      const cu = this.player.cursors;
      const w = this.player.wasd;
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

  updatePacPlayer() {
    const { vx, vy } = this.readMazeSteer();
    const spd = this.player.speed;
    this.player.setVelocity(vx * spd, vy * spd);
  }

  /**
   * Diamantes morados = piezas rituales (bonus). Overlap puro a veces falla con círculo del jugador;
   * recogida por distancia en el centro del pasillo.
   */
  collectMazePiecesByProximity() {
    if (!this.pieces || !this.player || this.vasijaReached) return;
    const px = this.player.x;
    const py = this.player.y;
    const rPick = TILE * 0.85;
    const list = this.pieces.getChildren();
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const piece = list[i];
      if (!piece?.active) continue;
      if (Phaser.Math.Distance.Between(px, py, piece.x, piece.y) > rPick) continue;
      piece.destroy();
      this.piecesFound += 1;
      this.score += 50;
      this.updateHud();
      const idx = Math.max(0, Math.min(PIECE_FACTS.length - 1, this.piecesFound - 1));
      this.hint.setText(`¡PIEZA ${this.piecesFound}/4! +50 · DATO CULTURAL: ${PIECE_FACTS[idx]}`);
    }
  }

  applyGridMove(guardian, dr, dc, speedPx = this.guardianSpeedPx) {
    guardian.setVelocity(dc * speedPx, dr * speedPx);
  }

  updateGuardianAI() {
    const scared = this.time.now < this.powerUntil;
    const { r: pr, c: pc } = this.worldToCell(this.player.x, this.player.y);
    const pvx = this.player.body?.velocity?.x ?? 0;
    const pvy = this.player.body?.velocity?.y ?? 0;
    const plen = Math.hypot(pvx, pvy) || 1;
    const predictR = Phaser.Math.Clamp(Math.round(pr + (pvy / plen) * 4), 0, this.maze.length - 1);
    const predictC = Phaser.Math.Clamp(Math.round(pc + (pvx / plen) * 4), 0, this.maze[0].length - 1);
    const targetPredict = this.walkable(predictR, predictC) ? { r: predictR, c: predictC } : { r: pr, c: pc };

    for (let i = 0; i < this.guardians.length; i += 1) {
      if (!this.activeGuardianIndices.has(i)) continue;
      const g = this.guardians[i];
      if (!g.body?.enable) continue;
      if (scared) {
        g.setTint(0xccdfff);
        const left = this.powerUntil - this.time.now;
        if (left <= 5000) {
          g.setAlpha(0.35 + 0.65 * Math.abs(Math.sin(this.time.now / 95)));
        } else {
          g.setAlpha(1);
        }
      } else {
        g.clearTint();
        g.setAlpha(1);
      }

      const { r: gr, c: gc } = this.worldToCell(g.x, g.y);
      let dr = 0;
      let dc = 0;

      if (scared) {
        const step = this.fleeFirstStep(gr, gc, pr, pc);
        dr = step.dr;
        dc = step.dc;
      } else {
        switch (g.guardianType) {
          case "KUNKU": {
            const step = this.bfsFirstStep(gr, gc, pr, pc);
            dr = step.dr;
            dc = step.dc;
            break;
          }
          case "SUMAK": {
            const step = this.bfsFirstStep(gr, gc, targetPredict.r, targetPredict.c);
            dr = step.dr;
            dc = step.dc;
            break;
          }
          case "ALLPA": {
            const dirs = Phaser.Utils.Array.Shuffle([
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
            ]);
            for (const [ddr, ddc] of dirs) {
              if (this.walkable(gr + ddr, gc + ddc)) {
                dr = ddr;
                dc = ddc;
                break;
              }
            }
            break;
          }
          case "WASI": {
            if (this.pieceCells.length === 0) break;
            const tgt = this.pieceCells[this.wasiPatrolIndex % this.pieceCells.length];
            const step = this.bfsFirstStep(gr, gc, tgt.r, tgt.c);
            if (step.dr === 0 && step.dc === 0) {
              this.wasiPatrolIndex += 1;
            }
            dr = step.dr;
            dc = step.dc;
            if (Math.abs(gr - tgt.r) + Math.abs(gc - tgt.c) <= 1) {
              this.wasiPatrolIndex += 1;
            }
            break;
          }
          default:
            break;
        }
      }

      if (dr === 0 && dc === 0) {
        g.setVelocity(0, 0);
      } else {
        this.applyGridMove(g, dr, dc, scared ? SCARED_GUARDIAN_SPEED : this.guardianSpeedPx);
      }
    }
  }

  update(time, delta) {
    if (this.timeOver || !this.hudTime) return;

    const elapsed = this.time.now - this.levelStartTime;
    const left = LEVEL_TIME_MAX_MS - elapsed;
    this.hudTime.setText(`TIEMPO ${fmtTime(elapsed)} / ${fmtTime(LEVEL_TIME_MAX_MS)}${left < 60000 ? "  ¡Apúrate!" : ""}`);

    if (elapsed >= LEVEL_TIME_MAX_MS && !this.vasijaReached) {
      this.timeOver = true;
      const hi = Math.max(this.registry.get("mazeHighScore") ?? 0, this.score);
      this.registry.set("mazeHighScore", hi);
      this.scene.start("ResultScene", {
        game: "mazeLose",
        score: this.score,
        highScore: hi,
        detail: "Se agotaron los 8 minutos del ritual. La vasija sigue esperando.",
      });
      return;
    }

    if (this.hitCooldown > 0) {
      this.hitCooldown -= delta;
    }
    this.updatePacPlayer();
    this.collectMazePiecesByProximity();

    for (const g of this.guardians) {
      if (g.guardianLabel) {
        g.guardianLabel.setPosition(g.x, g.y + 18);
      }
    }

    this.aiAccum += delta;
    if (this.aiAccum >= this.guardianAiMs) {
      this.aiAccum = 0;
      this.updateGuardianAI();
    }

    this.updateHud();
  }
}
