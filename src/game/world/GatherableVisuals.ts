import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';
import { OBJECT_TEXTURE, ObjectType, type ObjectType as ObjectTypeValue } from './TileTypes';
import type { WorldMap } from './WorldMap';
import type { GatherableVisualAdapter } from './GatherableVisualAdapter';
import { tileKey } from '../interaction/types';

const GATHERABLE_OBJECTS = new Set<ObjectTypeValue>([ObjectType.Tree, ObjectType.Rock]);

export class GatherableVisuals implements GatherableVisualAdapter {
  private readonly sprites = new Map<string, Phaser.GameObjects.Image>();

  constructor(scene: Phaser.Scene, map: WorldMap) {
    for (let tileY = 0; tileY < map.height; tileY++) {
      for (let tileX = 0; tileX < map.width; tileX++) {
        const object = map.getObject(tileX, tileY);
        if (!object || !GATHERABLE_OBJECTS.has(object)) {
          continue;
        }

        this.createSprite(scene, tileX, tileY, object);
      }
    }
  }

  remove(tileX: number, tileY: number): void {
    const key = tileKey(tileX, tileY);
    const sprite = this.sprites.get(key);
    if (!sprite) {
      return;
    }

    sprite.destroy();
    this.sprites.delete(key);
  }

  destroy(): void {
    for (const sprite of this.sprites.values()) {
      sprite.destroy();
    }
    this.sprites.clear();
  }

  private createSprite(
    scene: Phaser.Scene,
    tileX: number,
    tileY: number,
    object: ObjectTypeValue,
  ): void {
    const textureKey = OBJECT_TEXTURE[object];
    if (!textureKey) {
      return;
    }

    const sprite = scene.add
      .image(tileX * TILE_SIZE, tileY * TILE_SIZE, textureKey)
      .setOrigin(0, 0)
      .setDisplaySize(TILE_SIZE, TILE_SIZE)
      .setDepth(1);

    this.sprites.set(tileKey(tileX, tileY), sprite);
  }
}
