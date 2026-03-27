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
  "############################",
  "#oooooooooooooooooooooooooo#",
  "#o####..######.######.####o#",
  "#op...o......oo......o...po#",
  "#o.##.o.####oo.####..o.##.o#",
  "#o.##.o.####oo.####..o.##.o#",
  "#o....o......oo......o....o#",
  "#o.##.o.####oo.####..o.##.o#",
  "#o....o..*.Vo.o......o....o#",
  "#o.##.o.####oo.####..o.##.o#",
  "#o....o......oo......o....o#",
  "#o.##.o.####oo.####..o.##.o#",
  "#o.##.o.####oo.####..o.##.o#",
  "#op...o......oo......o...po#",
  "#o####..######.######.####o#",
  "#oooooooooooooooooooooooooo#",
  "############################",
];

const TILE = 26;
const PANEL_W = 272;
const WALL_COLOR_BORDER = 0x8855cc;
const POWER_MS = 8000;
/** Partida pensada ~5–8 min; al pasar 8:00 el ritual termina en derrota. */
const LEVEL_TIME_MAX_MS = 8 * 60 * 1000;

const GUARDIAN_CATCH = {
  KUNKU: "¡El guardián del fuego te encontró! Cuidado.",
  SUMAK: "¡Sumak predijo tu camino! Cambia de dirección.",
  ALLPA: "¡Allpa apareció de la nada! Mantente alerta.",
  WASI: "¡Wasi protege las reliquias del templo sagrado!",
};

const PANEL_COPY = [
  { name: "KUNKU", color: "#ff5555", role: "Perseguidor directo" },
  { name: "SUMAK", color: "#55aaff", role: "Emboscador río" },
  { name: "ALLPA", color: "#55dd77", role: "Guardián errante" },
  { name: "WASI", color: "#eecc44", role: "Guardián templo" },
];

const ACTIVE_BY_LEVEL = [
  [0, 2],
  [0, 2, 1],
  [0, 1, 2, 3],
];

