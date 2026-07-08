import type { InteractableTarget, InteractionAction } from './types';

export interface TileCoord {
  tileX: number;
  tileY: number;
}

export interface InteractionState {
  hoveredTarget: InteractableTarget | null;
  selectedTarget: InteractableTarget | null;
  approachTile: TileCoord | null;
  inRange: boolean;
  message: string | null;
  pendingAction: InteractionAction | null;
}

export function createInteractionState(): InteractionState {
  return {
    hoveredTarget: null,
    selectedTarget: null,
    approachTile: null,
    inRange: false,
    message: null,
    pendingAction: null,
  };
}

export function clearApproach(state: InteractionState): void {
  state.approachTile = null;
  state.pendingAction = null;
}

export function setInteractionMessage(state: InteractionState, message: string): void {
  state.message = message;
}
