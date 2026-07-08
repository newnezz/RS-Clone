import { ObjectType, type ObjectType as ObjectTypeValue } from '../world/TileTypes';
import {
  InteractionAction,
  TargetKind,
  type InteractableTarget,
  tileKey,
} from './types';

interface InteractableConfig {
  label: string;
  examineText: string;
  actions: InteractionAction[];
}

const INTERACTABLE_CONFIG: Partial<Record<ObjectTypeValue, InteractableConfig>> = {
  [ObjectType.Tree]: {
    label: 'Tree',
    examineText: 'A sturdy tree. You could chop it for logs.',
    actions: [InteractionAction.Examine, InteractionAction.Chop],
  },
  [ObjectType.Rock]: {
    label: 'Rock',
    examineText: 'A rocky outcrop. You could mine it for ore.',
    actions: [InteractionAction.Examine, InteractionAction.Mine],
  },
  [ObjectType.VillageWall]: {
    label: 'Wall',
    examineText: 'A solid village wall.',
    actions: [InteractionAction.Examine],
  },
  [ObjectType.VillageHouse]: {
    label: 'House',
    examineText: 'A small village house. It looks cozy inside.',
    actions: [InteractionAction.Examine],
  },
};

export class InteractableRegistry {
  private readonly byTile = new Map<string, InteractableTarget>();

  register(target: InteractableTarget): void {
    this.byTile.set(tileKey(target.tileX, target.tileY), target);
  }

  getAt(tileX: number, tileY: number): InteractableTarget | null {
    return this.byTile.get(tileKey(tileX, tileY)) ?? null;
  }

  unregister(tileX: number, tileY: number): void {
    this.byTile.delete(tileKey(tileX, tileY));
  }

  findAtWorld(map: { worldToTile(x: number, y: number): { tileX: number; tileY: number } }, worldX: number, worldY: number): InteractableTarget | null {
    const { tileX, tileY } = map.worldToTile(worldX, worldY);
    return this.getAt(tileX, tileY);
  }
}

export function buildInteractableRegistry(
  map: {
    width: number;
    height: number;
    getObject(tileX: number, tileY: number): ObjectTypeValue | null;
  },
): InteractableRegistry {
  const registry = new InteractableRegistry();

  for (let tileY = 0; tileY < map.height; tileY++) {
    for (let tileX = 0; tileX < map.width; tileX++) {
      const object = map.getObject(tileX, tileY);
      if (!object) {
        continue;
      }

      const config = INTERACTABLE_CONFIG[object];
      if (!config) {
        continue;
      }

      registry.register({
        kind: TargetKind.World,
        tileX,
        tileY,
        objectType: object,
        label: config.label,
        examineText: config.examineText,
        actions: config.actions,
      });
    }
  }

  return registry;
}

