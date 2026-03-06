import Phaser from 'phaser';

export interface NPCConfig {
  spriteKey?: string;
  labelColor?: string;
}

export class NPC {
  sprite: Phaser.Physics.Arcade.Sprite;
  private nameLabel: Phaser.GameObjects.Text;
  private promptLabel: Phaser.GameObjects.Text;
  private promptBg: Phaser.GameObjects.Rectangle;
  readonly npcId: string;
  private scene: Phaser.Scene;
  private idleTween: Phaser.Tweens.Tween;
  private baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, name: string, id: string, config?: NPCConfig) {
    this.npcId = id;
    this.scene = scene;
    this.baseY = y;

    const spriteKey = config?.spriteKey || 'npc-sarah';
    const labelColor = config?.labelColor || '#44cc66';

    this.sprite = scene.physics.add.sprite(x, y, spriteKey);
    this.sprite.setImmovable(true);

    this.nameLabel = scene.add.text(x, y - 40, name, {
      fontSize: '14px',
      color: labelColor,
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.nameLabel.setOrigin(0.5, 1);

    // Prompt background for better readability
    this.promptBg = scene.add.rectangle(x, y + 44, 80, 22, 0x000000, 0.7);
    this.promptBg.setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(labelColor).color, 0.5);
    this.promptBg.setVisible(false);

    this.promptLabel = scene.add.text(x, y + 44, '[E] Talk', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    this.promptLabel.setOrigin(0.5, 0.5);
    this.promptLabel.setVisible(false);

    // Idle breathing animation - gentle bob
    this.idleTween = scene.tweens.add({
      targets: [this.sprite],
      y: { from: y, to: y - 3 },
      duration: 1800 + Math.random() * 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        // Keep label and prompt aligned with sprite
        this.nameLabel.setY(this.sprite.y - 40);
        this.promptBg.setY(this.sprite.y + 44);
        this.promptLabel.setY(this.sprite.y + 44);
      },
    });
  }

  showPrompt(visible: boolean): void {
    this.promptLabel.setVisible(visible);
    this.promptBg.setVisible(visible);
  }

  setVisible(visible: boolean): void {
    this.sprite.setVisible(visible);
    this.nameLabel.setVisible(visible);
    if (!visible) {
      this.promptLabel.setVisible(false);
      this.promptBg.setVisible(false);
    }
  }

  destroy(): void {
    this.idleTween.destroy();
    this.sprite.destroy();
    this.nameLabel.destroy();
    this.promptLabel.destroy();
    this.promptBg.destroy();
  }
}
