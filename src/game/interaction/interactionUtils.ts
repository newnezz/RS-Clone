import { TILE_SIZE } from '../constants';
import type { TileCoord } from '../world/TileTypes';
import type { WorldMap } from '../world/WorldMap';
import type { InteractableTarget } from './types';

const NEIGHBOR_OFFSETS = [
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -1, y: 1 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
];

export function isPlayerInInteractionRange(
  playerX: number,
  playerY: number,
  target: InteractableTarget,
): boolean {
  const playerTileX = Math.floor(playerX / TILE_SIZE);
  const playerTileY = Math.floor(playerY / TILE_SIZE);
  const dx = Math.abs(playerTileX - target.tileX);
  const dy = Math.abs(playerTileY - target.tileY);

  return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
}

export function findApproachTile(
  map: WorldMap,
  target: InteractableTarget,
  playerX: number,
  playerY: number,
): TileCoord | null {
  const playerTileX = Math.floor(playerX / TILE_SIZE);
  const playerTileY = Math.floor(playerY / TILE_SIZE);

  let best: TileCoord | null = null;
  let bestDistance = Infinity;

  for (const offset of NEIGHBOR_OFFSETS) {
    const tileX = target.tileX + offset.x;
    const tileY = target.tileY + offset.y;

    if (!map.isTileWalkable(tileX, tileY)) {
      continue;
    }

    const distance = Math.hypot(tileX - playerTileX, tileY - playerTileY);
    if (distance < bestDistance) {
      best = { tileX, tileY };
      bestDistance = distance;
    }
  }

  return best;
}

export function hasManualMovement(movement: { x: number; y: number }): boolean {
  return movement.x !== 0 || movement.y !== 0;
}
