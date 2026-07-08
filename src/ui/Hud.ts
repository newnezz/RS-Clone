import Phaser from 'phaser';
import type { GameContext } from '../game/core/GameContext';
import type { PlayerSession } from '../auth/types';
import type { DeviceProfile } from '../game/platform/DeviceProfile';
import {
  formatInventorySummary,
  INVENTORY_SIZE,
} from '../game/inventory/types';
import { SKILL_LABELS, SkillId } from '../game/skills/types';
import { TILE_SIZE } from '../game/constants';
import {
  getHudMargin,
  getMaxPanelWidth,
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
  private readonly positionText: Phaser.GameObjects.Text;
  private readonly accountText: Phaser.GameObjects.Text;
  private readonly skillsText: Phaser.GameObjects.Text;
  private readonly messageText: Phaser.GameObjects.Text;
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

    const compact = deviceProfile.isTouchPrimary;
    const fontSize = compact ? '11px' : '14px';
    const helpFontSize = compact ? '11px' : '12px';

    this.positionText = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize,
        color: '#f5f5f5',
        backgroundColor: '#000000aa',
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(2000);

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

    this.skillsText = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: helpFontSize,
        color: '#a8d8a8',
        backgroundColor: '#000000aa',
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(2000);

    this.messageText = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize,
        color: '#ffe08a',
        backgroundColor: '#000000cc',
        padding: { x: 8, y: 6 },
        wordWrap: { width: 280 },
      })
      .setScrollFactor(0)
      .setDepth(2000);

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

    if (compact) {
      this.positionText.setVisible(false);
      this.helpText.setVisible(false);
      this.skillsText.setVisible(false);
    }

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.removeLayoutListener = onUiLayoutChange(this.layout);
    this.layout();
  }

  update(context: GameContext): void {
    const position = context.getPlayerPosition();
    if (position && !this.deviceProfile.isTouchPrimary) {
      const tileX = Math.floor(position.x / TILE_SIZE);
      const tileY = Math.floor(position.y / TILE_SIZE);

      this.positionText.setText(
        `Tile: (${tileX}, ${tileY})\nWorld: (${Math.round(position.x)}, ${Math.round(position.y)})`,
      );
    }

    const skills = context.gameState.progress.skills;
    const modeLabel = this.session.mode === 'online' ? 'Online' : 'Offline';

    if (this.deviceProfile.isTouchPrimary) {
      const wc = skills[SkillId.Woodcutting].level;
      const mn = skills[SkillId.Mining].level;
      this.accountText.setText(`${this.session.username} · ${modeLabel} · WC${wc} · M${mn}`);
    } else {
      this.accountText.setText(
        `${this.session.username} (${modeLabel})${this.session.mode === 'online' ? ' · Sign out' : ''}`,
      );
      this.skillsText.setText(
        `${SKILL_LABELS[SkillId.Woodcutting]}: ${skills[SkillId.Woodcutting].level}  ·  ${SKILL_LABELS[SkillId.Mining]}: ${skills[SkillId.Mining].level}`,
      );
    }

    const message = context.interactionState.message;
    if (message) {
      this.messageText.setText(message);
      this.messageText.setVisible(true);
    } else {
      this.messageText.setVisible(false);
    }

    this.layout();
  }

  destroy(): void {
    this.removeLayoutListener();
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.positionText.destroy();
    this.accountText.destroy();
    this.skillsText.destroy();
    this.messageText.destroy();
    this.helpText.destroy();
  }

  private getHelpText(): string {
    if (this.deviceProfile.inputMode === 'touch') {
      return 'Move · Double-tap trees & rocks to gather';
    }

    if (this.deviceProfile.inputMode === 'hybrid') {
      return 'Move · Double-click trees & rocks · I inventory';
    }

    return 'WASD move · Double-click trees & rocks · I inventory';
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

    if (!this.deviceProfile.isTouchPrimary) {
      this.positionText.setPosition(left, y);
      y += this.positionText.height + gap;
    }

    this.accountText.setWordWrapWidth(statusMaxWidth);
    this.accountText.setPosition(left, y);
    y += this.accountText.height + gap;

    if (!this.deviceProfile.isTouchPrimary) {
      this.skillsText.setPosition(left, y);
      y += this.skillsText.height + gap;
    }

    setHudBottomY(Math.max(y, top + getTopChromeHeight()));

    if (this.messageText.visible) {
      const wrapWidth = Math.min(getMaxPanelWidth('left', screenWidth), screenWidth - left - right);
      this.messageText.setWordWrapWidth(wrapWidth);

      if (this.deviceProfile.isTouchPrimary) {
        this.messageText.setPosition(left, top + getTopChromeHeight() + 2);
      } else {
        this.messageText.setPosition(left, y);
        y += this.messageText.height + gap;
        setHudBottomY(y);
      }
    }

    if (!this.deviceProfile.isTouchPrimary) {
      this.helpText.setPosition(left, screenHeight - bottomInset - this.helpText.height);
    }
  };

  private get scene(): Phaser.Scene {
    return this.positionText.scene;
  }
}

