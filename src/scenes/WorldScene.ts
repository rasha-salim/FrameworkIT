import Phaser from 'phaser';
import { Player } from '../world/Player';
import { NPC } from '../world/NPC';
import { EventBus } from '../core/EventBus';
import { useGameStore } from '../core/GameStore';

interface ServerRackVisuals {
  rack: Phaser.GameObjects.Rectangle;
  slots: Phaser.GameObjects.Rectangle[];
  glow: Phaser.GameObjects.Rectangle;
  glowTween: Phaser.Tweens.Tween;
  statusLight: Phaser.GameObjects.Arc;
  statusLightTween: Phaser.Tweens.Tween;
  label: Phaser.GameObjects.Text;
}

export class WorldScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private eKey!: Phaser.Input.Keyboard.Key;
  private nearbyNPC: NPC | null = null;
  private serverRack!: ServerRackVisuals;
  private currentChapter: string = '';
  private lastPuzzleCompleted: boolean = false;

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    this.buildRoom();
    this.serverRack = this.buildServerRack();

    this.player = new Player(this, 150, 450);

    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Set up NPCs based on current chapter
    this.setupNPCs();

    EventBus.on('puzzle:back-to-world', () => {
      useGameStore.getState().setPhase('exploring');
      this.scene.resume();
    });

    EventBus.on('dialogue:ended', () => {
      useGameStore.getState().setPhase('exploring');
      this.scene.resume();
      this.refreshWorldState();
    });

    EventBus.on('chapter:advanced', () => {
      this.refreshWorldState();
    });

    this.refreshWorldState();
  }

  update(): void {
    const phase = useGameStore.getState().phase;
    if (phase !== 'exploring') {
      this.player.disableInput();
      // Disable Phaser keyboard capture so React inputs (textareas, etc.) receive key events
      if (this.input.keyboard) {
        this.input.keyboard.enabled = false;
      }
      return;
    }

    // Re-enable keyboard when back to exploring
    if (this.input.keyboard && !this.input.keyboard.enabled) {
      this.input.keyboard.enabled = true;
    }

    this.player.update();

    const gameState = useGameStore.getState();
    if (gameState.currentChapter !== this.currentChapter) {
      this.refreshWorldState();
    }

    if (gameState.puzzleCompleted !== this.lastPuzzleCompleted) {
      this.lastPuzzleCompleted = gameState.puzzleCompleted;
      this.updateServerRackState();
    }

    // Find nearest NPC
    this.nearbyNPC = null;
    let closestDist = Infinity;

    for (const npc of this.npcs) {
      if (!npc.sprite.visible) continue;

      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x,
        this.player.sprite.y,
        npc.sprite.x,
        npc.sprite.y
      );

      if (dist < 80 && dist < closestDist) {
        closestDist = dist;
        this.nearbyNPC = npc;
      }

      npc.showPrompt(false);
    }

    if (this.nearbyNPC) {
      this.nearbyNPC.showPrompt(true);

      if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
        EventBus.emit('npc:interact', this.nearbyNPC.npcId);
        useGameStore.getState().setPhase('dialogue');
        this.player.disableInput();
      }
    }
  }

  private setupNPCs(): void {
    for (const npc of this.npcs) {
      npc.destroy();
    }
    this.npcs = [];

    const chapter = useGameStore.getState().currentChapter;
    this.currentChapter = chapter;

    const sarah = new NPC(this, 500, 450, 'Sarah (SRE)', 'sarah', {
      spriteKey: 'npc-sarah',
      labelColor: '#44cc66',
    });
    this.npcs.push(sarah);

    this.physics.add.overlap(
      this.player.sprite,
      sarah.sprite,
      () => {},
      undefined,
      this
    );

    if (chapter === '02-caching' || chapter === '03-databases' || chapter === '04-rate-limiting' || useGameStore.getState().isChapterCompleted('01-load-balancing')) {
      const marcus = new NPC(this, 700, 450, 'Marcus (Senior Eng)', 'marcus', {
        spriteKey: 'npc-marcus',
        labelColor: '#8866cc',
      });
      this.npcs.push(marcus);

      this.physics.add.overlap(
        this.player.sprite,
        marcus.sprite,
        () => {},
        undefined,
        this
      );
    }
  }

  private refreshWorldState(): void {
    const gameState = useGameStore.getState();
    const chapter = gameState.currentChapter;

    if (chapter !== this.currentChapter) {
      this.setupNPCs();
    }

    this.lastPuzzleCompleted = gameState.puzzleCompleted;
    this.updateServerRackState();
  }

  private updateServerRackState(): void {
    const gameState = useGameStore.getState();
    const currentChapterDone = gameState.puzzleCompleted;
    const completedCount = gameState.completedChapters.length;

    if (currentChapterDone || completedCount > 0) {
      this.serverRack.glow.fillColor = 0x22cc44;
      this.serverRack.glow.fillAlpha = 0.08;
      this.serverRack.glowTween.stop();
      this.tweens.add({
        targets: this.serverRack.glow,
        alpha: { from: 0.04, to: 0.12 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
      });

      this.serverRack.statusLight.fillColor = 0x44cc66;
      this.serverRack.statusLightTween.stop();
      this.tweens.add({
        targets: this.serverRack.statusLight,
        alpha: { from: 0.6, to: 1 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
      });

      if (completedCount >= 3) {
        this.serverRack.label.setText('ALL SYSTEMS GO');
        this.serverRack.label.setColor('#44cc66');
      } else if (completedCount >= 1 || currentChapterDone) {
        this.serverRack.label.setText('STABILIZED');
        this.serverRack.label.setColor('#44cc66');
      }

      for (const slot of this.serverRack.slots) {
        slot.fillColor = 0x1a2e1a;
        slot.setStrokeStyle(1, 0x337744);
      }
    } else {
      this.serverRack.glow.fillColor = 0xff2222;
      this.serverRack.glow.fillAlpha = 0.1;

      this.serverRack.statusLight.fillColor = 0xff3333;

      this.serverRack.label.setText('OVERLOADED');
      this.serverRack.label.setColor('#ff4444');

      for (const slot of this.serverRack.slots) {
        slot.fillColor = 0x1a1a3e;
        slot.setStrokeStyle(1, 0x445577);
      }
    }
  }

  private buildRoom(): void {
    const bg = this.add.graphics();

    // Ceiling (dark)
    bg.fillStyle(0x080c16, 1);
    bg.fillRect(0, 0, 1024, 200);

    // Back wall with subtle gradient bands
    bg.fillStyle(0x10162a, 1);
    bg.fillRect(0, 200, 1024, 100);
    bg.fillStyle(0x121830, 1);
    bg.fillRect(0, 300, 1024, 80);
    bg.fillStyle(0x141a35, 1);
    bg.fillRect(0, 380, 1024, 70);

    // Floor
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 450, 1024, 150);

    // Floor tiles (subtle grid)
    bg.lineStyle(1, 0x222244, 0.3);
    for (let x = 0; x < 1024; x += 64) {
      bg.lineBetween(x, 450, x, 600);
    }
    bg.lineStyle(1, 0x222244, 0.2);
    bg.lineBetween(0, 480, 1024, 480);
    bg.lineBetween(0, 520, 1024, 520);
    bg.lineBetween(0, 560, 1024, 560);

    // Floor highlight line (where wall meets floor)
    bg.lineStyle(2, 0x2a2a4e, 0.6);
    bg.lineBetween(0, 450, 1024, 450);

    // Ceiling lights with softer cones
    for (let x = 100; x < 1024; x += 200) {
      // Light fixture
      bg.fillStyle(0x445577, 0.8);
      bg.fillRect(x - 24, 0, 48, 6);
      bg.fillStyle(0x556688, 0.9);
      bg.fillRect(x - 16, 6, 32, 4);

      // Light cone (layered for gradient effect)
      bg.fillStyle(0x8899bb, 0.04);
      bg.fillTriangle(x - 80, 200, x + 80, 200, x, 10);
      bg.fillStyle(0x8899bb, 0.06);
      bg.fillTriangle(x - 50, 200, x + 50, 200, x, 10);
      bg.fillStyle(0xaabbdd, 0.03);
      bg.fillTriangle(x - 30, 200, x + 30, 200, x, 10);
    }

    // Wall panels (subtle vertical lines suggesting server room panels)
    bg.lineStyle(1, 0x1a2040, 0.4);
    for (let x = 0; x < 1024; x += 128) {
      bg.lineBetween(x, 200, x, 450);
    }

    // Baseboard
    bg.fillStyle(0x0e1220, 1);
    bg.fillRect(0, 445, 1024, 5);

    // Ambient floor glow near server rack
    bg.fillStyle(0xff2222, 0.02);
    bg.fillRect(780, 450, 160, 150);
  }

  private buildServerRack(): ServerRackVisuals {
    // Server rack on the right side -- taller and more detailed
    const rack = this.add.rectangle(850, 390, 72, 120, 0x1a1a33);
    rack.setStrokeStyle(2, 0x334466);

    // Rack top cap
    this.add.rectangle(850, 328, 76, 6, 0x334466);

    // Server slots (6 slots)
    const slots: Phaser.GameObjects.Rectangle[] = [];
    for (let i = 0; i < 6; i++) {
      const slot = this.add.rectangle(850, 345 + i * 18, 56, 12, 0x1a1a3e);
      slot.setStrokeStyle(1, 0x445577);
      slots.push(slot);

      // Tiny LED per slot
      const ledColor = i < 3 ? 0x44cc66 : 0xff3333;
      const led = this.add.circle(878, 345 + i * 18, 2, ledColor, 0.6);
      this.tweens.add({
        targets: led,
        alpha: { from: 0.3, to: 0.8 },
        duration: 600 + i * 200,
        yoyo: true,
        repeat: -1,
      });
    }

    // Glow effect
    const glow = this.add.rectangle(850, 390, 88, 130, 0xff2222, 0.1);
    const glowTween = this.tweens.add({
      targets: glow,
      alpha: { from: 0.05, to: 0.2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Status light
    const statusLight = this.add.circle(882, 340, 5, 0xff3333);
    const statusLightTween = this.tweens.add({
      targets: statusLight,
      alpha: { from: 0.3, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Label
    const label = this.add.text(850, 460, 'OVERLOADED', {
      fontSize: '10px',
      color: '#ff4444',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    });
    label.setOrigin(0.5, 0);

    return { rack, slots, glow, glowTween, statusLight, statusLightTween, label };
  }
}
