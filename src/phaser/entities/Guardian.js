import Phaser from "phaser";

/**
 * Guardián del minijuego 3 — comportamiento KUNKU | SUMAK | ALLPA | WASI (stub hasta pathfinding).
 * @see documento técnico: IA por tipo.
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
        return 0xff6666;
      case "SUMAK":
        return 0x7ec8e8;
      case "ALLPA":
        return 0x5cb85c;
      case "WASI":
        return 0xd4af37;
      default:
        return 0xffffff;
    }
  }

  /**
   * Movimiento simple de prueba (reemplazar por chase / intercept / random / protect).
   */
  /**
   * @param {number} time
   * @param {number} [speedMult=1] — Nivel laberinto (propuesta: 1–3).
   */
  updateStub(time, speedMult = 1) {
    const t = time * speedMult;
    const wobble = Math.sin(t / 400) * 40 * speedMult;
    this.setVelocity(wobble, Math.cos(t / 500) * 60 * speedMult);
  }
}
