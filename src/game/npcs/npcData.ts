import { TILE_SIZE } from '../constants';
import type { NpcDefinition } from './types';

export const NPC_DEFINITIONS: NpcDefinition[] = [
  {
    id: 'elder_mia',
    name: 'Elder Mia',
    x: 11 * TILE_SIZE + TILE_SIZE / 2,
    y: 13 * TILE_SIZE + TILE_SIZE / 2,
    examineText: 'The village elder. She keeps everyone organized.',
    textureKey: 'npc_elder',
  },
  {
    id: 'smith_bob',
    name: 'Bob the Smith',
    x: 15 * TILE_SIZE + TILE_SIZE / 2,
    y: 11 * TILE_SIZE + TILE_SIZE / 2,
    examineText: 'The village blacksmith. His forge is always busy.',
    textureKey: 'npc_smith',
  },
];

export function getNpcDefinition(npcId: string): NpcDefinition | undefined {
  return NPC_DEFINITIONS.find((npc) => npc.id === npcId);
}
