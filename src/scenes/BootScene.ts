import Phaser from 'phaser';

// Pixel data: [x, y, color] tuples for Chibi Tech style (20x28 base)
type PixelData = [number, number, number][];

const SCALE = 2; // Each design pixel = 2 game pixels
const CHAR_W = 20;
const CHAR_H = 28;

// ── Player frames ──────────────────────────────────────────────────
// Shared parts reused across frames
const PLAYER_HEAD: PixelData = [
  // Hair (messy brown)
  [7,1,0x3a2a1a],[8,1,0x3a2a1a],[9,1,0x3a2a1a],[10,1,0x3a2a1a],[11,1,0x3a2a1a],[12,1,0x3a2a1a],
  [6,2,0x3a2a1a],[7,2,0x4a3a2a],[8,2,0x4a3a2a],[9,2,0x4a3a2a],[10,2,0x4a3a2a],[11,2,0x4a3a2a],[12,2,0x4a3a2a],[13,2,0x3a2a1a],
  [5,3,0x3a2a1a],[6,3,0x4a3a2a],[7,3,0x5a4a3a],[8,3,0x5a4a3a],[9,3,0x5a4a3a],[10,3,0x5a4a3a],[11,3,0x5a4a3a],[12,3,0x5a4a3a],[13,3,0x4a3a2a],[14,3,0x3a2a1a],
  // Face
  [5,4,0x3a2a1a],[6,4,0xe8b888],[7,4,0xe8b888],[8,4,0xe8b888],[9,4,0xe8b888],[10,4,0xe8b888],[11,4,0xe8b888],[12,4,0xe8b888],[13,4,0xe8b888],[14,4,0x3a2a1a],
  [5,5,0xe8b888],[6,5,0xe8b888],[7,5,0xe8b888],[8,5,0xe8b888],[9,5,0xe8b888],[10,5,0xe8b888],[11,5,0xe8b888],[12,5,0xe8b888],[13,5,0xe8b888],[14,5,0xe8b888],
  // Eyes
  [5,6,0xe8b888],[6,6,0xe8b888],[7,6,0xffffff],[8,6,0x2244aa],[9,6,0xe8b888],[10,6,0xe8b888],[11,6,0xffffff],[12,6,0x2244aa],[13,6,0xe8b888],[14,6,0xe8b888],
  [5,7,0xe8b888],[6,7,0xe8b888],[7,7,0xffffff],[8,7,0x113388],[9,7,0xe8b888],[10,7,0xe8b888],[11,7,0xffffff],[12,7,0x113388],[13,7,0xe8b888],[14,7,0xe8b888],
  // Mouth
  [6,8,0xe8b888],[7,8,0xe8b888],[8,8,0xe8b888],[9,8,0xdd9977],[10,8,0xdd9977],[11,8,0xe8b888],[12,8,0xe8b888],[13,8,0xe8b888],
  [7,9,0xe8b888],[8,9,0xe8b888],[9,9,0xe8b888],[10,9,0xe8b888],[11,9,0xe8b888],[12,9,0xe8b888],
];

const PLAYER_BODY: PixelData = [
  // Hoodie
  [6,10,0x4488cc],[7,10,0x5599dd],[8,10,0x6aaae8],[9,10,0x6aaae8],[10,10,0x6aaae8],[11,10,0x6aaae8],[12,10,0x5599dd],[13,10,0x4488cc],
  [5,11,0xe8b888],[6,11,0x4488cc],[7,11,0x5599dd],[8,11,0xccddee],[9,11,0xccddee],[10,11,0xccddee],[11,11,0xccddee],[12,11,0x5599dd],[13,11,0x4488cc],[14,11,0xe8b888],
  [5,12,0xe8b888],[6,12,0x4488cc],[7,12,0x5599dd],[8,12,0x6aaae8],[9,12,0xffcc33],[10,12,0xffcc33],[11,12,0x6aaae8],[12,12,0x5599dd],[13,12,0x4488cc],[14,12,0xe8b888],
  [6,13,0x4488cc],[7,13,0x5599dd],[8,13,0x6aaae8],[9,13,0x6aaae8],[10,13,0x6aaae8],[11,13,0x6aaae8],[12,13,0x5599dd],[13,13,0x4488cc],
  [6,14,0x4488cc],[7,14,0x5599dd],[8,14,0x6aaae8],[9,14,0x6aaae8],[10,14,0x6aaae8],[11,14,0x6aaae8],[12,14,0x5599dd],[13,14,0x4488cc],
];

