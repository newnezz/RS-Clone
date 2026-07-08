import type { GameContext } from '../core/GameContext';
import { GameEvents } from '../core/EventBus';
import { addItem } from '../inventory/types';
import { ITEM_DEFINITIONS } from '../inventory/types';
import { InteractionAction } from '../interaction/types';
import type { InteractableTarget } from '../interaction/types';
import { addSkillXp, SKILL_LABELS } from '../skills/types';
import { ObjectType } from '../world/TileTypes';
import { getGatheringConfigForAction } from './types';

export interface GatherResult {
  success: boolean;
  message: string;
  depleted: boolean;
}

export function performGatheringAction(
  context: GameContext,
  action: InteractionAction,
  target: InteractableTarget,
): GatherResult {
  if (action === InteractionAction.Examine) {
    return { success: true, message: target.examineText, depleted: false };
  }

  const config = getGatheringConfigForAction(target.objectType, action);
  if (!config) {
    return { success: false, message: 'Nothing interesting happens.', depleted: false };
  }

  const node = context.resourceNodes.getAt(target.tileX, target.tileY);
  if (!node || node.remainingHits <= 0) {
    return { success: false, message: `This ${target.label.toLowerCase()} is already depleted.`, depleted: false };
  }

  const addResult = addItem(context.gameState.progress.inventory, config.itemId, 1);
  if (!addResult.success) {
    return { success: false, message: 'Your inventory is full.', depleted: false };
  }

  const xpResult = addSkillXp(context.gameState.progress.skills, config.skillId, config.xp);
  const hitNode = context.resourceNodes.hit(target.tileX, target.tileY);
  const depleted = hitNode !== null && hitNode.remainingHits <= 0;

  let message = config.gatherMessage;
  if (xpResult.leveledUp) {
    message += ` ${SKILL_LABELS[config.skillId]} level ${xpResult.newLevel}!`;
  }

  context.events.emit(GameEvents.ItemGained, {
    itemId: config.itemId,
    quantity: 1,
    name: ITEM_DEFINITIONS[config.itemId].name,
  });

  context.events.emit(GameEvents.SkillXpGained, {
    skillId: config.skillId,
    xp: config.xp,
    level: context.gameState.progress.skills[config.skillId].level,
    leveledUp: xpResult.leveledUp,
  });

  if (depleted) {
    context.map.setObject(target.tileX, target.tileY, ObjectType.None);
    context.interactables.unregister(target.tileX, target.tileY);
    context.resourceNodes.remove(target.tileX, target.tileY);
    context.gatherableVisuals?.remove(target.tileX, target.tileY);

    message = `${config.depleteMessage} ${config.gatherMessage}`;
    if (xpResult.leveledUp) {
      message += ` ${SKILL_LABELS[config.skillId]} level ${xpResult.newLevel}!`;
    }

    context.events.emit(GameEvents.ResourceDepleted, {
      tileX: target.tileX,
      tileY: target.tileY,
      objectType: target.objectType,
    });
  }

  context.events.emit(GameEvents.InteractionPerformed, {
    action,
    target,
    message,
  });

  return { success: true, message, depleted };
}
