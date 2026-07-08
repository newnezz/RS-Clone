import Phaser from 'phaser';
import type { PlayerSession } from '../auth/types';
import type { DeviceProfile } from './platform/DeviceProfile';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

export function createGame(
  parentId: string,
  deviceProfile: DeviceProfile,
  session: PlayerSession,
): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: parentId,
    backgroundColor: '#1a1a2e',
    render: {
      antialias: false,
      roundPixels: true,
      powerPreference: deviceProfile.preferLowPowerGpu ? 'low-power' : 'default',
    },
    fps: {
      target: deviceProfile.targetFps,
      forceSetTimeOut: deviceProfile.isLowEnd,
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      activePointers: 3,
    },
    scene: [BootScene, GameScene],
  });

  game.registry.set('deviceProfile', deviceProfile);
  game.registry.set('playerSession', session);
  return game;
}
