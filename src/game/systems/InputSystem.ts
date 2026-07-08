import type { GameContext } from '../core/GameContext';
import { GameEvents } from '../core/EventBus';
import { APPROACH_ARRIVAL_DISTANCE, PLAYER_SPEED } from '../constants';
import { normalizeInputVector } from '../input/types';
import { hasManualMovement } from '../interaction/interactionUtils';
import type { GameSystem } from './SystemPipeline';

export class InputSystem implements GameSystem {
  readonly name = 'input';

  update(context: GameContext, _deltaSeconds: number): void {
    const player = context.entityManager.findPlayer();
    if (!player?.components.velocity) {
      return;
    }

    const velocity = player.components.velocity;
    const interaction = context.interactionState;

    if (interaction.gathering) {
      velocity.vx = 0;
      velocity.vy = 0;
      return;
    }

    if (hasManualMovement(context.inputState.movement)) {
      const direction = normalizeInputVector(context.inputState.movement);
      velocity.vx = direction.x * PLAYER_SPEED;
      velocity.vy = direction.y * PLAYER_SPEED;
      return;
    }

    if (interaction.approachTile && interaction.selectedTarget) {
      const playerPosition = context.getPlayerPosition();
      if (playerPosition) {
        const target = context.map.tileToWorldCenter(
          interaction.approachTile.tileX,
          interaction.approachTile.tileY,
        );
        const dx = target.x - playerPosition.x;
        const dy = target.y - playerPosition.y;
        const distance = Math.hypot(dx, dy);

        if (distance <= APPROACH_ARRIVAL_DISTANCE) {
          velocity.vx = 0;
          velocity.vy = 0;
          interaction.approachTile = null;
          return;
        }

        const direction = normalizeInputVector({ x: dx, y: dy });
        velocity.vx = direction.x * PLAYER_SPEED;
        velocity.vy = direction.y * PLAYER_SPEED;
        return;
      }
    }

    const direction = normalizeInputVector(context.inputState.movement);
    velocity.vx = direction.x * PLAYER_SPEED;
    velocity.vy = direction.y * PLAYER_SPEED;
  }
}

export class MovementSystem implements GameSystem {
  readonly name = 'movement';

  update(context: GameContext, deltaSeconds: number): void {
    for (const entity of context.entityManager.query('position', 'velocity', 'collidable')) {
      const position = entity.components.position!;
      const velocity = entity.components.velocity!;
      const collidable = entity.components.collidable!;

      const previousX = position.x;
      const previousY = position.y;
      const nextX = position.x + velocity.vx * deltaSeconds;
      const nextY = position.y + velocity.vy * deltaSeconds;

      if (context.map.isWorldPositionWalkable(nextX, position.y, collidable.radius)) {
        position.x = nextX;
      }

      if (context.map.isWorldPositionWalkable(position.x, nextY, collidable.radius)) {
        position.y = nextY;
      }

      if (
        entity.id === context.gameState.playerEntityId &&
        (position.x !== previousX || position.y !== previousY)
      ) {
        context.events.emit(GameEvents.PlayerMoved, {
          entityId: entity.id,
          x: position.x,
          y: position.y,
        });
      }
    }
  }
}
