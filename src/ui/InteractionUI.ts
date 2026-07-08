import Phaser from 'phaser';
import type { GameContext } from '../game/core/GameContext';
import { ACTION_LABELS, targetKey, TargetKind, type InteractionAction, type InteractableTarget } from '../game/interaction/types';
import type { DeviceProfile } from '../game/platform/DeviceProfile';
import { TILE_SIZE } from '../game/constants';

function getHighlightPosition(context: GameContext, target: InteractableTarget): { x: number; y: number } {
  if (target.kind === TargetKind.Npc && target.npcId) {
    const instance = context.npcs.get(target.npcId);
    const entity = instance ? context.entityManager.get(instance.entityId) : null;
    const position = entity?.components.position;
    if (position) {
      return { x: position.x - TILE_SIZE / 2, y: position.y - TILE_SIZE / 2 };
    }
  }

  return { x: target.tileX * TILE_SIZE, y: target.tileY * TILE_SIZE };
}

export class InteractionHighlight {
  private readonly hoverRect: Phaser.GameObjects.Rectangle;
  private readonly selectRect: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.hoverRect = scene.add
      .rectangle(0, 0, TILE_SIZE, TILE_SIZE)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xffffff, 0.7)
      .setFillStyle(0xffffff, 0.12)
      .setDepth(5)
      .setVisible(false);

    this.selectRect = scene.add
      .rectangle(0, 0, TILE_SIZE, TILE_SIZE)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xffd700, 0.95)
      .setFillStyle(0xffd700, 0.18)
      .setDepth(6)
      .setVisible(false);
  }

  update(context: GameContext): void {
    const { hoveredTarget, selectedTarget } = context.interactionState;

    if (hoveredTarget && hoveredTarget !== selectedTarget) {
      const pos = getHighlightPosition(context, hoveredTarget);
      this.hoverRect.setVisible(true);
      this.hoverRect.setPosition(pos.x, pos.y);
    } else {
      this.hoverRect.setVisible(false);
    }

    if (selectedTarget) {
      const pos = getHighlightPosition(context, selectedTarget);
      this.selectRect.setVisible(true);
      this.selectRect.setPosition(pos.x, pos.y);
    } else {
      this.selectRect.setVisible(false);
    }
  }

  destroy(): void {
    this.hoverRect.destroy();
    this.selectRect.destroy();
  }
}

interface ActionButton {
  action: InteractionAction;
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

export class ActionPanel {
  private readonly scene: Phaser.Scene;
  private readonly deviceProfile: DeviceProfile;
  private readonly onAction: (action: InteractionAction) => void;
  private readonly title: Phaser.GameObjects.Text;
  private readonly buttons: ActionButton[] = [];
  private panelWidth = 0;
  private panelHeight = 0;
  private panelX = 0;
  private panelY = 0;
  private visible = false;
  private lastTargetKey: string | null = null;
  private lastActionsKey = '';

  constructor(
    scene: Phaser.Scene,
    deviceProfile: DeviceProfile,
    onAction: (action: InteractionAction) => void,
  ) {
    this.scene = scene;
    this.deviceProfile = deviceProfile;
    this.onAction = onAction;

    this.title = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: deviceProfile.isTouchPrimary ? '16px' : '14px',
        color: '#ffd700',
        backgroundColor: '#000000cc',
        padding: { x: 12, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(3000)
      .setVisible(false);

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
  }

  update(context: GameContext): void {
    const target = context.interactionState.selectedTarget;

    if (!target) {
      this.lastTargetKey = null;
      this.lastActionsKey = '';
      this.setVisible(false);
      return;
    }

    const key = targetKey(target);
    const actionsKey = target.actions.join(',');
    if (key !== this.lastTargetKey || actionsKey !== this.lastActionsKey) {
      this.lastTargetKey = key;
      this.lastActionsKey = actionsKey;
      this.rebuildButtons(target.actions);
    }

    this.setVisible(true);
    this.title.setText(target.label);
    this.layout();
  }

  containsScreenPoint(x: number, y: number): boolean {
    if (!this.visible) {
      return false;
    }

    return (
      x >= this.panelX &&
      x <= this.panelX + this.panelWidth &&
      y >= this.panelY &&
      y <= this.panelY + this.panelHeight
    );
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.title.destroy();
    for (const button of this.buttons) {
      button.background.destroy();
      button.label.destroy();
    }
    this.buttons.length = 0;
  }

  private rebuildButtons(actions: InteractionAction[]): void {
    for (const button of this.buttons) {
      button.background.destroy();
      button.label.destroy();
    }
    this.buttons.length = 0;

    const buttonHeight = this.deviceProfile.isTouchPrimary ? 48 : 36;
    const fontSize = this.deviceProfile.isTouchPrimary ? '16px' : '14px';

    for (const action of actions) {
      const label = this.scene.add
        .text(0, 0, ACTION_LABELS[action], {
          fontFamily: 'monospace',
          fontSize,
          color: '#ffffff',
        })
        .setScrollFactor(0)
        .setDepth(3002);

      const background = this.scene.add
        .rectangle(0, 0, 10, buttonHeight, 0x2a4a2a, 0.95)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0x5a8a5a)
        .setScrollFactor(0)
        .setDepth(3001)
        .setInteractive({ useHandCursor: true });

      background.on('pointerdown', () => {
        this.onAction(action);
      });

      this.buttons.push({ action, background, label });
    }
  }

  private setVisible(visible: boolean): void {
    this.visible = visible;
    this.title.setVisible(visible);

    for (const button of this.buttons) {
      button.background.setVisible(visible);
      button.label.setVisible(visible);
    }
  }

  private layout = (): void => {
    if (!this.visible) {
      return;
    }

    const buttonHeight = this.deviceProfile.isTouchPrimary ? 48 : 36;
    const buttonGap = 8;
    const buttonWidth = this.deviceProfile.isTouchPrimary ? 148 : 120;
    const margin = 16 + this.deviceProfile.safeAreaInsets.right;
    const bottom = 16 + this.deviceProfile.safeAreaInsets.bottom;

    this.panelWidth = buttonWidth;
    this.panelHeight =
      40 + this.buttons.length * buttonHeight + Math.max(0, this.buttons.length - 1) * buttonGap;
    this.panelX = this.scene.scale.width - margin - buttonWidth;
    this.panelY = this.scene.scale.height - bottom - this.panelHeight;

    this.title.setPosition(this.panelX, this.panelY);

    let y = this.panelY + 36;
    for (const button of this.buttons) {
      button.background.setPosition(this.panelX, y);
      button.background.setSize(buttonWidth, buttonHeight);
      button.label.setPosition(this.panelX + 12, y + (buttonHeight - button.label.height) / 2);
      y += buttonHeight + buttonGap;
    }
  };
}
