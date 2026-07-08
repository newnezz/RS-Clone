export type EntityId = string;

export type ComponentType =
  | 'position'
  | 'velocity'
  | 'player'
  | 'npc'
  | 'collidable'
  | 'renderable';

export interface PositionComponent {
  type: 'position';
  x: number;
  y: number;
}

export interface VelocityComponent {
  type: 'velocity';
  vx: number;
  vy: number;
}

export interface PlayerComponent {
  type: 'player';
}

export interface NpcComponent {
  type: 'npc';
  npcId: string;
  name: string;
}

export interface CollidableComponent {
  type: 'collidable';
  radius: number;
}

export interface RenderableComponent {
  type: 'renderable';
  textureKey: string;
  depth: number;
}

export type Component =
  | PositionComponent
  | VelocityComponent
  | PlayerComponent
  | NpcComponent
  | CollidableComponent
  | RenderableComponent;

export type ComponentMap = {
  [K in ComponentType]?: Extract<Component, { type: K }>;
};

export interface Entity {
  id: EntityId;
  components: ComponentMap;
}
