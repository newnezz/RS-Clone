import Phaser from 'phaser';
import type { GameContext } from '../game/core/GameContext';
import type { PlayerSession } from '../auth/types';
import type { DeviceProfile } from '../game/platform/DeviceProfile';
import {
  formatInventorySummary,
  INVENTORY_SIZE,
} from '../game/inventory/types';
import { getActiveQuestLines } from '../game/quests/questLogic';
import { SKILL_LABELS, SkillId } from '../game/skills/types';
import { TILE_SIZE } from '../game/constants';

export class Hud {
  private readonly deviceProfile: DeviceProfile;
  private readonly session: PlayerSession;
  private readonly onSignOut: () => void;
  private readonly positionText: Phaser.GameObjects.Text;
  private readonly accountText: Phaser.GameObjects.Text;
  private readonly skillsText: Phaser.GameObjects.Text;
  private readonly messageText: Phaser.GameObjects.Text;
  private readonly helpText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    deviceProfile: DeviceProfile,
    session: PlayerSession,
    onSignOut: () => void,
  ) {
    this.deviceProfile = deviceProfile;
    this.session = session;
    this.onSignOut = onSignOut;

    const fontSize = deviceProfile.isTouchPrimary ? '16px' : '14px';
    const helpFontSize = deviceProfile.isTouchPrimary ? '14px' : '12px';

    this.positionText = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize,
        color: '#f5f5f5',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(2000);

    this.accountText = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: helpFontSize,
        color: '#9ecfff',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 8 },
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
        padding: { x: 10, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(2000);

    this.messageText = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize,
        color: '#ffe08a',
        backgroundColor: '#000000cc',
        padding: { x: 10, y: 8 },
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
        padding: { x: 10, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(2000);

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.layout();
  }

  update(context: GameContext): void {
    const position = context.getPlayerPosition();
    if (position) {
      const tileX = Math.floor(position.x / TILE_SIZE);
      const tileY = Math.floor(position.y / TILE_SIZE);

      this.positionText.setText(
        `Tile: (${tileX}, ${tileY})\nWorld: (${Math.round(position.x)}, ${Math.round(position.y)})`,
      );
    }

    const skills = context.gameState.progress.skills;
    const modeLabel = this.session.mode === 'online' ? 'Online' : 'Offline';
    this.accountText.setText(
      `${this.session.username} (${modeLabel})${this.session.mode === 'online' ? ' · Sign out' : ''}`,
    );
    this.skillsText.setText(
      `${SKILL_LABELS[SkillId.Woodcutting]}: ${skills[SkillId.Woodcutting].level}  ·  ${SKILL_LABELS[SkillId.Mining]}: ${skills[SkillId.Mining].level}`,
    );

    const message = context.interactionState.message;
    if (message) {
      this.messageText.setText(message);
      this.messageText.setVisible(true);
    } else {
      this.messageText.setVisible(false);
    }
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.positionText.destroy();
    this.accountText.destroy();
    this.skillsText.destroy();
    this.messageText.destroy();
    this.helpText.destroy();
  }

  private getHelpText(): string {
    if (this.deviceProfile.inputMode === 'touch') {
      return 'Move · Tap NPCs & resources · Chat below';
    }

    if (this.deviceProfile.inputMode === 'hybrid') {
      return 'Move · Quests · I inventory · Chat below · Click account to sign out';
    }

    return 'WASD move · Quests · I inventory · Chat below · Click account to sign out';
  }

  private layout = (): void => {
    const top = 12 + this.deviceProfile.safeAreaInsets.top;
    const left = 12 + this.deviceProfile.safeAreaInsets.left;
    const bottom = 12 + this.deviceProfile.safeAreaInsets.bottom;

    this.positionText.setPosition(left, top);
    this.accountText.setPosition(left, top + 52);
    this.skillsText.setPosition(left, top + 88);
    this.messageText.setPosition(left, top + 124);
    this.helpText.setPosition(left, this.scene.scale.height - bottom - 44);
  };

  private get scene(): Phaser.Scene {
    return this.positionText.scene;
  }
}

