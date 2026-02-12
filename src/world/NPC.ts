import Phaser from 'phaser';

export class NPC {
  sprite: Phaser.Physics.Arcade.Sprite;
  private nameLabel: Phaser.GameObjects.Text;
  private promptLabel: Phaser.GameObjects.Text;
  readonly npcId: string;

  constructor(scene: Phaser.Scene, x: number, y: number, name: string, id: string) {
    this.npcId = id;

    this.sprite = scene.physics.add.sprite(x, y, 'npc-sarah');
    this.sprite.setImmovable(true);

    this.nameLabel = scene.add.text(x, y - 40, name, {
      fontSize: '14px',
      color: '#44cc66',
      fontFamily: 'monospace',
    });
    this.nameLabel.setOrigin(0.5, 1);

    this.promptLabel = scene.add.text(x, y + 36, '[E] Talk', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#00000088',
      padding: { x: 6, y: 3 },
    });
    this.promptLabel.setOrigin(0.5, 0);
    this.promptLabel.setVisible(false);
  }

  showPrompt(visible: boolean): void {
    this.promptLabel.setVisible(visible);
  }
}
