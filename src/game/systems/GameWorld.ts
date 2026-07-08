import type Phaser from 'phaser';
import type { GameContext } from '../core/GameContext';
import { GatheringSystem, InteractionSystem } from './GatheringSystem';
import { CameraSystem } from './CameraSystem';
import { InputSystem, MovementSystem } from './InputSystem';
import { RenderSystem } from './RenderSystem';
import { SystemPipeline } from './SystemPipeline';

export class GameWorld {
  readonly context: GameContext;
  private readonly pipeline: SystemPipeline;
  private readonly renderSystem: RenderSystem;

  constructor(context: GameContext, scene: Phaser.Scene) {
    this.context = context;
    this.renderSystem = new RenderSystem(scene);

    this.pipeline = new SystemPipeline()
      .add(new InteractionSystem())
      .add(new InputSystem())
      .add(new MovementSystem())
      .add(new GatheringSystem())
      .add(this.renderSystem)
      .add(new CameraSystem(scene, context.deviceProfile.cameraZoom));
  }

  update(deltaMs: number): void {
    const deltaSeconds = deltaMs / 1000;

    this.context.incrementTick();
    this.pipeline.update(this.context, deltaSeconds);
  }

  destroy(): void {
    this.renderSystem.destroy();
    this.context.destroy();
  }
}
