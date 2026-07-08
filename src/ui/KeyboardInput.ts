import Phaser from 'phaser';
import { createInputState, type InputState } from '../game/input/types';
import type { InputProvider } from '../game/input/InputProvider';

export class KeyboardInput implements InputProvider {
  readonly id = 'keyboard';
  readonly priority = 50;

  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private readonly interactKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    if (!scene.input.keyboard) {
      throw new Error('Keyboard input is unavailable');
    }

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as KeyboardInput['wasd'];
    this.interactKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  poll(): InputState {
    const movement = this.readMovementVector();
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.interactKey);

    return createInputState({ movement, interactPressed });
  }

  isActive(): boolean {
    const movement = this.readMovementVector();
    return movement.x !== 0 || movement.y !== 0;
  }

  private readMovementVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      x -= 1;
    }
    if (this.cursors.right.isDown || this.wasd.right.isDown) {
      x += 1;
    }
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      y -= 1;
    }
    if (this.cursors.down.isDown || this.wasd.down.isDown) {
      y += 1;
    }

    return { x, y };
  }
}
