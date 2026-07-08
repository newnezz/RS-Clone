import Phaser from 'phaser';
import type { PlayerPresence } from '../network/types';

interface RemotePlayerVisual {
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

export class RemotePlayerManager {
  private readonly scene: Phaser.Scene;
  private readonly localUserId: string;
  private readonly players = new Map<string, RemotePlayerVisual>();

  constructor(scene: Phaser.Scene, localUserId: string) {
    this.scene = scene;
    this.localUserId = localUserId;
  }

  syncPresence(remotePlayers: PlayerPresence[]): void {
    const activeIds = new Set(remotePlayers.map((player) => player.userId));

    for (const id of this.players.keys()) {
      if (!activeIds.has(id)) {
        this.removePlayer(id);
      }
    }

    for (const player of remotePlayers) {
      if (player.userId === this.localUserId) {
        continue;
      }

      let visual = this.players.get(player.userId);
      if (!visual) {
        visual = this.createVisual(player);
        this.players.set(player.userId, visual);
      }

      visual.targetX = player.x;
      visual.targetY = player.y;
      visual.label.setText(player.username);
    }
  }

  update(deltaSeconds: number): void {
    const lerp = Math.min(1, deltaSeconds * 12);

    for (const visual of this.players.values()) {
      visual.x = Phaser.Math.Linear(visual.x, visual.targetX, lerp);
      visual.y = Phaser.Math.Linear(visual.y, visual.targetY, lerp);
      visual.sprite.setPosition(visual.x, visual.y);
      visual.label.setPosition(visual.x, visual.y - 22);
    }
  }

  destroy(): void {
    for (const id of [...this.players.keys()]) {
      this.removePlayer(id);
    }
  }

  private createVisual(player: PlayerPresence): RemotePlayerVisual {
    const sprite = this.scene.add
      .image(player.x, player.y, 'player_remote')
      .setDepth(9);

    const label = this.scene.add
      .text(player.x, player.y - 22, player.username, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(11);

    return {
      sprite,
      label,
      x: player.x,
      y: player.y,
      targetX: player.x,
      targetY: player.y,
    };
  }

  private removePlayer(userId: string): void {
    const visual = this.players.get(userId);
    if (!visual) {
      return;
    }

    visual.sprite.destroy();
    visual.label.destroy();
    this.players.delete(userId);
  }
}
