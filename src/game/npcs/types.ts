import type { EntityId } from '../components/types';

export interface NpcDefinition {
  id: string;
  name: string;
  x: number;
  y: number;
  examineText: string;
  textureKey: string;
}

export interface NpcInstance {
  definition: NpcDefinition;
  entityId: EntityId;
}
