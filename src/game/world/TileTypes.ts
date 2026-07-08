export const TerrainType = {
  Grass: 'grass',
  Water: 'water',
  VillageFloor: 'village_floor',
  VillagePath: 'village_path',
} as const;

export type TerrainType = (typeof TerrainType)[keyof typeof TerrainType];

export const ObjectType = {
  None: 'none',
  Tree: 'tree',
  Rock: 'rock',
  VillageWall: 'village_wall',
  VillageHouse: 'village_house',
} as const;

export type ObjectType = (typeof ObjectType)[keyof typeof ObjectType];

export interface TileCoord {
  tileX: number;
  tileY: number;
}

export const TERRAIN_TEXTURE: Record<TerrainType, string> = {
  [TerrainType.Grass]: 'terrain_grass',
  [TerrainType.Water]: 'terrain_water',
  [TerrainType.VillageFloor]: 'terrain_village_floor',
  [TerrainType.VillagePath]: 'terrain_village_path',
};

export const OBJECT_TEXTURE: Record<ObjectType, string | null> = {
  [ObjectType.None]: null,
  [ObjectType.Tree]: 'object_tree',
  [ObjectType.Rock]: 'object_rock',
  [ObjectType.VillageWall]: 'object_village_wall',
  [ObjectType.VillageHouse]: 'object_village_house',
};

export function isTerrainWalkable(terrain: TerrainType): boolean {
  return terrain !== TerrainType.Water;
}

export function isObjectBlocking(object: ObjectType): boolean {
  return object !== ObjectType.None;
}
