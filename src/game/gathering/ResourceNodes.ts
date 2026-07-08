import { tileKey } from '../interaction/types';
import { ObjectType, type ObjectType as ObjectTypeValue } from '../world/TileTypes';

export interface ResourceNode {
  tileX: number;
  tileY: number;
  objectType: ObjectTypeValue;
  remainingHits: number;
}

export class ResourceNodeRegistry {
  private readonly nodes = new Map<string, ResourceNode>();

  register(node: ResourceNode): void {
    this.nodes.set(tileKey(node.tileX, node.tileY), node);
  }

  getAt(tileX: number, tileY: number): ResourceNode | null {
    return this.nodes.get(tileKey(tileX, tileY)) ?? null;
  }

  isDepleted(tileX: number, tileY: number): boolean {
    const node = this.getAt(tileX, tileY);
    return !node || node.remainingHits <= 0;
  }

  hit(tileX: number, tileY: number): ResourceNode | null {
    const node = this.getAt(tileX, tileY);
    if (!node || node.remainingHits <= 0) {
      return null;
    }

    node.remainingHits--;
    return node;
  }

  remove(tileX: number, tileY: number): void {
    this.nodes.delete(tileKey(tileX, tileY));
  }
}

export function buildResourceNodeRegistry(
  map: {
    width: number;
    height: number;
    getObject(tileX: number, tileY: number): ObjectTypeValue | null;
  },
  hitsByObject: Partial<Record<ObjectTypeValue, number>>,
): ResourceNodeRegistry {
  const registry = new ResourceNodeRegistry();

  for (let tileY = 0; tileY < map.height; tileY++) {
    for (let tileX = 0; tileX < map.width; tileX++) {
      const object = map.getObject(tileX, tileY);
      if (!object || object === ObjectType.None) {
        continue;
      }

      const hits = hitsByObject[object];
      if (!hits) {
        continue;
      }

      registry.register({
        tileX,
        tileY,
        objectType: object,
        remainingHits: hits,
      });
    }
  }

  return registry;
}
