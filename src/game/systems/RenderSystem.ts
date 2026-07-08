import type Phaser from 'phaser';
import type { Entity } from '../components/types';
import type { GameContext } from '../core/GameContext';
import type { GameSystem } from './SystemPipeline';

interface SpriteState {
  sprite: Phaser.GameObjects.Image;
  lastX: number;
  lastY: number;
}

export class RenderSystem implements GameSystem {
  readonly name = 'render';

  private readonly scene: Phaser.Scene;
  private readonly sprites = new Map<string, SpriteState>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(context: GameContext, _deltaSeconds: number): void {
    for (const entity of context.entityManager.query('position', 'renderable')) {
      this.syncEntity(entity);
    }
  }

  destroy(): void {
    for (const state of this.sprites.values()) {
      state.sprite.destroy();
    }
    this.sprites.clear();
  }

  private syncEntity(entity: Entity): void {
    const position = entity.components.position!;
    const renderable = entity.components.renderable!;
    let state = this.sprites.get(entity.id);

    if (!state) {
      const sprite = this.scene.add
        .image(position.x, position.y, renderable.textureKey)
        .setDepth(renderable.depth);
      state = { sprite, lastX: position.x, lastY: position.y };
      this.sprites.set(entity.id, state);
      return;
    }

    if (state.lastX === position.x && state.lastY === position.y) {
      return;
    }

    state.sprite.setPosition(position.x, position.y);
    state.lastX = position.x;
    state.lastY = position.y;
  }
}
