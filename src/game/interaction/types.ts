export const InteractionAction = {
  Examine: 'examine',
  Chop: 'chop',
  Mine: 'mine',
  Talk: 'talk',
  CompleteQuest: 'complete_quest',
} as const;

export type InteractionAction = (typeof InteractionAction)[keyof typeof InteractionAction];

export const TargetKind = {
  World: 'world',
  Npc: 'npc',
} as const;

export type TargetKind = (typeof TargetKind)[keyof typeof TargetKind];

export interface InteractableTarget {
  kind: TargetKind;
  tileX: number;
  tileY: number;
  npcId?: string;
  objectType: string;
  label: string;
  examineText: string;
  actions: InteractionAction[];
}

export const ACTION_LABELS: Record<InteractionAction, string> = {
  [InteractionAction.Examine]: 'Examine',
  [InteractionAction.Chop]: 'Chop',
  [InteractionAction.Mine]: 'Mine',
  [InteractionAction.Talk]: 'Talk',
  [InteractionAction.CompleteQuest]: 'Hand In',
};

export function tileKey(tileX: number, tileY: number): string {
  return `${tileX},${tileY}`;
}

export function targetKey(target: InteractableTarget): string {
  if (target.kind === TargetKind.Npc && target.npcId) {
    return `npc:${target.npcId}`;
  }
  return tileKey(target.tileX, target.tileY);
}