export class InventoryPanel {
  private readonly scene: Phaser.Scene;
  private readonly deviceProfile: DeviceProfile;
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly content: Phaser.GameObjects.Text;
  private readonly toggleKey: Phaser.Input.Keyboard.Key | null;
  private open = true;

  constructor(scene: Phaser.Scene, deviceProfile: DeviceProfile) {
    this.scene = scene;
    this.deviceProfile = deviceProfile;

    this.background = scene.add
      .rectangle(0, 0, 200, 80, 0x000000, 0.75)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x444444)
      .setScrollFactor(0)
      .setDepth(2500);

    this.title = scene.add
      .text(0, 0, `Inventory (0/${INVENTORY_SIZE})`, {
        fontFamily: 'monospace',
        fontSize: deviceProfile.isTouchPrimary ? '14px' : '12px',
        color: '#cccccc',
      })
      .setScrollFactor(0)
      .setDepth(2501);

    this.content = scene.add
      .text(0, 0, 'Empty', {
        fontFamily: 'monospace',
        fontSize: deviceProfile.isTouchPrimary ? '15px' : '13px',
        color: '#ffffff',
        wordWrap: { width: 220 },
      })
      .setScrollFactor(0)
      .setDepth(2501);

    if (scene.input.keyboard) {
      this.toggleKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    } else {
      this.toggleKey = null;
    }

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
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
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.background.destroy();
    this.title.destroy();
    this.content.destroy();
  }

  private layout = (): void => {
    if (!this.open) {
      return;
    }

    const top = 12 + this.deviceProfile.safeAreaInsets.top;
    const right = 12 + this.deviceProfile.safeAreaInsets.right;
    const panelWidth = this.deviceProfile.isTouchPrimary ? 240 : 220;
    const panelHeight = 72;

    this.panelDimensions(panelWidth, panelHeight);

    const x = this.scene.scale.width - right - panelWidth;
    this.background.setPosition(x, top);
    this.title.setPosition(x + 10, top + 8);
    this.content.setPosition(x + 10, top + 28);
  };

  private panelDimensions(width: number, height: number): void {
    this.background.setSize(width, height);
    this.content.setWordWrapWidth(width - 20);
  }
}

export class QuestLog {
  private readonly scene: Phaser.Scene;
  private readonly deviceProfile: DeviceProfile;
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly content: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, deviceProfile: DeviceProfile) {
    this.scene = scene;
    this.deviceProfile = deviceProfile;

    this.background = scene.add
      .rectangle(0, 0, 260, 80, 0x000000, 0.75)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x3a5a3a)
      .setScrollFactor(0)
      .setDepth(2500);

    this.title = scene.add
      .text(0, 0, 'Quests', {
        fontFamily: 'monospace',
        fontSize: deviceProfile.isTouchPrimary ? '14px' : '12px',
        color: '#a8d8a8',
      })
      .setScrollFactor(0)
      .setDepth(2501);

    this.content = scene.add
      .text(0, 0, 'No active quests', {
        fontFamily: 'monospace',
        fontSize: deviceProfile.isTouchPrimary ? '14px' : '12px',
        color: '#e8e8e8',
        wordWrap: { width: 240 },
      })
      .setScrollFactor(0)
      .setDepth(2501);

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.layout();
  }

  update(context: GameContext): void {
    const { quests, inventory } = context.gameState.progress;
    const lines = getActiveQuestLines(quests, inventory);

    if (lines.length === 0) {
      this.content.setText('Talk to villagers to find quests.');
    } else {
      this.content.setText(lines.join('\n'));
    }

    this.layout();
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.background.destroy();
    this.title.destroy();
    this.content.destroy();
  }

  private layout = (): void => {
    const left = 12 + this.deviceProfile.safeAreaInsets.left;
    const top = 184 + this.deviceProfile.safeAreaInsets.top;
    const panelWidth = this.deviceProfile.isTouchPrimary ? 280 : 260;
    const lineCount = Math.max(1, this.content.text.split('\n').length);
    const panelHeight = 28 + lineCount * 18;

    this.background.setSize(panelWidth, panelHeight);
    this.content.setWordWrapWidth(panelWidth - 20);
    this.background.setPosition(left, top);
    this.title.setPosition(left + 10, top + 8);
    this.content.setPosition(left + 10, top + 26);
  };
}
