import Phaser from "phaser";

/**
 * Jugador base: teclado WASD/flechas + preparado para táctil (velocidad; UI joystick en fase 2).
 * Los límites del mundo deben acotarse a la zona de juego en cada escena (physics.world.setBounds).
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} [textureKey='ph_player']
   */
  constructor(scene, x, y, textureKey = "ph_player") {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.body.setSize(Math.min(this.width, 28), Math.min(this.height, 28));
    this.speed = 220;
    this.cursors = scene.input.keyboard?.createCursorKeys();
    this.wasd = scene.input.keyboard?.addKeys("W,S,A,D");
  }

  updateMovement() {
    let vx = 0;
    let vy = 0;
    if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
      vx = -1;
    } else if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
      vx = 1;
    }
    if (this.cursors?.up.isDown || this.wasd?.W.isDown) {
      vy = -1;
    } else if (this.cursors?.down.isDown || this.wasd?.S.isDown) {
      vy = 1;
    }
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }
    this.setVelocity(vx * this.speed, vy * this.speed);
  }
}
