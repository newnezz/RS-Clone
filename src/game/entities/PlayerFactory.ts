import {
  collidable,
  playerTag,
  position,
  renderable,
  velocity,
} from '../components';
import type { Entity } from '../components/types';
import type { EntityManager } from './EntityManager';
import { PLAYER_RADIUS } from '../constants';

export function createPlayer(
  entityManager: EntityManager,
  spawnX: number,
  spawnY: number,
): Entity {
  return entityManager.create({
    position: position(spawnX, spawnY),
    velocity: velocity(),
    player: playerTag(),
    collidable: collidable(PLAYER_RADIUS),
    renderable: renderable('player', 10),
  });
}
