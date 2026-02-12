import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Generate placeholder sprites as colored rectangles
    this.createColoredRect('player', 32, 48, 0xffffff);
    this.createColoredRect('npc-sarah', 32, 48, 0x44cc66);
    this.createColoredRect('server-rack', 64, 80, 0x882222);
    this.createColoredRect('server-light', 8, 8, 0xff3333);
  }

  create(): void {
    this.scene.start('WorldScene');
  }

  private createColoredRect(key: string, w: number, h: number, color: number): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
