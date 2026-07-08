import Phaser from 'phaser';
import { createInputState, type InputState } from '../game/input/types';
import type { InputProvider } from '../game/input/InputProvider';
import type { DeviceProfile } from '../game/platform/DeviceProfile';
import { DOUBLE_TAP_MAX_DISTANCE, DOUBLE_TAP_WINDOW_MS } from '../game/constants';
import type { TouchControls } from './TouchControls';

export class WorldPointerInput implements InputProvider {
  readonly id = 'pointer';
  readonly priority = 90;

  private readonly scene: Phaser.Scene;
  private readonly deviceProfile: DeviceProfile;
  private readonly touchControls: TouchControls;
  private pointerWorld: { worldX: number; worldY: number } | null = null;
  private doubleSelectPressed = false;
  private lastTapTime = 0;
  private lastTapWorld: { worldX: number; worldY: number } | null = null;

  constructor(scene: Phaser.Scene, deviceProfile: DeviceProfile, touchControls: TouchControls) {
    this.scene = scene;
    this.deviceProfile = deviceProfile;
    this.touchControls = touchControls;

    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerdown', this.onPointerDown, this);
  }

  poll(): InputState {
    const state = createInputState({
      pointer: this.pointerWorld,
      doubleSelectPressed: this.doubleSelectPressed,
    });
    this.doubleSelectPressed = false;
    return state;
  }

  isActive(): boolean {
    return this.pointerWorld !== null;
  }

  destroy(): void {
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerdown', this.onPointerDown, this);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    this.pointerWorld = this.toWorldPointer(pointer);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.touchControls.isPointerForMovement(pointer.id)) {
      return;
    }

    if (
      this.deviceProfile.isTouchPrimary &&
      this.touchControls.isInJoystickZone(pointer.x, pointer.y)
    ) {
      return;
    }

    const world = this.toWorldPointer(pointer);
    this.pointerWorld = world;

    const now = this.scene.time.now;
    if (
      this.lastTapWorld &&
      now - this.lastTapTime <= DOUBLE_TAP_WINDOW_MS &&
      Math.hypot(world.worldX - this.lastTapWorld.worldX, world.worldY - this.lastTapWorld.worldY) <=
        DOUBLE_TAP_MAX_DISTANCE
    ) {
      this.doubleSelectPressed = true;
      this.lastTapTime = 0;
      this.lastTapWorld = null;
      return;
    }

    this.lastTapTime = now;
    this.lastTapWorld = world;
  }

  private toWorldPointer(pointer: Phaser.Input.Pointer): { worldX: number; worldY: number } {
    const camera = this.scene.cameras.main;
    const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
    return { worldX: worldPoint.x, worldY: worldPoint.y };
  }
}
