import type { InteractableTarget, InteractionAction } from './types';
import { GATHER_DURATION_MS } from '../constants';

export interface TileCoord {
  tileX: number;
  tileY: number;
}

export interface GatheringProgress {
  target: InteractableTarget;
  action: InteractionAction;
  elapsedMs: number;
  durationMs: number;
}

export interface InteractionState {
  hoveredTarget: InteractableTarget | null;
  selectedTarget: InteractableTarget | null;
  approachTile: TileCoord | null;
  inRange: boolean;
  message: string | null;
  pendingAction: InteractionAction | null;
  gathering: GatheringProgress | null;
}

export function createInteractionState(): InteractionState {
  return {
    hoveredTarget: null,
    selectedTarget: null,
    approachTile: null,
    inRange: false,
    message: null,
    pendingAction: null,
    gathering: null,
  };
}

export function clearApproach(state: InteractionState): void {
  state.approachTile = null;
  state.pendingAction = null;
}

export function cancelGathering(state: InteractionState): void {
  state.gathering = null;
}

export function startGathering(
  state: InteractionState,
  target: InteractableTarget,
  action: InteractionAction,
): void {
  state.gathering = {
    target,
    action,
    elapsedMs: 0,
    durationMs: GATHER_DURATION_MS,
  };
  state.pendingAction = null;
  state.approachTile = null;
  state.selectedTarget = target;
}

export function setInteractionMessage(state: InteractionState, message: string): void {
  state.message = message;
}
