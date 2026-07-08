import type { EntityId } from '../components/types';

export interface PlayerSnapshot {
  entityId: EntityId;
  x: number;
  y: number;
}

export interface WorldSnapshot {
  tick: number;
  player: PlayerSnapshot;
}
