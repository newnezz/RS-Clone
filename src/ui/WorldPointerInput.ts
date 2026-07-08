import Phaser from 'phaser';
import { createInputState, type InputState } from '../game/input/types';
import type { InputProvider } from '../game/input/InputProvider';
import type { DeviceProfile } from '../game/platform/DeviceProfile';
import type { TouchControls } from './TouchControls';
import type { ActionPanel } from './InteractionUI';

export class WorldPointerInput implements InputProvider {
  readonly id = 'pointer';
  readonly priority = 90;

  private readonly scene: Phaser.Scene;
  private readonly deviceProfile: DeviceProfile;
  private readonly touchControls: TouchControls;
  private readonly actionPanel: ActionPanel;
  private pointerWorld: { worldX: number; worldY: number } | null = null;
  private selectPressed = false;

  constructor(
    scene: Phaser.Scene,
    deviceProfile: DeviceProfile,
    touchControls: TouchControls,
    actionPanel: ActionPanel,
  ) {
    this.scene = scene;
    this.deviceProfile = deviceProfile;
    this.touchControls = touchControls;
    this.actionPanel = actionPanel;

    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerdown', this.onPointerDown, this);
  }

  poll(): InputState {
    const state = createInputState({
      pointer: this.pointerWorld,
      selectPressed: this.selectPressed,
    });
    this.selectPressed = false;
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

    if (this.actionPanel.containsScreenPoint(pointer.x, pointer.y)) {
      return;
    }

    if (
      this.deviceProfile.isTouchPrimary &&
      this.touchControls.isInJoystickZone(pointer.x, pointer.y)
    ) {
      return;
    }

    this.pointerWorld = this.toWorldPointer(pointer);
    this.selectPressed = true;
  }

  private toWorldPointer(pointer: Phaser.Input.Pointer): { worldX: number; worldY: number } {
    const camera = this.scene.cameras.main;
    const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
    return { worldX: worldPoint.x, worldY: worldPoint.y };
  }
}
