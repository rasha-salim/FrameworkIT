import Phaser from 'phaser';
import { Player } from '../world/Player';
import { NPC } from '../world/NPC';
import { EventBus } from '../core/EventBus';
import { useGameStore } from '../core/GameStore';

export class WorldScene extends Phaser.Scene {
  private player!: Player;
  private sarah!: NPC;
  private eKey!: Phaser.Input.Keyboard.Key;
  private isNearNPC = false;
  private serverGlow!: Phaser.GameObjects.Rectangle;
  private glowTween!: Phaser.Tweens.Tween;

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    this.buildRoom();
    this.buildServerRack();

    this.player = new Player(this, 150, 450);
    this.sarah = new NPC(this, 500, 450, 'Sarah (SRE)', 'sarah');

    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.physics.add.overlap(
      this.player.sprite,
      this.sarah.sprite,
      () => { this.isNearNPC = true; },
      undefined,
      this
    );

    EventBus.on('puzzle:back-to-world', () => {
      useGameStore.getState().setPhase('exploring');
      this.scene.resume();
    });

    EventBus.on('dialogue:ended', () => {
      useGameStore.getState().setPhase('exploring');
      this.scene.resume();
    });
  }

  update(): void {
    const phase = useGameStore.getState().phase;
    if (phase !== 'exploring') {
      this.player.disableInput();
      return;
    }

    this.player.update();

    const dist = Phaser.Math.Distance.Between(
      this.player.sprite.x,
      this.player.sprite.y,
      this.sarah.sprite.x,
      this.sarah.sprite.y
    );

    this.isNearNPC = dist < 80;
    this.sarah.showPrompt(this.isNearNPC);

    if (this.isNearNPC && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      EventBus.emit('npc:interact', this.sarah.npcId);
      useGameStore.getState().setPhase('dialogue');
      this.player.disableInput();
    }
  }

  private buildRoom(): void {
    // Dark gradient background — server room aesthetic
    const bg = this.add.graphics();

    // Ceiling
    bg.fillStyle(0x0a0e1a, 1);
    bg.fillRect(0, 0, 1024, 200);

    // Walls
    bg.fillStyle(0x12182d, 1);
    bg.fillRect(0, 200, 1024, 250);

    // Floor
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 450, 1024, 150);

    // Floor line
    bg.lineStyle(2, 0x2a2a4e, 0.5);
    bg.lineBetween(0, 480, 1024, 480);

    // Ceiling lights
    for (let x = 100; x < 1024; x += 200) {
      bg.fillStyle(0x334466, 0.6);
      bg.fillRect(x - 20, 0, 40, 8);
      bg.fillStyle(0x6688aa, 0.15);
      bg.fillTriangle(x - 60, 200, x + 60, 200, x, 8);
    }
  }

  private buildServerRack(): void {
    // Server rack on the right side
    const rack = this.add.rectangle(850, 400, 64, 100, 0x222244);
    rack.setStrokeStyle(2, 0x334466);

    // Server slots
    for (let i = 0; i < 4; i++) {
      this.add.rectangle(850, 365 + i * 22, 50, 16, 0x1a1a3e)
        .setStrokeStyle(1, 0x445577);
    }

    // Red glow — overloaded server
    this.serverGlow = this.add.rectangle(850, 400, 80, 116, 0xff2222, 0.1);
    this.glowTween = this.tweens.add({
      targets: this.serverGlow,
      alpha: { from: 0.05, to: 0.2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Status light
    const light = this.add.circle(882, 358, 4, 0xff3333);
    this.tweens.add({
      targets: light,
      alpha: { from: 0.3, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Label
    this.add.text(850, 460, 'OVERLOADED', {
      fontSize: '10px',
      color: '#ff4444',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
  }
}
