import type { GameContext } from '../core/GameContext';
import { performGatheringAction } from '../gathering/gatheringLogic';
import { findInteractionTarget, refreshSelectedTarget } from '../interaction/findTarget';
import { getAutoGatherAction } from '../gathering/types';
import {
  cancelGathering,
  clearApproach,
  setInteractionMessage,
  startGathering,
} from '../interaction/InteractionState';
import {
  findApproachTile,
  hasManualMovement,
  isPlayerInInteractionRange,
} from '../interaction/interactionUtils';
import { InteractionAction } from '../interaction/types';
import type { GameSystem } from './SystemPipeline';

export class GatheringSystem implements GameSystem {
  readonly name = 'gathering';

  update(context: GameContext, deltaSeconds: number): void {
    const state = context.interactionState;
    const gathering = state.gathering;
    if (!gathering) {
      return;
    }

    if (hasManualMovement(context.inputState.movement)) {
      cancelGathering(state);
      setInteractionMessage(state, 'Gathering interrupted.');
      return;
    }

    const playerPosition = context.getPlayerPosition();
    if (!playerPosition) {
      cancelGathering(state);
      return;
    }

    gathering.target = refreshSelectedTarget(context, gathering.target);

    if (!isPlayerInInteractionRange(playerPosition.x, playerPosition.y, gathering.target)) {
      cancelGathering(state);
      setInteractionMessage(state, 'Moved too far away.');
      return;
    }

    gathering.elapsedMs += deltaSeconds * 1000;

    if (gathering.elapsedMs < gathering.durationMs) {
      return;
    }

    const result = performGatheringAction(context, gathering.action, gathering.target);
    state.gathering = null;
    state.pendingAction = null;
    setInteractionMessage(state, result.message);

    if (result.depleted) {
      state.selectedTarget = null;
    }
  }
}

export class InteractionSystem implements GameSystem {
  readonly name = 'interaction';

  update(context: GameContext, _deltaSeconds: number): void {
    const state = context.interactionState;
    const playerPosition = context.getPlayerPosition();

    if (hasManualMovement(context.inputState.movement)) {
      clearApproach(state);
      if (state.gathering) {
        cancelGathering(state);
      }
    }

    this.updateHover(context);

    if (context.inputState.doubleSelectPressed && context.inputState.pointer) {
      this.handleDoubleSelect(
        context,
        context.inputState.pointer.worldX,
        context.inputState.pointer.worldY,
      );
    }

    if (state.selectedTarget) {
      state.selectedTarget = refreshSelectedTarget(context, state.selectedTarget);
    }

    if (state.pendingAction && state.selectedTarget && playerPosition && !state.gathering) {
      this.tryStartGathering(context);
    }

    if (state.selectedTarget && playerPosition && !state.gathering) {
      state.inRange = isPlayerInInteractionRange(
        playerPosition.x,
        playerPosition.y,
        state.selectedTarget,
      );

      if (state.inRange) {
        state.approachTile = null;
      } else if (
        state.pendingAction &&
        !state.approachTile &&
        !hasManualMovement(context.inputState.movement)
      ) {
        state.approachTile = findApproachTile(
          context.map,
          state.selectedTarget,
          playerPosition.x,
          playerPosition.y,
        );
      }
    } else {
      state.inRange = false;
    }
  }

  private updateHover(context: GameContext): void {
    const state = context.interactionState;
    const pointer = context.inputState.pointer;

    if (!pointer) {
      state.hoveredTarget = null;
      return;
    }

    state.hoveredTarget = findInteractionTarget(context, pointer.worldX, pointer.worldY);
  }

  private handleDoubleSelect(context: GameContext, worldX: number, worldY: number): void {
    const state = context.interactionState;
    const target = findInteractionTarget(context, worldX, worldY);
    const action = target ? getAutoGatherAction(target.objectType) : null;

    if (!target || !action) {
      return;
    }

    cancelGathering(state);
    state.selectedTarget = target;
    state.pendingAction = action;

    const playerPosition = context.getPlayerPosition();
    if (!playerPosition) {
      return;
    }

    if (isPlayerInInteractionRange(playerPosition.x, playerPosition.y, target)) {
      startGathering(state, target, action);
      setInteractionMessage(state, this.getGatheringLabel(action, target.label));
      return;
    }

    state.approachTile = findApproachTile(
      context.map,
      target,
      playerPosition.x,
      playerPosition.y,
    );
    setInteractionMessage(state, `Walking to ${target.label.toLowerCase()}...`);
  }

  private tryStartGathering(context: GameContext): void {
    const state = context.interactionState;
    const target = state.selectedTarget;
    const action = state.pendingAction;
    const playerPosition = context.getPlayerPosition();

    if (!target || !action || !playerPosition) {
      return;
    }

    if (!getAutoGatherAction(target.objectType)) {
      return;
    }

    if (!isPlayerInInteractionRange(playerPosition.x, playerPosition.y, target)) {
      return;
    }

    startGathering(state, target, action);
    setInteractionMessage(state, this.getGatheringLabel(action, target.label));
  }

  private getGatheringLabel(action: InteractionAction, label: string): string {
    if (action === InteractionAction.Chop) {
      return `Chopping ${label.toLowerCase()}...`;
    }
    if (action === InteractionAction.Mine) {
      return `Mining ${label.toLowerCase()}...`;
    }
    return `Gathering ${label.toLowerCase()}...`;
  }
}
