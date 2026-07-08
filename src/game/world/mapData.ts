import { ObjectType, TerrainType } from './TileTypes';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../constants';

function fillTerrain(type: TerrainType): TerrainType[][] {
  return Array.from({ length: WORLD_HEIGHT }, () =>
    Array.from({ length: WORLD_WIDTH }, () => type),
  );
}

function carveLake(
  terrain: TerrainType[][],
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
): void {
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      if (dx * dx + dy * dy <= 1) {
        terrain[y][x] = TerrainType.Water;
      }
    }
  }
}

function buildVillage(
  terrain: TerrainType[][],
  objects: ObjectType[][],
  originX: number,
  originY: number,
  width: number,
  height: number,
): void {
  for (let y = originY; y < originY + height; y++) {
    for (let x = originX; x < originX + width; x++) {
      const edge =
        x === originX ||
        x === originX + width - 1 ||
        y === originY ||
        y === originY + height - 1;

      if (edge) {
        objects[y][x] = ObjectType.VillageWall;
        terrain[y][x] = TerrainType.VillageFloor;
        continue;
      }

      const isPath =
        x === originX + Math.floor(width / 2) ||
        y === originY + height - 3;

      terrain[y][x] = isPath ? TerrainType.VillagePath : TerrainType.VillageFloor;
    }
  }

  objects[originY + 2][originX + 3] = ObjectType.VillageHouse;
  objects[originY + 2][originX + width - 4] = ObjectType.VillageHouse;
  objects[originY + 4][originX + Math.floor(width / 2)] = ObjectType.VillageHouse;
}

function scatterObjects(
  objects: ObjectType[][],
  terrain: TerrainType[][],
  type: ObjectType,
  count: number,
  seed: number,
): void {
  let placed = 0;
  let rng = seed;

  while (placed < count) {
    rng = (rng * 1664525 + 1013904223) >>> 0;
    const x = rng % WORLD_WIDTH;
    rng = (rng * 1664525 + 1013904223) >>> 0;
    const y = rng % WORLD_HEIGHT;

    if (terrain[y][x] !== TerrainType.Grass) {
      continue;
    }

    if (objects[y][x] !== ObjectType.None) {
      continue;
    }

    objects[y][x] = type;
    placed++;
  }
}

export function generateWorldData(): {
  terrain: TerrainType[][];
  objects: ObjectType[][];
} {
  const terrain = fillTerrain(TerrainType.Grass);
  const objects = Array.from({ length: WORLD_HEIGHT }, () =>
    Array.from({ length: WORLD_WIDTH }, () => ObjectType.None),
  );

  carveLake(terrain, 34, 24, 8, 5);
  carveLake(terrain, 12, 28, 5, 3);
  buildVillage(terrain, objects, 6, 5, 12, 9);
  scatterObjects(objects, terrain, ObjectType.Tree, 90, 42);
  scatterObjects(objects, terrain, ObjectType.Rock, 35, 99);

  return { terrain, objects };
}

export const DEFAULT_SPAWN = { x: 12 * 32 + 16, y: 16 * 32 + 16 };
