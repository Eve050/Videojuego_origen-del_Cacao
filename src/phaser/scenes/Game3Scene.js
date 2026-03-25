import Phaser from "phaser";
import { LAYOUT } from "../layout.js";
import Player from "../entities/Player.js";
import Guardian from "../entities/Guardian.js";
import { exitToMainMap } from "../data/introCopy.js";

/** . = vacío, # = muro, o = grano, p = pieza arqueológica */
const MAZE = [
  "################",
  "#oo..........oo#",
  "#.##.####.##..o#",
  "#....o.....#..p#",
  "#.##.####..o...#",
  "#....o.....##..#",
  "#.####.####.p..#",
  "#o...p......o.p#",
  "################",
];

const TILE = 40;

const GUARDIAN_CATCH = {
  KUNKU: "¡El guardián del fuego te encontró! Cuidado.",
  SUMAK: "¡Sumak predijo tu camino! Cambia de dirección.",
  ALLPA: "¡Allpa apareció de la nada! Mantente alerta.",
  WASI: "¡Wasi protege las reliquias del templo sagrado!",
};

/**
 * Minijuego 3 — Cacao Maze (propuesta: Pac-Man cultural, 3 vidas, piezas 0/4, granos).
 */
export default class Game3Scene extends Phaser.Scene {
  constructor() {
    super({ key: "Game3Scene" });
  }

