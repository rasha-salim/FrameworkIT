import Phaser from 'phaser';

export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private speed = 200;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);

    this.cursors = scene.input.keyboard!.createCursorKeys();
  }

  update(): void {
    const { left, right } = this.cursors;

    if (left.isDown) {
      this.sprite.setVelocityX(-this.speed);
    } else if (right.isDown) {
      this.sprite.setVelocityX(this.speed);
    } else {
      this.sprite.setVelocityX(0);
    }
  }

  disableInput(): void {
    this.sprite.setVelocity(0, 0);
  }
}
