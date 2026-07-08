import type { ItemId } from '../inventory/types';

export const QuestId = {
  VillageLogs: 'village_logs',
  VillageOre: 'village_ore',
} as const;

export type QuestId = (typeof QuestId)[keyof typeof QuestId];

export const QuestStatus = {
  NotStarted: 'not_started',
  Active: 'active',
  Completed: 'completed',
} as const;

export type QuestStatus = (typeof QuestStatus)[keyof typeof QuestStatus];

export interface QuestRequirement {
  itemId: ItemId;
  quantity: number;
}

export interface QuestDefinition {
  id: QuestId;
  title: string;
  description: string;
  giverNpcId: string;
  requirement: QuestRequirement;
  completionMessage: string;
}

export interface QuestProgress {
  status: QuestStatus;
}

export type QuestState = Record<QuestId, QuestProgress>;

export function createQuestState(): QuestState {
  return {
    [QuestId.VillageLogs]: { status: QuestStatus.NotStarted },
    [QuestId.VillageOre]: { status: QuestStatus.NotStarted },
  };
}
