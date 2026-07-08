import { ItemId } from '../inventory/types';
import { QuestId } from './types';
import type { QuestDefinition } from './types';

export const QUEST_DEFINITIONS: Record<QuestId, QuestDefinition> = {
  [QuestId.VillageLogs]: {
    id: QuestId.VillageLogs,
    title: "Elder Mia's Request",
    description: 'Elder Mia needs firewood for the village. Bring her 5 logs.',
    giverNpcId: 'elder_mia',
    requirement: { itemId: ItemId.Logs, quantity: 5 },
    completionMessage: 'Thank you! The village will stay warm this winter.',
  },
  [QuestId.VillageOre]: {
    id: QuestId.VillageOre,
    title: "Bob's Ore Order",
    description: 'Bob the smith needs copper ore for tools. Bring him 3 copper ore.',
    giverNpcId: 'smith_bob',
    requirement: { itemId: ItemId.CopperOre, quantity: 3 },
    completionMessage: 'Fine ore! These will make sturdy tools for the village.',
  },
};

export function getQuestForNpc(npcId: string): QuestDefinition | null {
  return Object.values(QUEST_DEFINITIONS).find((quest) => quest.giverNpcId === npcId) ?? null;
}
