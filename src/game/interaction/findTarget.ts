import type { GameContext } from '../core/GameContext';
import type { InteractableTarget } from './types';
import { TargetKind } from './types';

export function findInteractionTarget(
  context: GameContext,
  worldX: number,
  worldY: number,
): InteractableTarget | null {
  const npcTarget = context.npcs.findAtWorld(context, worldX, worldY);
  if (npcTarget) {
    return npcTarget;
  }

  return context.interactables.findAtWorld(context.map, worldX, worldY);
}

export function refreshSelectedTarget(context: GameContext, target: InteractableTarget): InteractableTarget {
  if (target.kind === TargetKind.Npc && target.npcId) {
    return context.npcs.buildTarget(context, target.npcId) ?? target;
  }

  return target;
}
