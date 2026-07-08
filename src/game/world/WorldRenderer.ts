import type Phaser from 'phaser';
import { TILE_SIZE } from '../constants';
import { OBJECT_TEXTURE, ObjectType, TERRAIN_TEXTURE, TerrainType } from './TileTypes';
import type { WorldMap } from './WorldMap';

function isStaticObject(object: string | null): boolean {
  return object === ObjectType.VillageWall || object === ObjectType.VillageHouse;
}

function isGatherableObject(object: string | null): boolean {
  return object === ObjectType.Tree || object === ObjectType.Rock;
}

function getTerrainTextureKey(terrain: TerrainType, tileX: number, tileY: number): string {
  if (terrain === TerrainType.Grass && (tileX + tileY) % 2 === 1) {
    return 'terrain_grass_alt';
  }
  return TERRAIN_TEXTURE[terrain];
}

export class WorldRenderer {
  constructor(scene: Phaser.Scene, map: WorldMap) {
    const floorLayer = scene.add.layer().setDepth(0);
    const wallLayer = scene.add.layer().setDepth(1);

    for (let tileY = 0; tileY < map.height; tileY++) {
      for (let tileX = 0; tileX < map.width; tileX++) {
        const terrain = map.getTerrain(tileX, tileY);
        if (!terrain) {
          continue;
        }

        const tile = scene.add
          .image(tileX * TILE_SIZE, tileY * TILE_SIZE, getTerrainTextureKey(terrain, tileX, tileY))
          .setOrigin(0, 0);
        floorLayer.add(tile);
      }
    }

    for (let tileY = 0; tileY < map.height; tileY++) {
      for (let tileX = 0; tileX < map.width; tileX++) {
        const object = map.getObject(tileX, tileY);
        if (!object || !isStaticObject(object)) {
          continue;
        }

        const textureKey = OBJECT_TEXTURE[object];
        if (!textureKey) {
          continue;
        }

        const wall = scene.add
          .image(tileX * TILE_SIZE, tileY * TILE_SIZE, textureKey)
          .setOrigin(0, 0);
        wallLayer.add(wall);
      }
    }
  }
}

export { isGatherableObject, isStaticObject };
