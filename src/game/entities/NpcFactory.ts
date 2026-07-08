import {
  collidable,
  npcTag,
  position,
  renderable,
} from '../components';
import type { Entity } from '../components/types';
import type { EntityManager } from './EntityManager';
import type { NpcDefinition } from '../npcs/types';

const NPC_RADIUS = 8;

export function createNpc(entityManager: EntityManager, definition: NpcDefinition): Entity {
  return entityManager.create({
    position: position(definition.x, definition.y),
    collidable: collidable(NPC_RADIUS),
    renderable: renderable(definition.textureKey, 10),
    npc: npcTag(definition.id, definition.name),
  });
}
