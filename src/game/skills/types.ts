export const SkillId = {
  Woodcutting: 'woodcutting',
  Mining: 'mining',
} as const;

export type SkillId = (typeof SkillId)[keyof typeof SkillId];

export interface SkillState {
  xp: number;
  level: number;
}

export type SkillsState = Record<SkillId, SkillState>;

export const SKILL_LABELS: Record<SkillId, string> = {
  [SkillId.Woodcutting]: 'Woodcutting',
  [SkillId.Mining]: 'Mining',
};

export function createSkillsState(): SkillsState {
  return {
    [SkillId.Woodcutting]: { xp: 0, level: 1 },
    [SkillId.Mining]: { xp: 0, level: 1 },
  };
}

/** Simplified RS-style XP thresholds for levels 1–20. */
const XP_FOR_LEVEL: number[] = (() => {
  const table = [0];
  let cumulative = 0;
  for (let level = 1; level <= 99; level++) {
    cumulative += Math.floor(level + 300 * Math.pow(2, level / 7));
    table.push(Math.floor(cumulative / 4));
  }
  return table;
})();

export function levelFromXp(xp: number): number {
  for (let level = XP_FOR_LEVEL.length - 1; level >= 1; level--) {
    if (xp >= XP_FOR_LEVEL[level]) {
      return level;
    }
  }
  return 1;
}

export function xpToNextLevel(xp: number, level: number): number {
  if (level >= 99) {
    return 0;
  }
  return XP_FOR_LEVEL[level + 1] - xp;
}

export function addSkillXp(skills: SkillsState, skillId: SkillId, amount: number): {
  leveledUp: boolean;
  newLevel: number;
} {
  const skill = skills[skillId];
  const previousLevel = skill.level;
  skill.xp += amount;
  skill.level = levelFromXp(skill.xp);

  return {
    leveledUp: skill.level > previousLevel,
    newLevel: skill.level,
  };
}