const GUARDIAN_SPEED_PX = [74, 92, 118];
const AI_INTERVAL_MS = [880, 600, 360];
/** Nivel 1 y 2: mismo ritmo del jugador (~5–8 min); nivel 3 más veloz. */
const PLAYER_SPEED_BY_LV = [86, 86, 108];

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
    this.powerPelletAlive = false;
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
    this.startGrid = { r: 1, c: 1 };

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
          w.setTint(0x5c3a8f);
          w.setDepth(1);
        }
      }
    }

    this.pac = {
      r: this.startGrid.r,
      c: this.startGrid.c,
      dir: { dr: 0, dc: 0 },
      want: { dr: 0, dc: 0 },
    };

    const startCx = this.offsetX + this.startGrid.c * TILE + TILE / 2;
    const startCy = this.offsetY + this.startGrid.r * TILE + TILE / 2;

    this.player = new Player(this, startCx, startCy);
    this.player.setTexture("ph_explorer");
    this.player.clearTint();
    this.player.speed = PLAYER_SPEED_BY_LV[lv - 1];
    this.player.setDepth(4);
    if (this.player.body) {
      this.player.body.setCircle(12, 4, 4);
      this.player.body.setCollideWorldBounds(false);
    }

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
    let powerPx = 0;
    let powerPy = 0;

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
          pcSpr.setDepth(2);
          this.pieces.add(pcSpr);
        }
        if (ch === "*") {
          powerPx = px;
          powerPy = py;
        }
      }
    }

    this.powerPellet = null;
    this.powerPelletAlive = false;
    if (powerPx > 0 && powerPy > 0) {
      this.powerPellet = this.physics.add.sprite(powerPx, powerPy, "ph_power_orb");
      this.powerPellet.body.setImmovable(true);
      this.powerPellet.body.setAllowGravity(false);
      this.powerPellet.setDepth(3);
      this.powerPelletAlive = true;
      this.tweens.add({
        targets: this.powerPellet,
        scale: { from: 0.92, to: 1.12 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    const types = ["KUNKU", "SUMAK", "ALLPA", "WASI"];
    const spawnRc = [
      { r: 15, c: 24 },
      { r: 15, c: 3 },
      { r: 3, c: 14 },
      { r: 1, c: 23 },
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
      g.setTexture("ph_ghost_pac");
      g.setDepth(3);
      this.physics.add.collider(g, this.walls);
      if (!this.activeGuardianIndices.has(i)) {
        g.setVisible(false);
        g.body.checkCollision.none = true;
        g.body.enable = false;
      }
      this.guardians.push(g);
      this.guardianGroup.add(g);

      const label = this.add
        .text(sp.x, sp.y + 18, types[i], {
          fontSize: "8px",
          color: "#eae6dc",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(4);
      g.guardianLabel = label;
    }

    this.physics.add.overlap(this.player, this.guardianGroup, (_p, g) => {
      if (!g.body?.enable) return;
      if (this.time.now < this.powerUntil) {
        const sp = this.guardianSpawns[g.guardianIndex];
        g.setPosition(sp.x, sp.y);
        g.setVelocity(0, 0);
        this.score += 400;
        this.hint.setText(`¡Guardián disipado! +400 · Poder: ${Math.ceil((this.powerUntil - this.time.now) / 1000)}s`);
        return;
      }
      if (this.hitCooldown > 0) return;
      const name = g.guardianType || "KUNKU";
      this.hitCooldown = 1800;
      this.lives -= 1;
      this.hint.setText(GUARDIAN_CATCH[name] || GUARDIAN_CATCH.KUNKU);
      this.time.delayedCall(2800, () => {
        this.hint.setText(
          "Exploración ~5–8 min: granos, piezas, poder junto a la vasija; gana tocando la vasija al final.",
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
        this.pac = {
          r: this.startGrid.r,
          c: this.startGrid.c,
          dir: { dr: 0, dc: 0 },
          want: { dr: 0, dc: 0 },
        };
      }
    });

    this.physics.add.overlap(this.player, this.beans, (_p, pod) => {
      pod.destroy();
      this.beansLeft -= 1;
      this.score += 10;
      if (this.beansLeft === 0 && this.piecesFound === this.piecesTotal) {
        this.hint.setText("¡Todo listo! Toca la vasija ceremonial (centro).");
      } else if (this.beansLeft === 0) {
        this.hint.setText("Granos completos — reúne las piezas y llega a la vasija.");
      }
      this.updateHud();
    });

    this.physics.add.overlap(this.player, this.pieces, (_p, piece) => {
      piece.destroy();
      this.piecesFound += 1;
      this.score += 80;
      if (this.beansLeft === 0 && this.piecesFound === this.piecesTotal) {
        this.hint.setText("¡Piezas reunidas! — Corra a la vasija.");
      }
      this.updateHud();
    });

    if (this.powerPellet) {
      this.physics.add.overlap(this.player, this.powerPellet, () => {
        if (!this.powerPelletAlive || !this.powerPellet?.active) return;
        this.tweens.killTweensOf(this.powerPellet);
        this.powerPellet.destroy();
        this.powerPellet = null;
        this.powerPelletAlive = false;
        this.powerUntil = this.time.now + POWER_MS;
        this.poderLabel.setVisible(false);
        this.score += 50;
        this.hint.setText("¡PODER ANCESTRAL! Los guardianes huyen (+400 si los alcanzas).");
      });
    }

    this.physics.add.overlap(this.player, this.vasijaSensor, () => {
      if (this.beansLeft > 0 || this.piecesFound < this.piecesTotal) {
        if (this.time.now > this.vasijaHintCd) {
          this.vasijaHintCd = this.time.now + 2200;
          const needB = this.beansLeft > 0 ? ` Granos: ${this.beansTotal - this.beansLeft}/${this.beansTotal}.` : "";
          const needP =
            this.piecesFound < this.piecesTotal
              ? ` Piezas: ${this.piecesFound}/${this.piecesTotal}.`
              : "";
          this.hint.setText(`Aún falta:${needB}${needP} Luego honra la vasija.`);
        }
        return;
      }
      if (this.vasijaReached) return;
      this.vasijaReached = true;
      this.score += 250;
      this.scene.start("ResultScene", {
        game: "mazeWin",
        score: this.score,
        pieces: this.piecesTotal,
        piecesTotal: this.piecesTotal,
      });
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
      .text(16, 4, "JUEGO 3 — CACAO MAZE | 1280×720 · ritual ~5–8 min", {
        fontSize: "10px",
        color: "#c5a3ff",
        fontStyle: "bold",
      })
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
      "Flechas o WASD (una dirección). Meta: vasija del centro tras granos, piezas y poder opcional.",
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
      .text(px + 12, LAYOUT.GAME_TOP + 28, "GUARDIANES\nESPIRITUALES", {
        fontSize: "11px",
        color: "#e8c048",
        fontStyle: "bold",
        lineSpacing: 4,
      })
      .setDepth(7);

    let y = LAYOUT.GAME_TOP + 78;
    PANEL_COPY.forEach((row) => {
      this.add
        .text(px + 12, y, `${row.name}`, {
          fontSize: "11px",
          color: row.color,
          fontStyle: "bold",
        })
        .setDepth(7);
      this.add
        .text(px + 12, y + 16, row.role, {
          fontSize: "10px",
          color: "#b8b0a8",
          wordWrap: { width: PANEL_W - 36 },
        })
        .setDepth(7);
      y += 52;
    });
  }

  drawChrome() {
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x1a1a2e).setOrigin(0);
    this.add.rectangle(0, LAYOUT.GAME_TOP, LAYOUT.WIDTH, LAYOUT.GAME_H, 0x07040c).setOrigin(0);
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HUD_TOP_H, 0x1e1430, 0.97).setOrigin(0).setStrokeStyle(2, 0x5a3a7a);
    this.add.rectangle(0, LAYOUT.HINT_TOP, LAYOUT.WIDTH, LAYOUT.HINT_BAR_H, 0x151018, 0.92).setOrigin(0);
    this.add.rectangle(0, LAYOUT.CONTROLS_TOP, LAYOUT.WIDTH, LAYOUT.CONTROLS_H_ACTUAL, 0x0a0610, 0.95).setOrigin(0);

    this.add
      .text(20, LAYOUT.CONTROLS_TOP + 18, "Flechas / WASD = Mover | Joystick virtual en móvil (próximamente)", {
        fontSize: "10px",
        color: "#7a7288",
      })
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

  updateHud() {
    const got = this.beansTotal - this.beansLeft;
    this.hudLeft.setText(`GRANOS: ${got}/${this.beansTotal}`);
    this.hudMid.setText(`PIEZAS: ${this.piecesFound}/${this.piecesTotal}`);
    const scared = this.time.now < this.powerUntil;
    const extra = scared ? `  PODER ${Math.ceil((this.powerUntil - this.time.now) / 1000)}s` : "";
    this.hudRight.setText(`${this.heartsLine()}     Nv. ${this.level}${extra}`);
    this.hudRight.setColor(scared ? "#aaddff" : "#ffaaaa");
  }

  updatePacPlayer() {
    const T = TILE;
    const spd = this.player.speed;
    const snap = 8;

    const cx = (c) => this.offsetX + c * T + T / 2;
    const cy = (r) => this.offsetY + r * T + T / 2;

    let wdr = 0;
    let wdc = 0;
    const cu = this.player.cursors;
    const w = this.player.wasd;
    if (cu?.up.isDown || w?.W.isDown) wdr = -1;
    else if (cu?.down.isDown || w?.S.isDown) wdr = 1;
    if (cu?.left.isDown || w?.A.isDown) wdc = -1;
    else if (cu?.right.isDown || w?.D.isDown) wdc = 1;
    if (wdr !== 0 && wdc !== 0) wdc = 0;

    let gr = this.pac.r;
    let gc = this.pac.c;
    let curCx = cx(gc);
    let curCy = cy(gr);
    const distSq = Phaser.Math.Distance.Squared(this.player.x, this.player.y, curCx, curCy);
    const atCenter = distSq <= snap * snap;

    if (atCenter) {
      this.player.setPosition(curCx, curCy);
      if (wdr !== 0 || wdc !== 0) {
        this.pac.want = { dr: wdr, dc: wdc };
      }

      let ndr = this.pac.dir.dr;
      let ndc = this.pac.dir.dc;
      if (this.pac.want.dr !== 0 || this.pac.want.dc !== 0) {
        const wr = gr + this.pac.want.dr;
        const wc = gc + this.pac.want.dc;
        if (this.walkable(wr, wc)) {
          ndr = this.pac.want.dr;
          ndc = this.pac.want.dc;
        }
      }
      if (!this.walkable(gr + ndr, gc + ndc)) {
        ndr = 0;
        ndc = 0;
      }
      this.pac.dir = { dr: ndr, dc: ndc };
      gr = this.pac.r;
      gc = this.pac.c;
      curCx = cx(gc);
      curCy = cy(gr);
    }

    const tr = gr + this.pac.dir.dr;
    const tc = gc + this.pac.dir.dc;
    let tgx = curCx;
    let tgy = curCy;
    if ((this.pac.dir.dr !== 0 || this.pac.dir.dc !== 0) && this.walkable(tr, tc)) {
      tgx = cx(tc);
      tgy = cy(tr);
    }

    const dx = tgx - this.player.x;
    const dy = tgy - this.player.y;
    const len = Math.hypot(dx, dy);
    if (len < snap || len < 0.01) {
      this.player.setPosition(tgx, tgy);
      if (Math.abs(tgx - curCx) > 0.1 || Math.abs(tgy - curCy) > 0.1) {
        this.pac.r = tr;
        this.pac.c = tc;
      }
      this.player.setVelocity(0, 0);
    } else {
      this.player.setVelocity((dx / len) * spd, (dy / len) * spd);
    }
  }

  applyGridMove(guardian, dr, dc) {
    guardian.setVelocity(dc * this.guardianSpeedPx, dr * this.guardianSpeedPx);
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

    const tints = {
      KUNKU: 0xdc3232,
      SUMAK: 0x3290dc,
      ALLPA: 0x32aa50,
      WASI: 0xdcb432,
    };

    for (let i = 0; i < this.guardians.length; i += 1) {
      if (!this.activeGuardianIndices.has(i)) continue;
      const g = this.guardians[i];
      if (!g.body?.enable) continue;
      g.setTint(scared ? 0xccdfff : tints[g.guardianType] ?? 0xffffff);

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
        this.applyGridMove(g, dr, dc);
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
