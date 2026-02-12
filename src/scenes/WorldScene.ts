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
      // Refresh world state after dialogue (chapter may have advanced)
      this.refreshWorldState();
    });

    EventBus.on('chapter:advanced', () => {
      this.refreshWorldState();
    });

    // Initial state sync
    this.refreshWorldState();
  }

  update(): void {
    const phase = useGameStore.getState().phase;
    if (phase !== 'exploring') {
      this.player.disableInput();
      return;
    }

    this.player.update();

    // Check chapter changes
    const gameState = useGameStore.getState();
    if (gameState.currentChapter !== this.currentChapter) {
      this.refreshWorldState();
    }

    // Check puzzle completion changes (for live server rack updates)
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
    // Clear existing NPCs
    for (const npc of this.npcs) {
      npc.destroy();
    }
    this.npcs = [];

    const chapter = useGameStore.getState().currentChapter;
    this.currentChapter = chapter;

    // Sarah is always present
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

    // Marcus appears from Ch2 onwards
    if (chapter === '02-caching' || chapter === '03-databases' || useGameStore.getState().isChapterCompleted('01-load-balancing')) {
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
      // Server is healthy - green state
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

      // Update label based on how many chapters completed
      if (completedCount >= 3) {
        this.serverRack.label.setText('ALL SYSTEMS GO');
        this.serverRack.label.setColor('#44cc66');
      } else if (completedCount >= 1 || currentChapterDone) {
        this.serverRack.label.setText('STABILIZED');
        this.serverRack.label.setColor('#44cc66');
      }

      // Slot colors go green
      for (const slot of this.serverRack.slots) {
        slot.fillColor = 0x1a2e1a;
        slot.setStrokeStyle(1, 0x337744);
      }
    } else {
      // Server is overloaded - red state (default)
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

  private buildServerRack(): ServerRackVisuals {
    // Server rack on the right side
    const rack = this.add.rectangle(850, 400, 64, 100, 0x222244);
    rack.setStrokeStyle(2, 0x334466);

    // Server slots
    const slots: Phaser.GameObjects.Rectangle[] = [];
    for (let i = 0; i < 4; i++) {
      const slot = this.add.rectangle(850, 365 + i * 22, 50, 16, 0x1a1a3e);
      slot.setStrokeStyle(1, 0x445577);
      slots.push(slot);
    }

    // Glow effect
    const glow = this.add.rectangle(850, 400, 80, 116, 0xff2222, 0.1);
    const glowTween = this.tweens.add({
      targets: glow,
      alpha: { from: 0.05, to: 0.2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Status light
    const statusLight = this.add.circle(882, 358, 4, 0xff3333);
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
    });
    label.setOrigin(0.5, 0);

    return { rack, slots, glow, glowTween, statusLight, statusLightTween, label };
  }
}