// Idle legs (standing)
const PLAYER_LEGS_IDLE: PixelData = [
  [7,15,0x2a2a44],[8,15,0x333355],[9,15,0x333355],[10,15,0x333355],[11,15,0x333355],[12,15,0x2a2a44],
  [7,16,0x2a2a44],[8,16,0x333355],[9,16,0x2a2a44],[10,16,0x2a2a44],[11,16,0x333355],[12,16,0x2a2a44],
  [7,17,0x2a2a44],[8,17,0x333355],[11,17,0x333355],[12,17,0x2a2a44],
  [6,18,0x445566],[7,18,0x556677],[8,18,0x556677],[11,18,0x556677],[12,18,0x556677],[13,18,0x445566],
];

// Walk frame 1 (left foot forward)
const PLAYER_LEGS_WALK1: PixelData = [
  [7,15,0x2a2a44],[8,15,0x333355],[9,15,0x333355],[10,15,0x333355],[11,15,0x333355],[12,15,0x2a2a44],
  [6,16,0x2a2a44],[7,16,0x333355],[8,16,0x2a2a44],[10,16,0x2a2a44],[11,16,0x333355],[12,16,0x2a2a44],
  [5,17,0x2a2a44],[6,17,0x333355],[11,17,0x333355],[12,17,0x2a2a44],
  [4,18,0x445566],[5,18,0x556677],[6,18,0x556677],[11,18,0x556677],[12,18,0x556677],[13,18,0x445566],
];

// Walk frame 2 (right foot forward)
const PLAYER_LEGS_WALK2: PixelData = [
  [7,15,0x2a2a44],[8,15,0x333355],[9,15,0x333355],[10,15,0x333355],[11,15,0x333355],[12,15,0x2a2a44],
  [7,16,0x2a2a44],[8,16,0x333355],[9,16,0x2a2a44],[11,16,0x2a2a44],[12,16,0x333355],[13,16,0x2a2a44],
  [7,17,0x2a2a44],[8,17,0x333355],[13,17,0x333355],[14,17,0x2a2a44],
  [6,18,0x445566],[7,18,0x556677],[8,18,0x556677],[13,18,0x556677],[14,18,0x556677],[15,18,0x445566],
];

