import type { EntityId } from '../components/types';
import { createInventory, type Inventory } from '../inventory/types';
import { createQuestState, type QuestState } from '../quests/types';
import { createSkillsState, type SkillsState } from '../skills/types';

export interface PlayerProgress {
  skills: SkillsState;
  inventory: Inventory;
  quests: QuestState;
}

export interface GameState {
  tick: number;
  playerEntityId: EntityId;
  progress: PlayerProgress;
}

export function createPlayerProgress(): PlayerProgress {
  return {
    skills: createSkillsState(),
    inventory: createInventory(),
    quests: createQuestState(),
  };
}

export function createGameState(playerEntityId: EntityId): GameState {
  return {
    tick: 0,
    playerEntityId,
    progress: createPlayerProgress(),
  };
}
