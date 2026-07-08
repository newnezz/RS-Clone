import { TILE_SIZE } from '../constants';
import {
  isObjectBlocking,
  isTerrainWalkable,
  type ObjectType,
  type TerrainType,
  type TileCoord,
} from './TileTypes';

export class WorldMap {
  readonly width: number;
  readonly height: number;
  readonly terrain: TerrainType[][];
  readonly objects: ObjectType[][];

  constructor(
    width: number,
    height: number,
    terrain: TerrainType[][],
    objects: ObjectType[][],
  ) {
    this.width = width;
    this.height = height;
    this.terrain = terrain;
    this.objects = objects;
  }

  isInBounds(tileX: number, tileY: number): boolean {
    return tileX >= 0 && tileY >= 0 && tileX < this.width && tileY < this.height;
  }

  getTerrain(tileX: number, tileY: number): TerrainType | null {
    if (!this.isInBounds(tileX, tileY)) {
      return null;
    }
    return this.terrain[tileY][tileX];
  }

  getObject(tileX: number, tileY: number): ObjectType | null {
    if (!this.isInBounds(tileX, tileY)) {
      return null;
    }
    return this.objects[tileY][tileX];
  }

  setObject(tileX: number, tileY: number, object: ObjectType): void {
    if (!this.isInBounds(tileX, tileY)) {
      return;
    }
    this.objects[tileY][tileX] = object;
  }

  isTileWalkable(tileX: number, tileY: number): boolean {
    const terrain = this.getTerrain(tileX, tileY);
    const object = this.getObject(tileX, tileY);

    if (terrain === null || object === null) {
      return false;
    }

    return isTerrainWalkable(terrain) && !isObjectBlocking(object);
  }

  worldToTile(x: number, y: number): TileCoord {
    return {
      tileX: Math.floor(x / TILE_SIZE),
      tileY: Math.floor(y / TILE_SIZE),
    };
  }

  tileToWorldCenter(tileX: number, tileY: number): { x: number; y: number } {
    return {
      x: tileX * TILE_SIZE + TILE_SIZE / 2,
      y: tileY * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  isWorldPositionWalkable(x: number, y: number, radius: number): boolean {
    const corners = [
      { x: x - radius, y: y - radius },
      { x: x + radius, y: y - radius },
      { x: x - radius, y: y + radius },
      { x: x + radius, y: y + radius },
    ];

    return corners.every(({ x: cornerX, y: cornerY }) => {
      const { tileX, tileY } = this.worldToTile(cornerX, cornerY);
      return this.isTileWalkable(tileX, tileY);
    });
  }
}