// ── Sarah frames ──────────────────────────────────────────────────
const SARAH_HEAD: PixelData = [
  [7,0,0x993322],[8,0,0x993322],[9,0,0x993322],[10,0,0x993322],[11,0,0x993322],[12,0,0x993322],
  [6,1,0x993322],[7,1,0xbb4433],[8,1,0xbb4433],[9,1,0xbb4433],[10,1,0xbb4433],[11,1,0xbb4433],[12,1,0xbb4433],[13,1,0x993322],
  [5,2,0x993322],[6,2,0xbb4433],[7,2,0xcc5544],[8,2,0xcc5544],[9,2,0xcc5544],[10,2,0xcc5544],[11,2,0xcc5544],[12,2,0xcc5544],[13,2,0xbb4433],[14,2,0x993322],
  [4,3,0x993322],[5,3,0xbb4433],[6,3,0xcc5544],[7,3,0xcc5544],[8,3,0xcc5544],[9,3,0xcc5544],[10,3,0xcc5544],[11,3,0xcc5544],[12,3,0xcc5544],[13,3,0xcc5544],[14,3,0xbb4433],[15,3,0x993322],
  [5,4,0x993322],[6,4,0xf0c8a0],[7,4,0xf0c8a0],[8,4,0xf0c8a0],[9,4,0xf0c8a0],[10,4,0xf0c8a0],[11,4,0xf0c8a0],[12,4,0xf0c8a0],[13,4,0xf0c8a0],[14,4,0x993322],
  [4,5,0x993322],[5,5,0xf0c8a0],[6,5,0xf0c8a0],[7,5,0xf0c8a0],[8,5,0xf0c8a0],[9,5,0xf0c8a0],[10,5,0xf0c8a0],[11,5,0xf0c8a0],[12,5,0xf0c8a0],[13,5,0xf0c8a0],[14,5,0x993322],
  [4,6,0x993322],[5,6,0xf0c8a0],[6,6,0xf0c8a0],[7,6,0xffffff],[8,6,0x228844],[9,6,0xf0c8a0],[10,6,0xf0c8a0],[11,6,0xffffff],[12,6,0x228844],[13,6,0xf0c8a0],[14,6,0x993322],
  [4,7,0x993322],[5,7,0xf0c8a0],[6,7,0xf0c8a0],[7,7,0xffffff],[8,7,0x116633],[9,7,0xf0c8a0],[10,7,0xf0c8a0],[11,7,0xffffff],[12,7,0x116633],[13,7,0xf0c8a0],[14,7,0x993322],
  [6,8,0xf0c8a0],[7,8,0xf0c8a0],[8,8,0xf0c8a0],[9,8,0xcc7766],[10,8,0xcc7766],[11,8,0xf0c8a0],[12,8,0xf0c8a0],[13,8,0xf0c8a0],
  [7,9,0xf0c8a0],[8,9,0xf0c8a0],[9,9,0xf0c8a0],[10,9,0xf0c8a0],[11,9,0xf0c8a0],[12,9,0xf0c8a0],
  // Headset
  [3,5,0x44cc66],[3,6,0x66ee88],[3,7,0x44cc66],
  // Hair strands
  [4,8,0x993322],[4,9,0x993322],[4,10,0x993322],[14,8,0x993322],[14,9,0x993322],[14,10,0x993322],
];

const SARAH_BODY: PixelData = [
  [6,10,0x228844],[7,10,0x33aa55],[8,10,0x44cc66],[9,10,0x44cc66],[10,10,0x44cc66],[11,10,0x44cc66],[12,10,0x33aa55],[13,10,0x228844],
  [5,11,0xf0c8a0],[6,11,0x228844],[7,11,0x33aa55],[8,11,0x88ddaa],[9,11,0x88ddaa],[10,11,0x88ddaa],[11,11,0x88ddaa],[12,11,0x33aa55],[13,11,0x228844],[14,11,0xf0c8a0],
  [5,12,0xf0c8a0],[6,12,0x228844],[7,12,0x33aa55],[8,12,0x44cc66],[9,12,0x44cc66],[10,12,0x44cc66],[11,12,0x44cc66],[12,12,0x33aa55],[13,12,0x228844],[14,12,0xf0c8a0],
  [6,13,0x228844],[7,13,0x33aa55],[8,13,0x44cc66],[9,13,0x44cc66],[10,13,0x44cc66],[11,13,0x44cc66],[12,13,0x33aa55],[13,13,0x228844],
  [6,14,0x228844],[7,14,0x33aa55],[8,14,0x44cc66],[9,14,0x44cc66],[10,14,0x44cc66],[11,14,0x44cc66],[12,14,0x33aa55],[13,14,0x228844],
];

