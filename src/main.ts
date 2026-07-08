import type Phaser from 'phaser';
import { AuthService } from './auth/AuthService';
import { authUserToSession, type PlayerSession } from './auth/types';
import { createGame } from './game/Game';
import { createDeviceProfile } from './game/platform/DeviceProfile';
import { AuthScreen } from './ui/auth/AuthScreen';

let activeGame: Phaser.Game | null = null;

async function bootstrap(): Promise<void> {
  const deviceProfile = createDeviceProfile();
  const authService = new AuthService();
  await authService.initSession();

  const authScreen = new AuthScreen(authService, {
    onStart: (session) => {
      authScreen.hide();
      startGame(session, deviceProfile);
    },
  });

  if (authService.currentUser) {
    startGame(authUserToSession(authService.currentUser), deviceProfile);
  } else {
    authScreen.show();
  }
}

function startGame(session: PlayerSession, deviceProfile: ReturnType<typeof createDeviceProfile>): void {
  if (activeGame) {
    activeGame.destroy(true);
  }
  activeGame = createGame('game-container', deviceProfile, session);
}

void bootstrap();
