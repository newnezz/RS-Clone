import type Phaser from 'phaser';
import type { GameContext } from '../core/GameContext';
import { TILE_SIZE } from '../constants';
import type { GameSystem } from './SystemPipeline';

export class CameraSystem implements GameSystem {
  readonly name = 'camera';

  private readonly camera: Phaser.Cameras.Scene2D.Camera;
  private boundsSet = false;

  constructor(scene: Phaser.Scene, zoom: number) {
    this.camera = scene.cameras.main;
    this.camera.setZoom(zoom);
    this.camera.setRoundPixels(true);
  }

  update(context: GameContext, _deltaSeconds: number): void {
    const player = context.entityManager.get(context.gameState.playerEntityId);
    const position = player?.components.position;
    if (!position) {
      return;
    }

    if (!this.boundsSet) {
      this.camera.setBounds(
        0,
        0,
        context.map.width * TILE_SIZE,
        context.map.height * TILE_SIZE,
      );
      this.boundsSet = true;
    }

    this.camera.centerOn(position.x, position.y);
  }
}
