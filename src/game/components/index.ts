import type {
  CollidableComponent,
  ComponentMap,
  Entity,
  EntityId,
  NpcComponent,
  PlayerComponent,
  PositionComponent,
  RenderableComponent,
  VelocityComponent,
} from './types';

let nextEntityId = 1;

export function createEntityId(): EntityId {
  return `entity_${nextEntityId++}`;
}

export function createEntity(components: ComponentMap): Entity {
  return {
    id: createEntityId(),
    components,
  };
}

export function position(x: number, y: number): PositionComponent {
  return { type: 'position', x, y };
}

export function velocity(vx = 0, vy = 0): VelocityComponent {
  return { type: 'velocity', vx, vy };
}

export function playerTag(): PlayerComponent {
  return { type: 'player' };
}

export function npcTag(npcId: string, name: string): NpcComponent {
  return { type: 'npc', npcId, name };
}

export function collidable(radius: number): CollidableComponent {
  return { type: 'collidable', radius };
}

export function renderable(textureKey: string, depth: number): RenderableComponent {
  return { type: 'renderable', textureKey, depth };
}
