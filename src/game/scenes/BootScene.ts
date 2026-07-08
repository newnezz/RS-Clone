import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';
import {
  OBJECT_TEXTURE,
  TERRAIN_TEXTURE,
  ObjectType,
  TerrainType,
} from '../world/TileTypes';

interface TileDefinition {
  key: string;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

function createTileCanvas(draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to create tile canvas context');
  }
  draw(ctx);
  return canvas;
}

function grassTile(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#8ecf6a';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  ctx.strokeStyle = '#2f5f28';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);

  ctx.fillStyle = '#9adb78';
  ctx.fillRect(4, 4, 8, 8);
  ctx.fillRect(18, 18, 8, 8);
}

function grassAltTile(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#3f7a34';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  ctx.strokeStyle = '#1f3f18';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);

  ctx.fillStyle = '#4f8f44';
  ctx.fillRect(18, 4, 8, 8);
  ctx.fillRect(4, 18, 8, 8);
}

function waterTile(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2f6fad';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = '#4a90d9';
  ctx.fillRect(4, 8, 10, 3);
  ctx.fillRect(16, 18, 12, 3);
}

function villageFloorTile(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = '#6f5b43';
  ctx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
}

function villagePathTile(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#a8926d';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = '#8f7d5d';
  ctx.fillRect(0, TILE_SIZE / 2 - 2, TILE_SIZE, 4);
}

function treeTile(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#5c3d1e';
  ctx.fillRect(13, 18, 6, 12);
  ctx.fillStyle = '#2f6b2f';
  ctx.beginPath();
  ctx.arc(16, 12, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3f8a3f';
  ctx.beginPath();
  ctx.arc(12, 10, 5, 0, Math.PI * 2);
  ctx.fill();
}

function rockTile(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#7a7a7a';
  ctx.beginPath();
  ctx.moveTo(8, 24);
  ctx.lineTo(12, 10);
  ctx.lineTo(22, 8);
  ctx.lineTo(26, 22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#9a9a9a';
  ctx.fillRect(14, 14, 4, 3);
}

function villageWallTile(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  ctx.fillStyle = '#6a6a6a';
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const offset = row % 2 === 0 ? 0 : 4;
      const bx = col * 8 + offset;
      const by = row * 8;
      ctx.fillRect(bx + 1, by + 1, 7, 7);
    }
  }

  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 1;
  for (let row = 0; row <= 4; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * 8);
    ctx.lineTo(TILE_SIZE, row * 8);
    ctx.stroke();
  }
  for (let col = 0; col <= 4; col++) {
    ctx.beginPath();
    ctx.moveTo(col * 8, 0);
    ctx.lineTo(col * 8, TILE_SIZE);
    ctx.stroke();
  }

  ctx.fillStyle = '#b0b0b0';
  ctx.fillRect(0, 0, TILE_SIZE, 5);
  ctx.fillStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, TILE_SIZE - 3, TILE_SIZE - 3);
}

function villageHouseTile(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#8b4a39';
  ctx.fillRect(6, 14, 20, 16);
  ctx.fillStyle = '#5c3228';
  ctx.beginPath();
  ctx.moveTo(4, 14);
  ctx.lineTo(16, 4);
  ctx.lineTo(28, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f0d090';
  ctx.fillRect(14, 20, 5, 8);
}

function playerRemoteTile(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#3a7bd5';
  ctx.fillRect(10, 8, 12, 14);
  ctx.fillStyle = '#7eb8ff';
  ctx.beginPath();
  ctx.arc(16, 8, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2f2f2f';
  ctx.fillRect(12, 7, 2, 2);
  ctx.fillRect(18, 7, 2, 2);
}

function playerTile(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#d4a017';
  ctx.fillRect(10, 8, 12, 14);
  ctx.fillStyle = '#f5d76e';
  ctx.beginPath();
  ctx.arc(16, 8, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2f2f2f';
  ctx.fillRect(12, 7, 2, 2);
  ctx.fillRect(18, 7, 2, 2);
}

function npcElderTile(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#6b4c9a';
  ctx.fillRect(10, 8, 12, 14);
  ctx.fillStyle = '#dcc9f0';
  ctx.beginPath();
  ctx.arc(16, 8, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c0a0e0';
  ctx.fillRect(8, 6, 16, 4);
}

function npcSmithTile(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(10, 8, 12, 14);
  ctx.fillStyle = '#f0c090';
  ctx.beginPath();
  ctx.arc(16, 8, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(10, 5, 12, 3);
}

const TILE_DEFINITIONS: TileDefinition[] = [
  { key: 'terrain_grass', draw: grassTile },
  { key: 'terrain_grass_alt', draw: grassAltTile },
  ...Object.values(TerrainType)
    .filter((terrain) => terrain !== TerrainType.Grass)
    .map((terrain) => ({
      key: TERRAIN_TEXTURE[terrain],
      draw:
        terrain === TerrainType.Water
          ? waterTile
          : terrain === TerrainType.VillageFloor
            ? villageFloorTile
            : villagePathTile,
    })),
  ...Object.values(ObjectType)
    .filter((object) => object !== ObjectType.None)
    .map((object) => ({
      key: OBJECT_TEXTURE[object]!,
      draw:
        object === ObjectType.Tree
          ? treeTile
          : object === ObjectType.Rock
            ? rockTile
            : object === ObjectType.VillageWall
              ? villageWallTile
              : villageHouseTile,
    })),
  { key: 'player', draw: playerTile },
  { key: 'player_remote', draw: playerRemoteTile },
  { key: 'npc_elder', draw: npcElderTile },
  { key: 'npc_smith', draw: npcSmithTile },
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    for (const definition of TILE_DEFINITIONS) {
      const canvas = createTileCanvas(definition.draw);
      this.textures.addCanvas(definition.key, canvas);
    }
  }

  create(): void {
    this.scene.start('GameScene');
  }
}