export class InventoryPanel {
  private readonly scene: Phaser.Scene;
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly content: Phaser.GameObjects.Text;
  private readonly toggleButton: Phaser.GameObjects.Text | null;
  private readonly toggleKey: Phaser.Input.Keyboard.Key | null;
  private readonly removeLayoutListener: () => void;
  private open: boolean;

  constructor(scene: Phaser.Scene, deviceProfile: DeviceProfile) {
    this.scene = scene;
    this.open = !deviceProfile.isTouchPrimary;

    this.background = scene.add
      .rectangle(0, 0, 200, 80, 0x000000, 0.75)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x444444)
      .setScrollFactor(0)
      .setDepth(2500);

    this.title = scene.add
      .text(0, 0, `Inventory (0/${INVENTORY_SIZE})`, {
        fontFamily: 'monospace',
        fontSize: deviceProfile.isTouchPrimary ? '13px' : '12px',
        color: '#cccccc',
      })
      .setScrollFactor(0)
      .setDepth(2501);

    this.content = scene.add
      .text(0, 0, 'Empty', {
        fontFamily: 'monospace',
        fontSize: deviceProfile.isTouchPrimary ? '14px' : '13px',
        color: '#ffffff',
        wordWrap: { width: 220 },
      })
      .setScrollFactor(0)
      .setDepth(2501);

    if (deviceProfile.isTouchPrimary) {
      this.toggleButton = scene.add
        .text(0, 0, 'Bag', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#ffffff',
          backgroundColor: '#000000bb',
          padding: { x: 8, y: 6 },
        })
        .setScrollFactor(0)
        .setDepth(2502)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.open = !this.open;
          this.layout();
        });
    } else {
      this.toggleButton = null;
    }

    if (scene.input.keyboard) {
      this.toggleKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    } else {
      this.toggleKey = null;
    }

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.removeLayoutListener = onUiLayoutChange(this.layout);
    this.layout();
  }

  update(context: GameContext): void {
    if (this.toggleKey && Phaser.Input.Keyboard.JustDown(this.toggleKey)) {
      this.open = !this.open;
    }

    const inventory = context.gameState.progress.inventory;
    const usedSlots = inventory.filter((slot) => slot !== null).length;

    this.title.setText(`Inventory (${usedSlots}/${INVENTORY_SIZE})`);
    this.content.setText(formatInventorySummary(inventory));

    this.background.setVisible(this.open);
    this.title.setVisible(this.open);
    this.content.setVisible(this.open);
    this.layout();
  }

  destroy(): void {
    this.removeLayoutListener();
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.background.destroy();
    this.title.destroy();
    this.content.destroy();
    this.toggleButton?.destroy();
  }

  private layout = (): void => {
    const margin = getHudMargin();
    const safe = getSafeAreaInsets();
    const top = margin + safe.top;
    const right = margin + safe.right;
    const panelWidth = getMaxPanelWidth('right', this.scene.scale.width);
    const lineCount = Math.max(1, this.content.text.split('\n').length);
    const panelHeight = 28 + lineCount * 16 + 8;

    if (this.toggleButton) {
      const buttonX = this.scene.scale.width - right - this.toggleButton.width;
      this.toggleButton.setPosition(buttonX, top);
      this.toggleButton.setBackgroundColor(this.open ? '#2a4a2a' : '#000000bb');
    }

    if (!this.open) {
      this.background.setVisible(false);
      this.title.setVisible(false);
      this.content.setVisible(false);
      return;
    }

    const x = this.scene.scale.width - right - panelWidth;
    const panelTop = this.toggleButton ? top + this.toggleButton.height + 6 : top;

    this.background.setSize(panelWidth, panelHeight);
    this.content.setWordWrapWidth(panelWidth - 20);
    this.background.setPosition(x, panelTop);
    this.title.setPosition(x + 10, panelTop + 8);
    this.content.setPosition(x + 10, panelTop + 26);
  };
}
