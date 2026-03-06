import Phaser from 'phaser';

export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private speed = 200;
  private deceleration = 600;
  private isWalking = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, 'player', 0);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDrag(this.deceleration, 0);

    this.cursors = scene.input.keyboard!.createCursorKeys();
  }

  update(): void {
    const { left, right } = this.cursors;

    if (left.isDown) {
      this.sprite.setVelocityX(-this.speed);
      this.sprite.setFlipX(true);

      if (!this.isWalking) {
        this.sprite.play('player-walk');
        this.isWalking = true;
      }
    } else if (right.isDown) {
      this.sprite.setVelocityX(this.speed);
      this.sprite.setFlipX(false);

      if (!this.isWalking) {
        this.sprite.play('player-walk');
        this.isWalking = true;
      }
    } else {
      // Let drag handle deceleration instead of instant stop
      if (this.isWalking && Math.abs(this.sprite.body!.velocity.x) < 10) {
        this.sprite.setVelocityX(0);
        this.sprite.play('player-idle');
        this.isWalking = false;
      }
    }
  }

  disableInput(): void {
    this.sprite.setVelocity(0, 0);
    if (this.isWalking) {
      this.sprite.play('player-idle');
      this.isWalking = false;
    }
  }
}
