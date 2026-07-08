import type { GameContext } from '../core/GameContext';
import { GameEvents } from '../core/EventBus';
import { InteractionAction, TargetKind, type InteractableTarget } from './types';
import { getQuestForNpc } from '../quests/questDefinitions';
import {
  completeQuest,
  getNpcTalkMessage,
  startQuest,
} from '../quests/questLogic';
import { QuestStatus } from '../quests/types';

export interface NpcActionResult {
  success: boolean;
  message: string;
}

export function performNpcAction(
  context: GameContext,
  action: InteractionAction,
  target: InteractableTarget,
): NpcActionResult {
  if (target.kind !== TargetKind.Npc || !target.npcId) {
    return { success: false, message: 'Invalid NPC target.' };
  }

  const npcId = target.npcId;
  const { progress } = context.gameState;
  const quest = getQuestForNpc(npcId);

  switch (action) {
    case InteractionAction.Examine:
      return { success: true, message: target.examineText };

    case InteractionAction.Talk: {
      if (quest && progress.quests[quest.id].status === QuestStatus.NotStarted) {
        startQuest(progress.quests, quest.id);
        context.events.emit(GameEvents.QuestStarted, { questId: quest.id, title: quest.title });
        return {
          success: true,
          message: `${target.label}: "${quest.description}" Quest started!`,
        };
      }

      return {
        success: true,
        message: getNpcTalkMessage(npcId, target.label, progress.quests, progress.inventory),
      };
    }

    case InteractionAction.CompleteQuest: {
      if (!quest) {
        return { success: false, message: 'This villager has no quest for you.' };
      }

      const result = completeQuest(progress.quests, progress.inventory, quest.id);
      if (result.success) {
        context.events.emit(GameEvents.QuestCompleted, { questId: quest.id, title: quest.title });
      }
      return result;
    }

    default:
      return { success: false, message: 'You cannot do that with this person.' };
  }
}