  create() {
    let lv = Number(this.registry.get("mazeLevel")) || 1;
    if (lv < 1) lv = 1;
    if (lv > 3) lv = 3;
    this.mazeLevel = lv;
    this.guardianSpeed = 1 + (this.mazeLevel - 1) * 0.38;

    this.beansTotal = 0;
    for (const row of MAZE) {
      for (const ch of row) {
        if (ch === "o") this.beansTotal += 1;
      }
    }

    this.beansLeft = this.beansTotal;
    this.piecesFound = 0;
    this.piecesTotal = 0;
    for (const row of MAZE) {
      for (const ch of row) {
        if (ch === "p") this.piecesTotal += 1;
      }
    }

    this.score = 0;
    this.lives = 3;
    this.level = this.mazeLevel;
    this.hitCooldown = 0;
    this.startGrid = { c: 1, r: 1 };

    this.drawChrome();

    this.physics.world.setBounds(0, LAYOUT.GAME_TOP, LAYOUT.WIDTH, LAYOUT.GAME_H);

    const rows = MAZE.length;
    const cols = MAZE[0].length;
    const offsetX = (LAYOUT.WIDTH - cols * TILE) / 2;
    const offsetY = LAYOUT.GAME_TOP + (LAYOUT.GAME_H - rows * TILE) / 2;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    this.walls = this.physics.add.staticGroup();
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const ch = MAZE[r][c];
        if (ch === "#") {
          const wx = offsetX + c * TILE + TILE / 2;
          const wy = offsetY + r * TILE + TILE / 2;
          this.walls.create(wx, wy, "ph_wall");
        }
      }
    }

    this.player = new Player(
      this,
      offsetX + this.startGrid.c * TILE + TILE / 2,
      offsetY + this.startGrid.r * TILE + TILE / 2,
    );
    this.player.setTexture("ph_player");
    this.player.speed = 180;
    this.physics.add.collider(this.player, this.walls);

    const types = ["KUNKU", "SUMAK", "ALLPA", "WASI"];
    this.guardians = [];
    this.guardianGroup = this.physics.add.group();
    const gx = [offsetX + 8 * TILE, offsetX + 4 * TILE, offsetX + 12 * TILE, offsetX + 6 * TILE];
    const gy = [offsetY + 4 * TILE, offsetY + 6 * TILE, offsetY + 2 * TILE, offsetY + 7 * TILE];
    for (let i = 0; i < 4; i += 1) {
      const g = new Guardian(this, gx[i], gy[i], types[i]);
      this.physics.add.collider(g, this.walls);
      this.guardians.push(g);
      this.guardianGroup.add(g);
    }

    this.physics.add.overlap(this.player, this.guardianGroup, (_p, g) => {
      if (this.hitCooldown > 0) return;
      const name = g.guardianType || "KUNKU";
      this.hitCooldown = 1800;
      this.lives -= 1;
      this.hint.setText(GUARDIAN_CATCH[name] || GUARDIAN_CATCH.KUNKU);
      this.time.delayedCall(2800, () => {
        this.hint.setText("PANTALLA: DURANTE EL JUEGO — Granos, piezas, vidas y nivel en el panel superior.");
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
        this.player.setPosition(
          offsetX + this.startGrid.c * TILE + TILE / 2,
          offsetY + this.startGrid.r * TILE + TILE / 2,
        );
        this.player.setVelocity(0, 0);
      }
    });

    this.beans = this.physics.add.group();
    this.pieces = this.physics.add.group();

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const ch = MAZE[r][c];
        const px = offsetX + c * TILE + TILE / 2;
        const py = offsetY + r * TILE + TILE / 2;
        if (ch === "o") {
          const pod = this.physics.add.sprite(px, py, "ph_pod");
          pod.body.setImmovable(true);
          pod.body.setAllowGravity(false);
          this.beans.add(pod);
        } else if (ch === "p") {
          const piece = this.physics.add.sprite(px, py, "ph_piece");
          piece.body.setImmovable(true);
          piece.body.setAllowGravity(false);
          this.pieces.add(piece);
        }
      }
    }

    this.physics.add.overlap(this.player, this.beans, (_p, pod) => {
      pod.destroy();
      this.beansLeft -= 1;
      this.score += 10;
      this.checkWin();
    });

    this.physics.add.overlap(this.player, this.pieces, (_p, piece) => {
      piece.destroy();
      this.piecesFound += 1;
      this.score += 50;
      this.flashFact(this.piecesFound);
      this.checkWin();
    });

    this.hud = this.add.text(24, 14, "", {
      fontSize: "14px",
      color: "#f9f2dd",
    });

    this.add
      .text(LAYOUT.WIDTH - 24, 14, "[ VOLVER AL MAPA ]", { fontSize: "11px", color: "#c8921a" })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => exitToMainMap());

    this.hint = this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.HINT_TOP + 18, "", {
        fontSize: "13px",
        color: "#c8c0b0",
        align: "center",
        wordWrap: { width: 1100 },
      })
      .setOrigin(0.5);

    this.hint.setText("PANTALLA: DURANTE EL JUEGO — Granos, piezas, vidas y nivel en el panel superior.");
    this.updateHud();
  }

  flashFact(n) {
    const facts = [
      "Santa Ana – La Florida: la evidencia más antigua del uso de cacao en el mundo. 5.500 AP.",
      "La plaza ceremonial circular tiene 40 metros de diámetro. Centro de la vida de la cultura Mayo Chinchipe – Marañón.",
      "En 2024, 1.395 personas visitaron el sitio. En 2017 eran solo 456. Crecimiento del 200%.",
      "En 2025–2026 se registraron más de 70 nuevos sitios arqueológicos en los cantones Palanda y Chinchipe.",
    ];
    const msg = facts[Math.min(n - 1, facts.length - 1)] || facts[0];
    this.hint.setText(`DATO REAL — ${msg}`);
  }

  checkWin() {
    if (this.beansLeft <= 0) {
      this.scene.start("ResultScene", {
        game: "mazeWin",
        score: this.score,
        pieces: this.piecesFound,
      });
    }
  }

  drawChrome() {
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HEIGHT, 0x1a1a2e).setOrigin(0);
    this.add.rectangle(0, LAYOUT.GAME_TOP, LAYOUT.WIDTH, LAYOUT.GAME_H, 0x0f1412).setOrigin(0);
    this.add.rectangle(0, 0, LAYOUT.WIDTH, LAYOUT.HUD_TOP_H, 0x101820, 0.95).setOrigin(0);
    this.add.rectangle(0, LAYOUT.HINT_TOP, LAYOUT.WIDTH, LAYOUT.HINT_BAR_H, 0x151820, 0.9).setOrigin(0);
    this.add.rectangle(0, LAYOUT.CONTROLS_TOP, LAYOUT.WIDTH, LAYOUT.CONTROLS_H_ACTUAL, 0x0a0e12, 0.92).setOrigin(0);
    this.add
      .text(LAYOUT.WIDTH / 2, LAYOUT.CONTROLS_TOP + 52, "CACAO MAZE — Laberinto cultural Mayo Chinchipe – Marañón (arte 2D y mapa final pendientes de entrega).", {
        fontSize: "11px",
        color: "#666666",
        align: "center",
        wordWrap: { width: 1100 },
      })
      .setOrigin(0.5);
  }

  heartsLine() {
    return "♥".repeat(Math.max(0, this.lives)) + "♡".repeat(Math.max(0, 3 - this.lives));
  }

  updateHud() {
    this.hud.setText(
      `Granos restantes: ${this.beansLeft}/${this.beansTotal}  ·  Piezas: ${this.piecesFound}/${this.piecesTotal}  ·  Vidas: ${this.heartsLine()}  ·  Nivel: ${this.level}  ·  Puntos: ${this.score}`,
    );
  }

  update(time, delta) {
    if (this.hitCooldown > 0) {
      this.hitCooldown -= delta;
    }
    this.player.updateMovement();
    this.guardianGroup.getChildren().forEach((g) => g.updateStub(time, this.guardianSpeed));
    this.hud.setText(
      `Granos restantes: ${this.beansLeft}/${this.beansTotal}  ·  Piezas: ${this.piecesFound}/${this.piecesTotal}  ·  Vidas: ${this.heartsLine()}  ·  Nivel: ${this.level}  ·  Puntos: ${this.score}`,
    );
  }
}
