import Phaser from "phaser";

/**
 * Guardián del minijuego 3 — movimiento lo calcula Game3Scene (BFS / patrulla / aleatorio).
 */
export default class Guardian extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {'KUNKU'|'SUMAK'|'ALLPA'|'WASI'} type
   */
  constructor(scene, x, y, type) {
    super(scene, x, y, "ph_guardian");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.guardianType = type;
    this.body.setSize(26, 26);
    this.setTint(this.tintForType(type));
  }

  tintForType(type) {
    switch (type) {
      case "KUNKU":
        return 0xdc3232;
      case "SUMAK":
        return 0x3290dc;
      case "ALLPA":
        return 0x32aa50;
      case "WASI":
        return 0xdcb432;
      default:
        return 0xffffff;
    }
  }
}
