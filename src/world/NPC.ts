import Phaser from 'phaser';

export interface NPCConfig {
  spriteKey?: string;
  labelColor?: string;
}

export class NPC {
  sprite: Phaser.Physics.Arcade.Sprite;
  private nameLabel: Phaser.GameObjects.Text;
  private promptLabel: Phaser.GameObjects.Text;
  readonly npcId: string;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, name: string, id: string, config?: NPCConfig) {
    this.npcId = id;
    this.scene = scene;

    const spriteKey = config?.spriteKey || 'npc-sarah';
    const labelColor = config?.labelColor || '#44cc66';

    this.sprite = scene.physics.add.sprite(x, y, spriteKey);
    this.sprite.setImmovable(true);

    this.nameLabel = scene.add.text(x, y - 40, name, {
      fontSize: '14px',
      color: labelColor,
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

  setVisible(visible: boolean): void {
    this.sprite.setVisible(visible);
    this.nameLabel.setVisible(visible);
    if (!visible) {
      this.promptLabel.setVisible(false);
    }
  }

  destroy(): void {
    this.sprite.destroy();
    this.nameLabel.destroy();
    this.promptLabel.destroy();
  }
}
