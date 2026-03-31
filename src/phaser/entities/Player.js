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
    /** Doc J1 §2.4: 200 px/s */
    this.speed = 200;
    /** Vector normalizado desde joystick virtual (0,0 = usar solo teclado). */
    this.stickVector = null;
    this.cursors = scene.input.keyboard?.createCursorKeys();
    this.wasd = scene.input.keyboard?.addKeys("W,S,A,D");
  }

  updateMovement() {
    let vx = 0;
    let vy = 0;
    const j = this.stickVector;
    if (j && (j.x !== 0 || j.y !== 0)) {
      vx = j.x;
      vy = j.y;
      const len = Math.hypot(vx, vy) || 1;
      if (len > 1) {
        vx /= len;
        vy /= len;
      }
    } else {
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
    }
    this.setVelocity(vx * this.speed, vy * this.speed);
  }
}
