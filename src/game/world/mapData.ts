import { ObjectType, TerrainType } from './TileTypes';
import { TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from '../constants';

function fillTerrain(type: TerrainType): TerrainType[][] {
  return Array.from({ length: WORLD_HEIGHT }, () =>
    Array.from({ length: WORLD_WIDTH }, () => type),
  );
}

function buildSquareWalls(objects: ObjectType[][]): void {
  for (let x = 0; x < WORLD_WIDTH; x++) {
    objects[0][x] = ObjectType.VillageWall;
    objects[WORLD_HEIGHT - 1][x] = ObjectType.VillageWall;
  }

  for (let y = 0; y < WORLD_HEIGHT; y++) {
    objects[y][0] = ObjectType.VillageWall;
    objects[y][WORLD_WIDTH - 1] = ObjectType.VillageWall;
  }
}

// --- Disabled world features (lakes, village, trees, rocks) ---
// function carveLake(...) { ... }
// function buildVillage(...) { ... }
// function scatterObjects(...) { ... }

export function generateWorldData(): {
  terrain: TerrainType[][];
  objects: ObjectType[][];
} {
  const terrain = fillTerrain(TerrainType.Grass);
  const objects = Array.from({ length: WORLD_HEIGHT }, () =>
    Array.from({ length: WORLD_WIDTH }, () => ObjectType.None),
  );

  buildSquareWalls(objects);

  return { terrain, objects };
}

export const DEFAULT_SPAWN = {
  x: Math.floor(WORLD_WIDTH / 2) * TILE_SIZE + TILE_SIZE / 2,
  y: Math.floor(WORLD_HEIGHT / 2) * TILE_SIZE + TILE_SIZE / 2,
};

export function getSpawnPosition(userId: string): { x: number; y: number } {
  const hash = [...userId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const angle = (hash % 8) * (Math.PI / 4);
  const radius = TILE_SIZE * 1.5;

  return {
    x: DEFAULT_SPAWN.x + Math.cos(angle) * radius,
    y: DEFAULT_SPAWN.y + Math.sin(angle) * radius,
  };
}
