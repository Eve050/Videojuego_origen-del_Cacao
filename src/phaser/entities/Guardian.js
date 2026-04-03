import Phaser from "phaser";

const TEXTURE_BY_TYPE = {
  KUNKU: "ph_maze_g_kunku",
  SUMAK: "ph_maze_g_sumak",
  ALLPA: "ph_maze_g_allpa",
  WASI: "ph_maze_g_wasi",
};

/**
 * Guardián del minijuego 3 — espíritus del laberinto (no fantasmas genéricos).
 * Movimiento: Game3Scene (BFS / patrulla / aleatorio).
 */
export default class Guardian extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {'KUNKU'|'SUMAK'|'ALLPA'|'WASI'} type
   */
  constructor(scene, x, y, type) {
    const key = TEXTURE_BY_TYPE[type] ?? "ph_maze_g_kunku";
    super(scene, x, y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.guardianType = type;
    this.clearTint();
    if (this.body) {
      this.body.setCircle(11, 5, 9);
      this.body.setImmovable(true);
    }
  }
}
