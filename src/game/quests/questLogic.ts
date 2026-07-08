import { countItem, ITEM_DEFINITIONS, removeItem, type Inventory } from '../inventory/types';
import { InteractionAction } from '../interaction/types';
import { getQuestForNpc, QUEST_DEFINITIONS } from './questDefinitions';
import { QuestStatus, type QuestDefinition, type QuestId, type QuestState } from './types';

export function getQuestProgressSummary(
  quest: QuestDefinition,
  inventory: Inventory,
  questState: QuestState,
): string {
  const progress = questState[quest.id];
  const owned = countItem(inventory, quest.requirement.itemId);
  const itemName = ITEM_DEFINITIONS[quest.requirement.itemId].name.toLowerCase();

  if (progress.status === QuestStatus.Completed) {
    return `${quest.title}: completed`;
  }

  if (progress.status === QuestStatus.NotStarted) {
    return `${quest.title}: not started`;
  }

  return `${quest.title}: ${owned}/${quest.requirement.quantity} ${itemName}`;
}

export function getActiveQuestLines(questState: QuestState, inventory: Inventory): string[] {
  return Object.values(QUEST_DEFINITIONS)
    .filter((quest) => questState[quest.id].status === QuestStatus.Active)
    .map((quest) => getQuestProgressSummary(quest, inventory, questState));
}

export function canCompleteQuest(
  quest: QuestDefinition,
  inventory: Inventory,
  questState: QuestState,
): boolean {
  const progress = questState[quest.id];
  if (progress.status !== QuestStatus.Active) {
    return false;
  }

  return countItem(inventory, quest.requirement.itemId) >= quest.requirement.quantity;
}

export function startQuest(questState: QuestState, questId: QuestId): boolean {
  const progress = questState[questId];
  if (progress.status !== QuestStatus.NotStarted) {
    return false;
  }

  progress.status = QuestStatus.Active;
  return true;
}

export function completeQuest(
  questState: QuestState,
  inventory: Inventory,
  questId: QuestId,
): { success: boolean; message: string } {
  const quest = QUEST_DEFINITIONS[questId];
  const progress = questState[questId];

  if (progress.status !== QuestStatus.Active) {
    return { success: false, message: 'You do not have an active quest to complete.' };
  }

  if (!canCompleteQuest(quest, inventory, questState)) {
    const owned = countItem(inventory, quest.requirement.itemId);
    const itemName = ITEM_DEFINITIONS[quest.requirement.itemId].name.toLowerCase();
    return {
      success: false,
      message: `You still need ${quest.requirement.quantity - owned} more ${itemName}.`,
    };
  }

  const removed = removeItem(inventory, quest.requirement.itemId, quest.requirement.quantity);
  if (!removed) {
    return { success: false, message: 'Could not remove quest items from inventory.' };
  }

  progress.status = QuestStatus.Completed;
  return { success: true, message: quest.completionMessage };
}

export function getNpcTalkMessage(
  npcId: string,
  npcName: string,
  questState: QuestState,
  inventory: Inventory,
): string {
  const quest = getQuestForNpc(npcId);
  if (!quest) {
    return `${npcName} smiles at you warmly.`;
  }

  const progress = questState[quest.id];
  const itemName = ITEM_DEFINITIONS[quest.requirement.itemId].name.toLowerCase();
  const owned = countItem(inventory, quest.requirement.itemId);

  if (progress.status === QuestStatus.NotStarted) {
    return `${npcName}: "${quest.description}"`;
  }

  if (progress.status === QuestStatus.Completed) {
    return `${npcName}: "Thanks again for your help with the ${itemName}."`;
  }

  if (canCompleteQuest(quest, inventory, questState)) {
    return `${npcName}: "You have enough ${itemName}! Ready to hand them in?"`;
  }

  return `${npcName}: "How goes the errand? I need ${quest.requirement.quantity} ${itemName}. You have ${owned}."`;
}

export function getNpcActions(
  npcId: string,
  questState: QuestState,
  inventory: Inventory,
): InteractionAction[] {
  const actions: InteractionAction[] = [InteractionAction.Examine, InteractionAction.Talk];

  const quest = getQuestForNpc(npcId);
  if (quest && canCompleteQuest(quest, inventory, questState)) {
    actions.push(InteractionAction.CompleteQuest);
  }

  return actions;
}
