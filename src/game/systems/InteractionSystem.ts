import type { GameContext } from '../core/GameContext';
import { performGatheringAction } from '../gathering/gatheringLogic';
import { findInteractionTarget, refreshSelectedTarget } from '../interaction/findTarget';
import { performNpcAction } from '../interaction/npcInteraction';
import {
  clearApproach,
  setInteractionMessage,
} from '../interaction/InteractionState';
import {
  findApproachTile,
  hasManualMovement,
  isPlayerInInteractionRange,
} from '../interaction/interactionUtils';
import { InteractionAction, TargetKind } from '../interaction/types';
import type { GameSystem } from './SystemPipeline';
import { GameEvents } from '../core/EventBus';

export class InteractionSystem implements GameSystem {
  readonly name = 'interaction';

  update(context: GameContext, _deltaSeconds: number): void {
    const state = context.interactionState;
    const playerPosition = context.getPlayerPosition();

    if (hasManualMovement(context.inputState.movement)) {
      clearApproach(state);
    }

    this.updateHover(context);

    if (state.selectedTarget) {
      state.selectedTarget = refreshSelectedTarget(context, state.selectedTarget);
    }

    if (context.inputState.selectPressed && context.inputState.pointer) {
      this.handleSelect(context, context.inputState.pointer.worldX, context.inputState.pointer.worldY);
    }

    if (context.inputState.interactPressed && state.selectedTarget) {
      this.requestAction(context, InteractionAction.Examine);
    }

    if (state.pendingAction && state.selectedTarget && playerPosition) {
      this.tryExecuteAction(context, state.pendingAction);
    }

    if (state.selectedTarget && playerPosition) {
      state.inRange = isPlayerInInteractionRange(
        playerPosition.x,
        playerPosition.y,
        state.selectedTarget,
      );

      if (state.inRange) {
        state.approachTile = null;
      } else if (!state.approachTile && !hasManualMovement(context.inputState.movement)) {
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

  requestAction(context: GameContext, action: InteractionAction): void {
    const state = context.interactionState;
    if (!state.selectedTarget) {
      return;
    }

    state.selectedTarget = refreshSelectedTarget(context, state.selectedTarget);

    if (!state.selectedTarget.actions.includes(action)) {
      return;
    }

    state.pendingAction = action;
    this.tryExecuteAction(context, action);
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

  private handleSelect(context: GameContext, worldX: number, worldY: number): void {
    const state = context.interactionState;
    const target = findInteractionTarget(context, worldX, worldY);

    if (!target) {
      state.selectedTarget = null;
      clearApproach(state);
      state.message = null;
      return;
    }

    state.selectedTarget = target;
    state.pendingAction = null;
    state.approachTile = null;

    context.events.emit(GameEvents.InteractionSelected, { target });

    const playerPosition = context.getPlayerPosition();
    if (!playerPosition) {
      return;
    }

    if (isPlayerInInteractionRange(playerPosition.x, playerPosition.y, target)) {
      setInteractionMessage(state, `Selected ${target.label}. Choose an action.`);
      return;
    }

    state.approachTile = findApproachTile(context.map, target, playerPosition.x, playerPosition.y);
    setInteractionMessage(state, `Walking to ${target.label}...`);
  }

  private tryExecuteAction(context: GameContext, action: InteractionAction): void {
    const state = context.interactionState;
    const target = state.selectedTarget;
    const playerPosition = context.getPlayerPosition();

    if (!target || !playerPosition) {
      return;
    }

    if (!isPlayerInInteractionRange(playerPosition.x, playerPosition.y, target)) {
      state.pendingAction = action;
      state.approachTile = findApproachTile(
        context.map,
        target,
        playerPosition.x,
        playerPosition.y,
      );
      setInteractionMessage(state, `Walking to ${target.label}...`);
      return;
    }

    if (target.kind === TargetKind.Npc) {
      const result = performNpcAction(context, action, target);
      setInteractionMessage(state, result.message);
      state.pendingAction = null;
      state.approachTile = null;
      state.selectedTarget = refreshSelectedTarget(context, target);
      return;
    }

    const result = performGatheringAction(context, action, target);
    setInteractionMessage(state, result.message);
    state.pendingAction = null;
    state.approachTile = null;

    if (result.depleted) {
      state.selectedTarget = null;
    }
  }
}
