import type Phaser from 'phaser';
import type { GameContext } from '../core/GameContext';
import { InteractionSystem } from './InteractionSystem';
import { CameraSystem } from './CameraSystem';
import { InputSystem, MovementSystem } from './InputSystem';
import { RenderSystem } from './RenderSystem';
import { SystemPipeline } from './SystemPipeline';
import type { InteractionAction } from '../interaction/types';

export class GameWorld {
  readonly context: GameContext;
  private readonly pipeline: SystemPipeline;
  private readonly renderSystem: RenderSystem;
  private readonly interactionSystem: InteractionSystem;

  constructor(context: GameContext, scene: Phaser.Scene) {
    this.context = context;
    this.renderSystem = new RenderSystem(scene);
    this.interactionSystem = new InteractionSystem();

    this.pipeline = new SystemPipeline()
      .add(this.interactionSystem)
      .add(new InputSystem())
      .add(new MovementSystem())
      .add(this.renderSystem)
      .add(new CameraSystem(scene, context.deviceProfile.cameraZoom));
  }

  update(deltaMs: number): void {
    const deltaSeconds = deltaMs / 1000;

    this.context.incrementTick();
    this.pipeline.update(this.context, deltaSeconds);
  }

  requestAction(action: InteractionAction): void {
    this.interactionSystem.requestAction(this.context, action);
  }

  destroy(): void {
    this.renderSystem.destroy();
    this.context.destroy();
  }
}