const SARAH_LEGS_IDLE: PixelData = [
  [7,15,0x222244],[8,15,0x2a2a55],[9,15,0x2a2a55],[10,15,0x2a2a55],[11,15,0x2a2a55],[12,15,0x222244],
  [7,16,0x222244],[8,16,0x2a2a55],[9,16,0x222244],[10,16,0x222244],[11,16,0x2a2a55],[12,16,0x222244],
  [7,17,0x222244],[8,17,0x2a2a55],[11,17,0x2a2a55],[12,17,0x222244],
  [6,18,0x228844],[7,18,0x33aa55],[8,18,0x33aa55],[11,18,0x33aa55],[12,18,0x33aa55],[13,18,0x228844],
];

// ── Marcus frames ──────────────────────────────────────────────────
const MARCUS_HEAD: PixelData = [
  [7,1,0x111122],[8,1,0x111122],[9,1,0x111122],[10,1,0x111122],[11,1,0x111122],[12,1,0x111122],
  [6,2,0x111122],[7,2,0x1a1a33],[8,2,0x1a1a33],[9,2,0x1a1a33],[10,2,0x1a1a33],[11,2,0x1a1a33],[12,2,0x1a1a33],[13,2,0x111122],
  [5,3,0x111122],[6,3,0x1a1a33],[7,3,0x222244],[8,3,0x222244],[9,3,0x222244],[10,3,0x222244],[11,3,0x222244],[12,3,0x222244],[13,3,0x1a1a33],[14,3,0x111122],
  [5,4,0xc89060],[6,4,0xc89060],[7,4,0xc89060],[8,4,0xc89060],[9,4,0xc89060],[10,4,0xc89060],[11,4,0xc89060],[12,4,0xc89060],[13,4,0xc89060],[14,4,0xc89060],
  [5,5,0xc89060],[6,5,0xc89060],[7,5,0xc89060],[8,5,0xc89060],[9,5,0xc89060],[10,5,0xc89060],[11,5,0xc89060],[12,5,0xc89060],[13,5,0xc89060],[14,5,0xc89060],
  [5,6,0xc89060],[6,6,0x8866cc],[7,6,0xffffff],[8,6,0x332255],[9,6,0x8866cc],[10,6,0x8866cc],[11,6,0xffffff],[12,6,0x332255],[13,6,0x8866cc],[14,6,0xc89060],
  [5,7,0xc89060],[6,7,0x8866cc],[7,7,0xffffff],[8,7,0x221144],[9,7,0x8866cc],[10,7,0x8866cc],[11,7,0xffffff],[12,7,0x221144],[13,7,0x8866cc],[14,7,0xc89060],
  [6,8,0xc89060],[7,8,0xc89060],[8,8,0xc89060],[9,8,0xb07050],[10,8,0xb07050],[11,8,0xc89060],[12,8,0xc89060],[13,8,0xc89060],
  [7,9,0xc89060],[8,9,0xc89060],[9,9,0xc89060],[10,9,0xc89060],[11,9,0xc89060],[12,9,0xc89060],
];

const MARCUS_BODY: PixelData = [
  [6,10,0x332255],[7,10,0x443366],[8,10,0x554477],[9,10,0x554477],[10,10,0x554477],[11,10,0x554477],[12,10,0x443366],[13,10,0x332255],
  [5,11,0xc89060],[6,11,0x332255],[7,11,0x443366],[8,11,0xddddee],[9,11,0xddddee],[10,11,0xddddee],[11,11,0xddddee],[12,11,0x443366],[13,11,0x332255],[14,11,0xc89060],
  [5,12,0xc89060],[6,12,0x332255],[7,12,0x443366],[8,12,0x554477],[9,12,0x8866cc],[10,12,0x8866cc],[11,12,0x554477],[12,12,0x443366],[13,12,0x332255],[14,12,0xc89060],
  [6,13,0x332255],[7,13,0x443366],[8,13,0x554477],[9,13,0x554477],[10,13,0x554477],[11,13,0x554477],[12,13,0x443366],[13,13,0x332255],
  [6,14,0x332255],[7,14,0x443366],[8,14,0x554477],[9,14,0x554477],[10,14,0x554477],[11,14,0x554477],[12,14,0x443366],[13,14,0x332255],
];

