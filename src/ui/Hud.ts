import Phaser from 'phaser';
import type { GameContext } from '../game/core/GameContext';
import type { PlayerSession } from '../auth/types';
import type { DeviceProfile } from '../game/platform/DeviceProfile';
import {
  getHudMargin,
  getSafeAreaInsets,
  getTopChromeHeight,
  getTotalBottomInset,
  onUiLayoutChange,
  setHudBottomY,
} from './UiLayout';

export class Hud {
  private readonly deviceProfile: DeviceProfile;
  private readonly session: PlayerSession;
  private readonly onSignOut: () => void;
  private readonly accountText: Phaser.GameObjects.Text;
  private readonly helpText: Phaser.GameObjects.Text;
  private readonly removeLayoutListener: () => void;

  constructor(
    scene: Phaser.Scene,
    deviceProfile: DeviceProfile,
    session: PlayerSession,
    onSignOut: () => void,
  ) {
    this.deviceProfile = deviceProfile;
    this.session = session;
    this.onSignOut = onSignOut;

    const helpFontSize = deviceProfile.isTouchPrimary ? '11px' : '12px';

    this.accountText = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: helpFontSize,
        color: '#9ecfff',
        backgroundColor: '#000000aa',
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(2000)
      .setInteractive({ useHandCursor: session.mode === 'online' })
      .on('pointerdown', () => {
        if (session.mode === 'online') {
          this.onSignOut();
        }
      });

    this.helpText = scene.add
      .text(0, 0, this.getHelpText(), {
        fontFamily: 'monospace',
        fontSize: helpFontSize,
        color: '#cccccc',
        backgroundColor: '#000000aa',
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(2000);

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.removeLayoutListener = onUiLayoutChange(this.layout);
    this.layout();
  }

  update(_context: GameContext): void {
    const modeLabel = this.session.mode === 'online' ? 'Online' : 'Offline';

    this.accountText.setText(
      `${this.session.username} (${modeLabel})${this.session.mode === 'online' ? ' · Sign out' : ''}`,
    );

    this.layout();
  }

  destroy(): void {
    this.removeLayoutListener();
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.accountText.destroy();
    this.helpText.destroy();
  }

  private getHelpText(): string {
    return 'Click or tap the map to move · Chat below';
  }

  private layout = (): void => {
    const margin = getHudMargin();
    const safe = getSafeAreaInsets();
    const top = margin + safe.top;
    const left = margin + safe.left;
    const right = margin + safe.right;
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    const bottomInset = getTotalBottomInset() + margin;
    const gap = this.deviceProfile.isTouchPrimary ? 2 : 6;
    const statusMaxWidth = screenWidth - left - right - (this.deviceProfile.isTouchPrimary ? 56 : 0);

    let y = top;

    this.accountText.setWordWrapWidth(statusMaxWidth);
    this.accountText.setPosition(left, y);
    y += this.accountText.height + gap;

    setHudBottomY(Math.max(y, top + getTopChromeHeight()));

    this.helpText.setPosition(left, screenHeight - bottomInset - this.helpText.height);
  };

  private get scene(): Phaser.Scene {
    return this.accountText.scene;
  }
}

// --- Disabled: inventory panel ---
// export class InventoryPanel { ... }
