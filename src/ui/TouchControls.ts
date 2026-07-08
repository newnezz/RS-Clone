import Phaser from 'phaser';
import { createInputState, type InputState } from '../game/input/types';
import type { InputProvider } from '../game/input/InputProvider';
import type { DeviceProfile } from '../game/platform/DeviceProfile';

const DEAD_ZONE = 0.15;

export class TouchControls implements InputProvider {
  readonly id = 'touch';
  readonly priority = 100;

  private readonly scene: Phaser.Scene;
  private readonly deviceProfile: DeviceProfile;
  private readonly base: Phaser.GameObjects.Arc;
  private readonly knob: Phaser.GameObjects.Arc;
  private readonly vector = { x: 0, y: 0 };
  private pointerId: number | null = null;
  private baseSize = 120;
  private knobSize = 48;
  private maxRadius = 36;

  constructor(scene: Phaser.Scene, deviceProfile: DeviceProfile) {
    this.scene = scene;
    this.deviceProfile = deviceProfile;

    this.base = scene.add
      .circle(0, 0, 60, 0x000000, 0.35)
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);

    this.knob = scene.add
      .circle(0, 0, 24, 0xffffff, 0.85)
      .setScrollFactor(0)
      .setDepth(1001)
      .setVisible(false);

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.layout();

    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);
    scene.input.on('pointerupoutside', this.onPointerUp, this);
  }

  poll(): InputState {
    if (!this.deviceProfile.isTouchPrimary) {
      return createInputState();
    }

    return createInputState({ movement: { ...this.vector } });
  }

  isActive(): boolean {
    if (!this.deviceProfile.isTouchPrimary) {
      return false;
    }

    return this.pointerId !== null || this.vector.x !== 0 || this.vector.y !== 0;
  }

  isPointerForMovement(pointerId: number): boolean {
    return this.pointerId === pointerId;
  }

  isInJoystickZone(screenX: number, screenY: number): boolean {
    const halfScreen = this.scene.scale.width / 2;
    return screenX <= halfScreen && screenY >= this.scene.scale.height * 0.3;
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.scene.input.off('pointerupoutside', this.onPointerUp, this);
    this.base.destroy();
    this.knob.destroy();
  }

  private layout(): void {
    const minDimension = Math.min(this.scene.scale.width, this.scene.scale.height);
    this.baseSize = Math.max(104, Math.min(148, minDimension * 0.24));
    this.knobSize = this.baseSize * 0.4;
    this.maxRadius = this.baseSize / 2 - this.knobSize / 2;

    this.base.setRadius(this.baseSize / 2);
    this.knob.setRadius(this.knobSize / 2);

    const margin = 20 + this.deviceProfile.safeAreaInsets.bottom;
    const sideInset = 20 + this.deviceProfile.safeAreaInsets.left;
    const x = sideInset + this.baseSize / 2;
    const y = this.scene.scale.height - margin - this.baseSize / 2;

    this.base.setPosition(x, y);

    if (this.pointerId === null) {
      this.knob.setPosition(x, y);
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.deviceProfile.isTouchPrimary || this.pointerId !== null) {
      return;
    }

    if (!this.isInJoystickZone(pointer.x, pointer.y)) {
      return;
    }

    this.pointerId = pointer.id;
    this.base.setVisible(true);
    this.knob.setVisible(true);
    this.updateKnob(pointer.x, pointer.y);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) {
      return;
    }

    this.updateKnob(pointer.x, pointer.y);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) {
      return;
    }

    this.resetJoystick();
  }

  private updateKnob(pointerX: number, pointerY: number): void {
    const centerX = this.base.x;
    const centerY = this.base.y;
    const dx = pointerX - centerX;
    const dy = pointerY - centerY;
    const distance = Math.min(Math.hypot(dx, dy), this.maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = centerX + Math.cos(angle) * distance;
    const knobY = centerY + Math.sin(angle) * distance;
    this.knob.setPosition(knobX, knobY);

    const normalizedX = distance === 0 ? 0 : Math.cos(angle) * (distance / this.maxRadius);
    const normalizedY = distance === 0 ? 0 : Math.sin(angle) * (distance / this.maxRadius);

    this.vector.x = Math.abs(normalizedX) < DEAD_ZONE ? 0 : normalizedX;
    this.vector.y = Math.abs(normalizedY) < DEAD_ZONE ? 0 : normalizedY;
  }

  private resetJoystick(): void {
    this.pointerId = null;
    this.vector.x = 0;
    this.vector.y = 0;
    this.knob.setPosition(this.base.x, this.base.y);
    this.base.setVisible(false);
    this.knob.setVisible(false);
  }
}