const MARCUS_LEGS_IDLE: PixelData = [
  [7,15,0x1a1a2e],[8,15,0x222244],[9,15,0x222244],[10,15,0x222244],[11,15,0x222244],[12,15,0x1a1a2e],
  [7,16,0x1a1a2e],[8,16,0x222244],[9,16,0x1a1a2e],[10,16,0x1a1a2e],[11,16,0x222244],[12,16,0x1a1a2e],
  [7,17,0x1a1a2e],[8,17,0x222244],[11,17,0x222244],[12,17,0x1a1a2e],
  [6,18,0x1a1a2a],[7,18,0x222244],[8,18,0x222244],[11,18,0x222244],[12,18,0x222244],[13,18,0x1a1a2a],
];

function combinePixels(...parts: PixelData[]): PixelData {
  return parts.flat();
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const w = CHAR_W * SCALE;
    const h = CHAR_H * SCALE;

    // Player: 3-frame spritesheet (idle, walk1, walk2) side by side
    const playerFrames = [
      combinePixels(PLAYER_HEAD, PLAYER_BODY, PLAYER_LEGS_IDLE),
      combinePixels(PLAYER_HEAD, PLAYER_BODY, PLAYER_LEGS_WALK1),
      combinePixels(PLAYER_HEAD, PLAYER_BODY, PLAYER_LEGS_WALK2),
    ];
    this.createSpriteSheet('player', CHAR_W, CHAR_H, SCALE, playerFrames);

    // NPCs: single frame each (idle animation done via tween)
    this.createPixelArtSprite('npc-sarah', CHAR_W, CHAR_H, SCALE,
      combinePixels(SARAH_HEAD, SARAH_BODY, SARAH_LEGS_IDLE));
    this.createPixelArtSprite('npc-marcus', CHAR_W, CHAR_H, SCALE,
      combinePixels(MARCUS_HEAD, MARCUS_BODY, MARCUS_LEGS_IDLE));

    // Environment
    this.createColoredRect('server-rack', 64, 80, 0x882222);
    this.createColoredRect('server-light', 8, 8, 0xff3333);
  }

  create(): void {
    // Register player animations
    this.anims.create({
      key: 'player-idle',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 1,
    });

    this.anims.create({
      key: 'player-walk',
      frames: [
        { key: 'player', frame: 1 },
        { key: 'player', frame: 0 },
        { key: 'player', frame: 2 },
        { key: 'player', frame: 0 },
      ],
      frameRate: 8,
      repeat: -1,
    });

    this.scene.start('WorldScene');
  }

  private createSpriteSheet(
    key: string,
    baseW: number,
    baseH: number,
    scale: number,
    frames: PixelData[]
  ): void {
    const w = baseW * scale;
    const h = baseH * scale;
    const totalW = w * frames.length;
    const g = this.add.graphics();

    for (let f = 0; f < frames.length; f++) {
      const offsetX = f * w;
      for (const [x, y, color] of frames[f]) {
        g.fillStyle(color, 1);
        g.fillRect(offsetX + x * scale, y * scale, scale, scale);
      }
    }

    g.generateTexture(key, totalW, h);
    g.destroy();

    // Add spritesheet frames to texture manager
    const texture = this.textures.get(key);
    texture.add(0, 0, 0, 0, w, h);
    texture.add(1, 0, w, 0, w, h);
    texture.add(2, 0, w * 2, 0, w, h);
  }

  private createPixelArtSprite(
    key: string,
    baseW: number,
    baseH: number,
    scale: number,
    pixels: PixelData
  ): void {
    const w = baseW * scale;
    const h = baseH * scale;
    const g = this.add.graphics();

    for (const [x, y, color] of pixels) {
      g.fillStyle(color, 1);
      g.fillRect(x * scale, y * scale, scale, scale);
    }

    g.generateTexture(key, w, h);
    g.destroy();
  }

  private createColoredRect(key: string, w: number, h: number, color: number): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
