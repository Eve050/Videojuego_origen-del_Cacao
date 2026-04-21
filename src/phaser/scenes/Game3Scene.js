import Phaser from "phaser";
import { LAYOUT } from "../layout.js";
import Player from "../entities/Player.js";
import Guardian from "../entities/Guardian.js";
import { exitToMainMap } from "../data/introCopy.js";
import { duckAmbientAudio } from "../../modules/audioManager.js";
import { PHASE_SFX_FILES, SFX_VOL } from "../../modules/sfxVolumes.js";
import { showMissionWinModal } from "../ui/missionWinModal.js";

/**
 * Laberinto ampliado (~5–8 min a ritmo calmado). Leyenda: # muro · o grano · . vacío · p pieza · * poder · V vasija.
 * Niveles 1–2 comparten mapa; nivel 2 cierra la misión.
 */
const MAZE_L1 = [
  "#####################",
  "#pooooooo#oooooooopo#",
  "#o###o##o#o##o###o#o#",
  "#o#ooooo#o#ooooo#o#o#",
  "#o#o###ooooooo###o#o#",
  "#o#o#oooo#o#oooo#o#o#",
  "#ooo#o##oVo##o#ooo#o#",
  "#o#o#oooo#o#oooo#o#o#",
  "#o#o###ooooooo###o#o#",
  "#o#ooooo#o#ooooo#o#o#",
  "#o###o##o#o##o###o#o#",
  "#opoooooo#oooooooopo#",
  "#####################",
];

const TILE = 36;
/** Guía tipográfica: pixel = HUD corto; heading = títulos; body = lectura. */
const FONT = {
  pixel: '"Press Start 2P", monospace',
  heading: '"Exo 2", sans-serif',
  body: '"Nunito", sans-serif',
};
const PANEL_W = 300;
const WALL_COLOR_BORDER = 0x8855cc;
const MAX_MAZE_LEVEL = 2;
const POWER_MS_BY_LEVEL = [10000, 10000];
const SCARED_GUARDIAN_SPEED = 72;
const HUNT_GUARDIAN_COLOR = 0x8b5a2b;

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
  [0, 1, 2, 3],
  [0, 1, 2, 3],
];

