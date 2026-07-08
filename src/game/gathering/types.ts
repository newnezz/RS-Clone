import { ItemId } from '../inventory/types';
import { SkillId } from '../skills/types';
import { ObjectType, type ObjectType as ObjectTypeValue } from '../world/TileTypes';
import { InteractionAction } from '../interaction/types';

export interface GatheringConfig {
  skillId: SkillId;
  itemId: ItemId;
  xp: number;
  hitsToDeplete: number;
  gatherMessage: string;
  depleteMessage: string;
  action: InteractionAction;
}

export const GATHERING_BY_OBJECT: Partial<Record<ObjectTypeValue, GatheringConfig>> = {
  [ObjectType.Tree]: {
    skillId: SkillId.Woodcutting,
    itemId: ItemId.Logs,
    xp: 25,
    hitsToDeplete: 1,
    gatherMessage: 'You get some logs.',
    depleteMessage: 'The tree falls.',
    action: InteractionAction.Chop,
  },
  [ObjectType.Rock]: {
    skillId: SkillId.Mining,
    itemId: ItemId.CopperOre,
    xp: 17.5,
    hitsToDeplete: 1,
    gatherMessage: 'You mine some copper ore.',
    depleteMessage: 'The rock crumbles away.',
    action: InteractionAction.Mine,
  },
};

export function getGatheringConfig(objectType: string): GatheringConfig | null {
  return GATHERING_BY_OBJECT[objectType as ObjectTypeValue] ?? null;
}

export function getGatheringConfigForAction(
  objectType: string,
  action: InteractionAction,
): GatheringConfig | null {
  const config = getGatheringConfig(objectType);
  if (!config || config.action !== action) {
    return null;
  }
  return config;
}

export function getAutoGatherAction(objectType: string): InteractionAction | null {
  return getGatheringConfig(objectType)?.action ?? null;
}
