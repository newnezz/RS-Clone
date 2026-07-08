import type { EntityManager } from '../entities/EntityManager';
import type { GameContext } from '../core/GameContext';
import { TILE_SIZE } from '../constants';
import {
  TargetKind,
  type InteractableTarget,
} from '../interaction/types';
import { getNpcActions } from '../quests/questLogic';
import type { NpcDefinition, NpcInstance } from './types';

const NPC_PICK_RADIUS = 18;

export class NpcRegistry {
  private readonly instances = new Map<string, NpcInstance>();

  register(instance: NpcInstance): void {
    this.instances.set(instance.definition.id, instance);
  }

  get(npcId: string): NpcInstance | null {
    return this.instances.get(npcId) ?? null;
  }

  getAll(): NpcInstance[] {
    return [...this.instances.values()];
  }

  findAtWorld(context: GameContext, worldX: number, worldY: number): InteractableTarget | null {
    let closest: { instance: NpcInstance; distance: number } | null = null;

    for (const instance of this.instances.values()) {
      const entity = context.entityManager.get(instance.entityId);
      const position = entity?.components.position;
      if (!position) {
        continue;
      }

      const distance = Math.hypot(position.x - worldX, position.y - worldY);
      if (distance > NPC_PICK_RADIUS) {
        continue;
      }

      if (!closest || distance < closest.distance) {
        closest = { instance, distance };
      }
    }

    if (!closest) {
      return null;
    }

    return this.buildTarget(context, closest.instance.definition.id);
  }

  buildTarget(context: GameContext, npcId: string): InteractableTarget | null {
    const instance = this.instances.get(npcId);
    if (!instance) {
      return null;
    }

    const entity = context.entityManager.get(instance.entityId);
    const position = entity?.components.position;
    if (!position) {
      return null;
    }

    const { progress } = context.gameState;
    const tileX = Math.floor(position.x / TILE_SIZE);
    const tileY = Math.floor(position.y / TILE_SIZE);

    return {
      kind: TargetKind.Npc,
      tileX,
      tileY,
      npcId: instance.definition.id,
      objectType: 'npc',
      label: instance.definition.name,
      examineText: instance.definition.examineText,
      actions: getNpcActions(
        instance.definition.id,
        progress.quests,
        progress.inventory,
      ),
    };
  }
}

export function spawnNpcs(
  entityManager: EntityManager,
  definitions: NpcDefinition[],
  createNpc: (entityManager: EntityManager, definition: NpcDefinition) => { id: string },
): NpcRegistry {
  const registry = new NpcRegistry();

  for (const definition of definitions) {
    const entity = createNpc(entityManager, definition);
    registry.register({ definition, entityId: entity.id });
  }

  return registry;
}
