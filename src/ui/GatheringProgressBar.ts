import Phaser from 'phaser';
import type { GameContext } from '../game/core/GameContext';
import { TILE_SIZE } from '../game/constants';
import { TargetKind } from '../game/interaction/types';
import type { InteractableTarget } from '../game/interaction/types';
import {
  clamp,
  getPlayableBounds,
  onUiLayoutChange,
  worldToScreen,
} from './UiLayout';

function getTargetWorldCenter(context: GameContext, target: InteractableTarget): { x: number; y: number } {
  if (target.kind === TargetKind.Npc && target.npcId) {
    const instance = context.npcs.get(target.npcId);
    const entity = instance ? context.entityManager.get(instance.entityId) : null;
    const position = entity?.components.position;
    if (position) {
      return { x: position.x, y: position.y };
    }
  }

  return {
    x: target.tileX * TILE_SIZE + TILE_SIZE / 2,
    y: target.tileY * TILE_SIZE + TILE_SIZE / 2,
  };
}

export class GatheringProgressBar {
  private readonly scene: Phaser.Scene;
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly removeLayoutListener: () => void;
  private readonly barWidth = 96;
  private readonly barHeight = 6;
  private lastContext: GameContext | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.background = scene.add
      .rectangle(0, 0, this.barWidth, this.barHeight, 0x111111, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0xffffff, 0.35)
      .setScrollFactor(0)
      .setDepth(3100)
      .setVisible(false);

    this.fill = scene.add
      .rectangle(0, 0, 0, this.barHeight, 0x5a8a5a, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(3101)
      .setVisible(false);

    this.label = scene.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#e8e8e8',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 },
      })
      .setScrollFactor(0)
      .setDepth(3102)
      .setVisible(false);

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.removeLayoutListener = onUiLayoutChange(this.layout);
  }

  update(context: GameContext): void {
    this.lastContext = context;
    const gathering = context.interactionState.gathering;
    if (!gathering) {
      this.setVisible(false);
      return;
    }

    const progress = clamp(gathering.elapsedMs / gathering.durationMs, 0, 1);
    const actionLabel = gathering.action === 'chop' ? 'Chopping' : 'Mining';
    this.label.setText(actionLabel);
    this.fill.setSize(this.barWidth * progress, this.barHeight);
    this.setVisible(true);
    this.layout();
  }

  destroy(): void {
    this.removeLayoutListener();
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.background.destroy();
    this.fill.destroy();
    this.label.destroy();
  }

  private setVisible(visible: boolean): void {
    this.background.setVisible(visible);
    this.fill.setVisible(visible);
    this.label.setVisible(visible);
  }

  private layout = (): void => {
    const context = this.lastContext;
    const gathering = context?.interactionState.gathering;
    if (!context || !gathering) {
      return;
    }

    const target = gathering.target;
    const worldCenter = getTargetWorldCenter(context, target);
    const screen = worldToScreen(this.scene, worldCenter.x, worldCenter.y);
    const bounds = getPlayableBounds(this.scene);
    const camera = this.scene.cameras.main;
    const objectRadius = (TILE_SIZE * camera.zoom) / 2;
    const totalHeight = this.barHeight + this.label.height + 6;

    let x = screen.x - this.barWidth / 2;
    let y = screen.y - objectRadius - totalHeight - 8;

    if (y < bounds.top) {
      y = screen.y + objectRadius + 8;
    }

    x = clamp(x, bounds.left, bounds.right - this.barWidth);
    y = clamp(y, bounds.top, bounds.bottom - totalHeight);

    this.background.setPosition(x, y + this.label.height + 4);
    this.fill.setPosition(x, y + this.label.height + 4);
    this.label.setPosition(x, y);
  };
}