const GUARDIAN_SPEED_PX = [104, 126];
const AI_INTERVAL_MS = [920, 760];
const BEANS_BY_LEVEL = [80, 72];
/** Dos niveles: exploración y cierre final. */
const PLAYER_SPEED_BY_LV = [86, 90];
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

  preload() {
    this.load.audio("sfx_relic", PHASE_SFX_FILES.sfx_relic);
  }

  ensureSfxUnlocked() {
    const ctx = this.sound?.context;
    if (!ctx) return;
    if (ctx.state === "suspended" && typeof ctx.resume === "function") {
      ctx.resume().catch(() => {});
    }
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
    if (isDown) this.ensureSfxUnlocked();
    this._domMaze[slot] = isDown;
  }

  setupTouchControls() {
    const mobile = this.isMobileMazeUi || !this.sys.game.device.os.desktop;
    if (!mobile) return;
    if (this.registry.get("externalTouchpad") === true) return;

    const jx = 118;
    const jy = Math.min(LAYOUT.HEIGHT - 92, LAYOUT.CONTROLS_TOP + 36);
    this.mazeStickCx = jx;
    this.mazeStickCy = jy;
    this.mazeStickR = 66;
    this.mazeStickActive = false;
    this.mazeStickPointerId = null;

    this.mazeStickBase = this.add
      .circle(jx, jy, this.mazeStickR, 0x273548, 0.78)
      .setStrokeStyle(2, 0xaec7df)
      .setDepth(24);
    this.mazeStickThumb = this.add.circle(jx, jy, 28, 0xc9d9ea, 0.94).setDepth(25);
    this.mazeStickBase.setInteractive({ useHandCursor: true });
    this.mazeStickThumb.setInteractive({ useHandCursor: true });

    const beginStick = (pointer) => {
      this.mazeStickActive = true;
      this.mazeStickPointerId = pointer.id;
      this.updateMazeStick(pointer);
    };
    this.mazeStickBase.on("pointerdown", beginStick);
    this.mazeStickThumb.on("pointerdown", beginStick);

    this._mazePointerMoveHandler = (pointer) => {
      if (!this.mazeStickActive) return;
      if (this.mazeStickPointerId !== null && pointer.id !== this.mazeStickPointerId) return;
      this.updateMazeStick(pointer);
    };
    this._mazePointerUpHandler = (pointer) => {
      if (!this.mazeStickActive) return;
      if (this.mazeStickPointerId !== null && pointer.id !== this.mazeStickPointerId) return;
      this.mazeStickActive = false;
      this.mazeStickPointerId = null;
      if (this.player) this.player.stickVector = null;
      if (this.mazeStickThumb) this.mazeStickThumb.setPosition(this.mazeStickCx, this.mazeStickCy);
    };

    this.input.on("pointermove", this._mazePointerMoveHandler);
    this.input.on("pointerup", this._mazePointerUpHandler);
    this.input.on("pointerupoutside", this._mazePointerUpHandler);
  }

  updateMazeStick(pointer) {
    if (!this.player || !this.mazeStickThumb) return;
    const dx = pointer.x - this.mazeStickCx;
    const dy = pointer.y - this.mazeStickCy;
    const len = Math.hypot(dx, dy) || 1;
    const clamp = Math.min(this.mazeStickR, len);
    const ang = Math.atan2(dy, dx);
    this.mazeStickThumb.setPosition(this.mazeStickCx + Math.cos(ang) * clamp, this.mazeStickCy + Math.sin(ang) * clamp);
    const nx = (Math.cos(ang) * clamp) / this.mazeStickR;
    const ny = (Math.sin(ang) * clamp) / this.mazeStickR;
    this.player.stickVector = { x: nx, y: ny };
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
    this.powerPodsTotal = anchors.length;
    this.powerPodsCollected = 0;
  }

  playPickupFx(x, y, color = 0xffcc66, text = "+10") {
    const burst = this.add.circle(x, y, 5, color, 0.95).setDepth(18);
    const ring = this.add.circle(x, y, 8, color, 0).setStrokeStyle(2, color, 0.95).setDepth(18);
    const lbl = this.add
      .text(x, y - 8, text, {
        fontSize: "11px",
        color: "#fff7dd",
        fontStyle: "bold",
        fontFamily: FONT.pixel,
      })
      .setOrigin(0.5)
      .setDepth(19);

    this.tweens.add({
      targets: burst,
      scale: { from: 0.7, to: 1.8 },
      alpha: { from: 0.95, to: 0 },
      duration: 190,
      ease: "Cubic.easeOut",
      onComplete: () => burst.destroy(),
    });
    this.tweens.add({
      targets: ring,
      scale: { from: 0.9, to: 1.9 },
      alpha: { from: 0.95, to: 0 },
      duration: 230,
      ease: "Sine.easeOut",
      onComplete: () => ring.destroy(),
    });
    this.tweens.add({
      targets: lbl,
      y: y - 22,
      alpha: { from: 1, to: 0 },
      duration: 330,
      ease: "Sine.easeOut",
      onComplete: () => lbl.destroy(),
    });

    if (this.player?.scene) {
      this.tweens.add({
        targets: this.player,
        scaleX: this.player.scaleX * 1.05,
        scaleY: this.player.scaleY * 1.05,
        yoyo: true,
        duration: 90,
        repeat: 0,
      });
    }
  }

  playClippedSfx(key, volume = SFX_VOL.relic, maxMs = 2000) {
    this.ensureSfxUnlocked();
    if (!this.cache.audio.exists(key)) return;
    const s = this.sound.add(key);
    s.play({ volume });
    this.time.delayedCall(maxMs, () => {
      if (s.isPlaying) s.stop();
      s.destroy();
    });
  }

  activateGuardianHuntMode(ms = 10000) {
    const now = this.time.now;
    this.powerUntil = Math.max(this.powerUntil, now + ms);
    this.huntModeMs = ms;
    this.poderLabel.setVisible(false);
    for (const g of this.guardians || []) {
      if (!g?.body?.enable) continue;
      g.setTint(HUNT_GUARDIAN_COLOR);
      g.setAlpha(1);
    }
    this.hint.setText(
      `¡MODO CACERIA! +50 · Puedes perseguir guardianes por ${Math.ceil(ms / 1000)}s.`,
    );
  }

  sendGuardianToCenter(g) {
    const home = this.guardianHomes?.[g.guardianIndex] ?? this.guardianCenterHome;
    if (!home) return;
    g.setPosition(home.x, home.y);
    g.setVelocity(0, 0);
    g.patternIndex = 0;
    g.stuckTicks = 0;
    g.lastCellKey = "";
    g.respawnUntil = this.time.now + 500;
  }

  collectSingleBean(bean) {
    if (!bean?.active || this.vasijaReached) return;
    const bx = bean.x;
    const by = bean.y;
    bean.destroy();
    this.beansLeft -= 1;
    this.score += 10;
    const now = this.time.now;
    if (this.cache.audio.exists("sfx_ok") && now - this.lastOkSfxAt >= 70) {
      this.ensureSfxUnlocked();
      this.sound.play("sfx_ok", { volume: SFX_VOL.ok });
      this.lastOkSfxAt = now;
    }
    this.playPickupFx(bx, by, 0xffb347, "+10");
    this.updateHud();
    if (this.beansLeft === 0) {
      this.hint.setText("¡Todos los granos listos! Ahora recoge todos los orbes para pasar de nivel.");
      return;
    }
    this.hint.setText(
      `Granos: ${this.beansTotal - this.beansLeft}/${this.beansTotal} · Objetivo: recoger todos los orbes.`,
    );
  }

  collectBeansByProximity() {
    if (!this.beans || !this.player || this.vasijaReached) return;
    const px = this.player.x;
    const py = this.player.y;
    const rPick = TILE * 0.62;
    const list = this.beans.getChildren();
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const bean = list[i];
      if (!bean?.active) continue;
      if (Phaser.Math.Distance.Between(px, py, bean.x, bean.y) > rPick) continue;
      this.collectSingleBean(bean);
    }
  }

  showMazeLevelWinOverlay(nextLevel) {
    if (this._levelWinOverlayActive) return;
    this._levelWinOverlayActive = true;
    if (this.player?.body) this.player.setVelocity(0, 0);
    for (const g of this.guardians || []) {
      g?.setVelocity?.(0, 0);
    }

    this.hint?.setVisible(false);
    this.hudTitle?.setVisible(false);
    this.hudLeft?.setVisible(false);
    this.hudMid?.setVisible(false);
    this.hudRight?.setVisible(false);
    this.hudTime?.setVisible(false);
    this.mazeMapExitText?.setVisible(false);
    this.mazeStickBase?.setVisible(false);
    this.mazeStickThumb?.setVisible(false);

    const exp = this.registry.get("expeditionMission");
    const badgeText =
      exp === 1 || exp === 2 || exp === 3
        ? `◆ ARCADE · MISIÓN ${exp} DE 3 · EXPEDICIÓN ◆`
        : null;

    showMissionWinModal(this, {
      depth: 220,
      badgeText,
      missionLine: "MISIÓN SUPERADA",
      hintLine: `Ya superaste este nivel del Cacao Maze.\nPresiona para iniciar el Nivel ${nextLevel}.`,
      statsRows: [
        { label: "Puntos", value: String(this.score) },
        { label: "Vidas", value: String(this.lives) },
        { label: "Nivel", value: `${this.level} / ${MAX_MAZE_LEVEL}` },
      ],
      buttons: [
        {
          label: `INICIAR NIVEL ${nextLevel}`,
          onClick: () => {
            if (this._levelWinOverlayUsed) return;
            this._levelWinOverlayUsed = true;
            this.startNextMazeLevel();
          },
        },
      ],
      compact: this.isMobileMazeUi === true,
      buttonsExclusive: true,
    });
  }

  startNextMazeLevel() {
    this.registry.set("mazeCarryScore", this.score);
    this.registry.set("mazeCarryLives", this.lives);
    this.registry.set("mazeLevel", this.level + 1);
    this.scene.restart();
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
    this.isMobileMazeUi = !this.sys.game.device.os.desktop && this.registry.get("expeditionMission") === 3;
    this.externalTouchpadState =
      this.registry.get("externalTouchpad") === true && typeof window !== "undefined"
        ? window.__enigmaTouchpadState || null
        : null;
    this.panelWidth = this.isMobileMazeUi ? 0 : PANEL_W;
    this.lastOkSfxAt = 0;
    this.lastErrorSfxAt = 0;
    this._levelWinOverlayActive = false;
    this._levelWinOverlayUsed = false;
    let lv = Number(this.registry.get("mazeLevel")) || 1;
    if (lv < 1) lv = 1;
    if (lv > MAX_MAZE_LEVEL) lv = MAX_MAZE_LEVEL;
    this.mazeLevel = lv;
    // Copiamos la forma del lado derecho al izquierdo (simétrico).
    this.maze = MAZE_L1.map((row) => {
      const arr = row.split("");
      const n = arr.length;
      for (let i = 0; i < Math.floor((n - 1) / 2); i += 1) {
        arr[i] = arr[n - 1 - i];
      }
      return arr.join("");
    });

    this.maxLives = 3;
    this.guardianSpeedPx = GUARDIAN_SPEED_PX[lv - 1];
    this.guardianAiMs = AI_INTERVAL_MS[lv - 1];
    this.aiAccum = this.guardianAiMs;
    this.wasiPatrolIndex = 0;
    this.vasijaCell = { r: 0, c: 0 };
    this.vasijaReached = false;
    this.vasijaHintCd = 0;
    this.powerUntil = 0;
    this.powerMs = POWER_MS_BY_LEVEL[lv - 1] ?? 10000;
    this.huntModeMs = this.powerMs;
    this.levelStartTime = this.time.now;

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
    const carryScore = Number(this.registry.get("mazeCarryScore")) || 0;
    const carryLives = Number(this.registry.get("mazeCarryLives")) || this.maxLives;
    this.score = lv > 1 ? carryScore : 0;
    this.lives = lv > 1 ? Phaser.Math.Clamp(carryLives, 1, this.maxLives) : this.maxLives;
    this.level = this.mazeLevel;
    this.hitCooldown = 0;
    this.startGrid = { r: 1, c: 2 };

    this.physics.world.setBounds(0, LAYOUT.GAME_TOP, LAYOUT.WIDTH, LAYOUT.GAME_H);

    const rows = this.maze.length;
    const cols = this.maze[0].length;
    const mazePxW = cols * TILE;
    const leftMax = LAYOUT.WIDTH - this.panelWidth - 16;
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
                fontFamily: FONT.pixel,
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
    this.player.setScale(0.72);
    if (typeof this.player.refreshBody === "function") {
      this.player.refreshBody();
    }
    if (this.player.body) {
      const pr = Math.min(
        11,
        Math.max(6, Math.round(Math.min(this.player.displayWidth, this.player.displayHeight) * 0.38)),
      );
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
    this.setupTouchControls();
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

    if (this.game?.canvas) {
      this.game.canvas.setAttribute("tabindex", "0");
      this.game.canvas.style.outline = "none";
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (typeof window !== "undefined" && this._domKeyDown) {
        window.removeEventListener("keydown", this._domKeyDown, { capture: true });
        window.removeEventListener("keyup", this._domKeyUp, { capture: true });
      }
      if (this._mazePointerMoveHandler) {
        this.input.off("pointermove", this._mazePointerMoveHandler);
      }
      if (this._mazePointerUpHandler) {
        this.input.off("pointerup", this._mazePointerUpHandler);
        this.input.off("pointerupoutside", this._mazePointerUpHandler);
      }
      this._domKeyDown = null;
      this._domKeyUp = null;
      this._mazePointerMoveHandler = null;
      this._mazePointerUpHandler = null;
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
        fontFamily: FONT.pixel,
      })
      .setOrigin(0.5)
      .setDepth(4);

    this.metaVasijaLabel = this.add
      .text(vx, vy + 30, "VASIJA → META FINAL", {
        fontSize: "8px",
        color: "#e8c896",
        fontStyle: "bold",
        fontFamily: FONT.pixel,
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
    const centerBase = this.findWalkableNear(Math.floor(rows / 2), Math.floor(cols / 2), 8);
    this.guardianCenterHome = {
      x: this.offsetX + centerBase.c * TILE + TILE / 2,
      y: this.offsetY + centerBase.r * TILE + TILE / 2,
    };
    const homeOffsets = [
      [0, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];
    this.guardianHomes = homeOffsets.map(([dr, dc]) => {
      const near = this.findWalkableNear(centerBase.r + dr, centerBase.c + dc, 5);
      return {
        x: this.offsetX + near.c * TILE + TILE / 2,
        y: this.offsetY + near.r * TILE + TILE / 2,
      };
    });

    this.guardians = [];
    this.guardianGroup = this.physics.add.group();
    this.guardianSpawns = spawnRc.map(({ r, c }) => {
      const near = this.findWalkableNear(r, c, 8);
      return {
        x: this.offsetX + near.c * TILE + TILE / 2,
        y: this.offsetY + near.r * TILE + TILE / 2,
      };
    });

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
          fontFamily: FONT.pixel,
        })
        .setOrigin(0.5)
        .setDepth(5);
      g.guardianLabel = label;
    }

    this.physics.add.overlap(this.player, this.guardianGroup, (_p, g) => {
      if (!g.body?.enable) return;
      if ((g.respawnUntil ?? 0) > this.time.now) return;
      if (this.time.now < this.powerUntil) {
        this.sendGuardianToCenter(g);
        this.score += 40;
        this.playPickupFx(g.x, g.y, 0xd6ad60, "+40");
        this.updateHud();
        this.hint.setText(`¡Guardián disipado! · Poder: ${Math.ceil((this.powerUntil - this.time.now) / 1000)}s`);
        return;
      }
      if (this.hitCooldown > 0) return;
      const name = g.guardianType || "KUNKU";
      this.hitCooldown = 1800;
      this.lives -= 1;
      const now = this.time.now;
      if (this.cache.audio.exists("sfx_error") && now - this.lastErrorSfxAt >= 120) {
        this.sound.play("sfx_error", { volume: SFX_VOL.error });
        this.lastErrorSfxAt = now;
      }
      this.hint.setText(GUARDIAN_CATCH[name] || GUARDIAN_CATCH.KUNKU);
      this.time.delayedCall(2800, () => {
        this.hint.setText(
          "Recoge los orbes ancestrales para pasar de nivel; piezas y granos suman puntos.",
        );
      });
      if (this.lives <= 0) {
        const hi = Math.max(this.registry.get("mazeHighScore") ?? 0, this.score);
        this.registry.set("mazeHighScore", hi);
        this.registry.set("mazeLevel", 1);
        this.registry.remove("mazeCarryScore");
        this.registry.remove("mazeCarryLives");
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
      this.collectSingleBean(pod);
    });

    this.physics.add.overlap(this.player, this.powerPods, (_p, pod) => {
      if (!pod?.active) return;
      const px = pod.x;
      const py = pod.y;
      this.tweens.killTweensOf(pod);
      pod.destroy();
      this.playClippedSfx("sfx_relic", SFX_VOL.relic, 2000);
      this.powerPodsCollected += 1;
      this.score += 5;
      this.playPickupFx(px, py, 0xffdc66, "PODER");
      // Estilo Pac-Man: este item activa exactamente 10s para perseguir guardianes.
      this.activateGuardianHuntMode(10000);
      if (this.powerPodsCollected >= this.powerPodsTotal) {
        this.completeCurrentMazeLevel();
      } else {
        this.hint.setText(
          `Orbes ancestrales: ${this.powerPodsCollected}/${this.powerPodsTotal}. Sigue recolectando para pasar de nivel.`,
        );
      }
    });

    this.physics.add.overlap(this.player, this.vasijaSensor, () => {
      if (this.vasijaReached) return;
      if (this.time.now > this.vasijaHintCd) {
        this.vasijaHintCd = this.time.now + 2200;
        if (this.beansLeft > 0) {
          this.hint.setText(
            `Meta principal: ORBES ${this.powerPodsCollected}/${this.powerPodsTotal}. Granos: ${this.beansTotal - this.beansLeft}/${this.beansTotal}.`,
          );
        } else {
          this.hint.setText(
            `¡Cosecha lista! Falta objetivo principal: ORBES ${this.powerPodsCollected}/${this.powerPodsTotal}.`,
          );
        }
      }
    });

    if (!this.isMobileMazeUi) {
      this.buildSidePanel();
    }

    this.mazeMapExitText = this.add
      .text(LAYOUT.WIDTH - 12, LAYOUT.GAME_TOP + 12, "[ VOLVER AL MAPA ]", {
        fontSize: "10px",
        color: "#c8921a",
        fontFamily: FONT.heading,
      })
      .setOrigin(1, 0)
      .setDepth(25)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => exitToMainMap());

    this.hint = this.add
      .text(this.offsetX + mazePxW / 2, LAYOUT.HINT_TOP + 16, "", {
        fontSize: "12px",
        color: "#d8d0c8",
        align: "center",
        wordWrap: { width: mazePxW + this.panelWidth * 0.35 },
        fontFamily: FONT.body,
      })
      .setOrigin(0.5)
      .setDepth(25);

    this.hudTitle = this.add
      .text(LAYOUT.WIDTH / 2, 8, "JUEGO 3 - CACAO MAZE | Laberinto Cultural | 1280 x 720 px", {
        fontSize: "11px",
        color: "#c5a3ff",
        fontStyle: "bold",
        fontFamily: FONT.pixel,
      })
      .setOrigin(0.5, 0)
      .setDepth(25);

    this.hudLeft = this.add
      .text(16, 22, "", { fontSize: "11px", color: "#ffdd44", fontFamily: FONT.pixel })
      .setDepth(25);
    this.hudMid = this.add
      .text(LAYOUT.WIDTH / 2 - this.panelWidth / 2, 22, "", {
        fontSize: "11px",
        color: "#eeeeee",
        fontFamily: FONT.pixel,
      })
      .setOrigin(0.5, 0)
      .setDepth(25);
    this.hudTime = this.add
      .text(LAYOUT.WIDTH / 2, 40, "", { fontSize: "10px", color: "#aaa0c8", fontFamily: FONT.pixel })
      .setOrigin(0.5, 0)
      .setDepth(25);
    this.hudRight = this.add
      .text(LAYOUT.WIDTH - this.panelWidth - 28, 22, "", {
        fontSize: "11px",
        color: "#ffaaaa",
        fontFamily: FONT.pixel,
      })
      .setOrigin(1, 0)
      .setDepth(25);

    this.hint.setText(
      "Recolecta todos los ORBES para pasar de nivel; granos y piezas dan puntos. Flechas / WASD.",
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
      .text(px + 14, LAYOUT.GAME_TOP + 18, "4 GUARDIANES\nESPIRITUALES", {
        fontSize: "24px",
        color: "#e8c048",
        fontStyle: "bold",
        lineSpacing: 4,
        fontFamily: FONT.heading,
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
          fontFamily: FONT.pixel,
        })
        .setOrigin(0.5)
        .setDepth(8);
      this.add
        .text(px + 42, y, `${row.name}`, {
          fontSize: "19px",
          color: row.color,
          fontStyle: "bold",
          fontFamily: FONT.heading,
        })
        .setDepth(7);
      this.add
        .text(px + 42, y + 16, row.lore, {
          fontSize: "16px",
          color: "#d8d0c8",
          fontStyle: "bold",
          wordWrap: { width: PANEL_W - 36 },
          fontFamily: FONT.body,
        })
        .setDepth(7);
      this.add
        .text(px + 42, y + 34, row.role, {
          fontSize: "14px",
          color: "#9a9488",
          wordWrap: { width: PANEL_W - 36 },
          lineSpacing: 1,
          fontFamily: FONT.body,
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

    if (!this.isMobileMazeUi) {
      this.add
        .text(
          20,
          LAYOUT.CONTROLS_TOP + 14,
          "Flechas / WASD = Moverse | Joystick virtual en móvil",
          {
            fontSize: "10px",
            color: "#7a7288",
            wordWrap: { width: 820 },
            fontFamily: FONT.body,
          },
        )
        .setOrigin(0, 0);

      this.add
        .text(LAYOUT.WIDTH - 24, LAYOUT.CONTROLS_TOP + 18, "Palanda, Ecuador — Mayo Chinchipe · Marañón — 5.500 AP", {
          fontSize: "10px",
          color: "#9a8a68",
          fontFamily: FONT.body,
        })
        .setOrigin(1, 0);
    }
  }

  heartsLine() {
    const lost = Math.max(0, this.maxLives - this.lives);
    return "♥".repeat(Math.max(0, this.lives)) + "♡".repeat(lost);
  }

  /**
   * Victoria principal: último grano del laberinto. Evita doble disparo con vasija o tiempo.
   */
  completeCurrentMazeLevel() {
    if (this.vasijaReached) return;
    this.vasijaReached = true;
    if (this.cache.audio.exists("sfx_mission_complete")) {
      this.ensureSfxUnlocked();
      duckAmbientAudio({
        duckTo: SFX_VOL.duckMissionTo,
        holdMs: SFX_VOL.duckMissionHoldMs,
        restoreMs: SFX_VOL.duckMissionRestoreMs,
      });
      this.sound.play("sfx_mission_complete", { volume: SFX_VOL.mission });
    }
    if (this.level < MAX_MAZE_LEVEL) {
      this.score += 120;
      this.hint.setText("¡Recolectaste todos los orbes! Pasas al nivel final.");
      this.showMazeLevelWinOverlay(this.level + 1);
      return;
    }

    this.score += 180;
    const hi = Math.max(this.registry.get("mazeHighScore") ?? 0, this.score);
    this.registry.set("mazeHighScore", hi);
    this.registry.set("mazeLevel", 1);
    this.registry.remove("mazeCarryScore");
    this.registry.remove("mazeCarryLives");
    this.hint.setText("¡Nivel final superado! Ya puedes entregar el certificado.");
    this.scene.start("ResultScene", {
      game: "mazeWin",
      score: this.score,
      pieces: this.piecesFound,
      piecesTotal: this.piecesTotal,
      finalLevel: true,
    });
  }

  updateHud() {
    const got = this.beansTotal - this.beansLeft;
    this.hudLeft.setText(`GRANOS: ${got}/${this.beansTotal}`);
    const podsNow = `${this.powerPodsCollected ?? 0}/${this.powerPodsTotal ?? 4}`;
    this.hudMid.setText(`PIEZAS: ${this.piecesFound}/${this.piecesTotal} · ORBES: ${podsNow}`);
    const scared = this.time.now < this.powerUntil;
    const extra = scared ? `  PODER ${Math.ceil((this.powerUntil - this.time.now) / 1000)}s` : "";
    this.hudRight.setText(`${this.heartsLine()}     Nv. ${this.level}${extra}`);
    this.hudRight.setColor(scared ? "#aaddff" : "#ffaaaa");
  }

  /**
   * Entrada: listeners DOM (ev.code) + teclas Phaser. Movimiento Arcade con collider a muros.
   */
  readMazeSteer() {
    const j = this.player?.stickVector;
    const d = this._domMaze;
    const m = this.mazeKeys;
    const ex = this.externalTouchpadState;
    const exHasDirection = !!(ex && (ex.left || ex.right || ex.up || ex.down));
    let vx = 0;
    let vy = 0;
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
      const sx = piece.x;
      const sy = piece.y;
      piece.destroy();
      this.playClippedSfx("sfx_relic", SFX_VOL.relic, 2000);
      this.piecesFound += 1;
      this.score += 50;
      this.playPickupFx(sx, sy, 0xb78cff, "+50");
      this.updateHud();
      const idx = Math.max(0, Math.min(PIECE_FACTS.length - 1, this.piecesFound - 1));
      this.hint.setText(`¡PIEZA ${this.piecesFound}/4! +50 · DATO CULTURAL: ${PIECE_FACTS[idx]}`);
    }
  }

  patternStepForGuardian(g, gr, gc) {
    const orders = {
      KUNKU: [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ],
      SUMAK: [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ],
      ALLPA: [
        [0, -1],
        [-1, 0],
        [0, 1],
        [1, 0],
      ],
      WASI: [
        [-1, 0],
        [0, -1],
        [1, 0],
        [0, 1],
      ],
    };
    const seq = orders[g.guardianType] ?? orders.KUNKU;
    if (typeof g.patternIndex !== "number") g.patternIndex = 0;
    for (let i = 0; i < seq.length; i += 1) {
      const idx = (g.patternIndex + i) % seq.length;
      const [dr, dc] = seq[idx];
      if (this.walkable(gr + dr, gc + dc)) {
        g.patternIndex = (idx + 1) % seq.length;
        return { dr, dc };
      }
    }
    return { dr: 0, dc: 0 };
  }

  anyWalkableStep(gr, gc) {
    const dirs = Phaser.Utils.Array.Shuffle([
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]);
    for (const [dr, dc] of dirs) {
      if (this.walkable(gr + dr, gc + dc)) return { dr, dc };
    }
    return { dr: 0, dc: 0 };
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
        g.setTint(HUNT_GUARDIAN_COLOR);
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
      const cellKey = `${gr},${gc}`;
      if (g.lastCellKey === cellKey) {
        g.stuckTicks = (g.stuckTicks ?? 0) + 1;
      } else {
        g.stuckTicks = 0;
      }
      g.lastCellKey = cellKey;
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

      // Fallback común: si alguno se atasca o el path no existe, todos siguen su patrón.
      if (dr === 0 && dc === 0) {
        const step = this.patternStepForGuardian(g, gr, gc);
        dr = step.dr;
        dc = step.dc;
      }
      if (!this.walkable(gr + dr, gc + dc)) {
        const step = this.patternStepForGuardian(g, gr, gc);
        dr = step.dr;
        dc = step.dc;
      }
      if ((g.stuckTicks ?? 0) >= 2) {
        const step = this.anyWalkableStep(gr, gc);
        dr = step.dr;
        dc = step.dc;
      }

      if (dr === 0 && dc === 0) {
        g.setVelocity(0, 0);
      } else {
        this.applyGridMove(g, dr, dc, scared ? SCARED_GUARDIAN_SPEED : this.guardianSpeedPx);
      }
    }
  }

  update(time, delta) {
    if (!this.hudTime) return;
    if (this._levelWinOverlayActive) {
      if (this.player?.body) this.player.setVelocity(0, 0);
      for (const g of this.guardians || []) {
        g?.setVelocity?.(0, 0);
      }
      this.updateHud();
      return;
    }

    const elapsed = this.time.now - this.levelStartTime;
    this.hudTime.setText(`TIEMPO ${fmtTime(elapsed)}`);

    if (this.hitCooldown > 0) {
      this.hitCooldown -= delta;
    }
    this.updatePacPlayer();
    this.collectBeansByProximity();
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
