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

export class WorldRenderer {
  constructor(scene: Phaser.Scene, map: WorldMap) {
    const worldWidth = map.width * TILE_SIZE;
    const worldHeight = map.height * TILE_SIZE;

    this.bakeTerrain(scene, map, worldWidth, worldHeight);
    this.bakeStaticObjects(scene, map, worldWidth, worldHeight);
  }

  private bakeTerrain(scene: Phaser.Scene, map: WorldMap, worldWidth: number, worldHeight: number): void {
    const renderTexture = scene.add.renderTexture(0, 0, worldWidth, worldHeight).setOrigin(0, 0);

    for (let tileY = 0; tileY < map.height; tileY++) {
      for (let tileX = 0; tileX < map.width; tileX++) {
        const terrain = map.getTerrain(tileX, tileY);
        if (!terrain) {
          continue;
        }

        const textureKey =
          terrain === TerrainType.Grass && (tileX + tileY) % 2 === 1
            ? 'terrain_grass_alt'
            : TERRAIN_TEXTURE[terrain];

        renderTexture.draw(textureKey, tileX * TILE_SIZE, tileY * TILE_SIZE);
      }
    }

    renderTexture.saveTexture('world_terrain');
    renderTexture.destroy();
    scene.add.image(0, 0, 'world_terrain').setOrigin(0, 0).setDepth(0);
  }

  private bakeStaticObjects(
    scene: Phaser.Scene,
    map: WorldMap,
    worldWidth: number,
    worldHeight: number,
  ): Phaser.GameObjects.Image {
    const renderTexture = scene.add.renderTexture(0, 0, worldWidth, worldHeight).setOrigin(0, 0);

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

        renderTexture.draw(textureKey, tileX * TILE_SIZE, tileY * TILE_SIZE);
      }
    }

    renderTexture.saveTexture('world_static_objects');
    renderTexture.destroy();
    return scene.add.image(0, 0, 'world_static_objects').setOrigin(0, 0).setDepth(2);
  }
}

export { isGatherableObject, isStaticObject };
