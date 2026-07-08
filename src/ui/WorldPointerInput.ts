import Phaser from 'phaser';
import { createInputState, type InputState } from '../game/input/types';
import type { InputProvider } from '../game/input/InputProvider';

export class WorldPointerInput implements InputProvider {
  readonly id = 'pointer';
  readonly priority = 100;

  private readonly scene: Phaser.Scene;
  private clickToMovePressed = false;
  private clickWorld: { worldX: number; worldY: number } | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.input.on('pointerdown', this.onPointerDown, this);
  }

  poll(): InputState {
    const state = createInputState({
      pointer: this.clickWorld,
      selectPressed: this.clickToMovePressed,
    });
    this.clickToMovePressed = false;
    return state;
  }

  isActive(): boolean {
    return this.clickWorld !== null;
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!pointer.leftButtonDown()) {
      return;
    }

    const world = this.toWorldPointer(pointer);
    this.clickWorld = world;
    this.clickToMovePressed = true;
  }

  private toWorldPointer(pointer: Phaser.Input.Pointer): { worldX: number; worldY: number } {
    const camera = this.scene.cameras.main;
    const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
    return { worldX: worldPoint.x, worldY: worldPoint.y };
  }
}
