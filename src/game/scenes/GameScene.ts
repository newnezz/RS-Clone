import Phaser from 'phaser';
import { AuthService } from '../../auth/AuthService';
import type { PlayerSession } from '../../auth/types';
import { GameContext } from '../core/GameContext';
import { EntityManager } from '../entities/EntityManager';
import { createPlayer } from '../entities/PlayerFactory';
import { InteractableRegistry } from '../interaction/InteractableRegistry';
import { InputManager } from '../input/InputManager';
import { createInputState } from '../input/types';
import { NpcRegistry } from '../npcs/NpcRegistry';
import type { DeviceProfile } from '../platform/DeviceProfile';
import { createGameState } from '../state/GameState';
import { GameWorld } from '../systems/GameWorld';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
import { WorldMap } from '../world/WorldMap';
import { WorldRenderer } from '../world/WorldRenderer';
import { DEFAULT_SPAWN, generateWorldData, getSpawnPosition } from '../world/mapData';
import { RealtimeService } from '../../network/RealtimeService';
import { RemotePlayerManager } from '../../network/RemotePlayerManager';
import { PRESENCE_SYNC_INTERVAL_MS } from '../../network/types';
import { WorldPointerInput } from '../../ui/WorldPointerInput';
import { ChatPanel } from '../../ui/ChatPanel';
import { Hud } from '../../ui/Hud';
import { initUiLayout } from '../../ui/UiLayout';
import { ResourceNodeRegistry } from '../gathering/ResourceNodes';

export class GameScene extends Phaser.Scene {
  private gameWorld!: GameWorld;
  private inputManager!: InputManager;
  private hud!: Hud;
  private worldPointerInput!: WorldPointerInput;
  private session!: PlayerSession;
  private spawn = DEFAULT_SPAWN;
  private realtime: RealtimeService | null = null;
  private remotePlayers: RemotePlayerManager | null = null;
  private chatPanel: ChatPanel | null = null;
  private localPlayerLabel: Phaser.GameObjects.Text | null = null;
  private lastPresenceSync = 0;
  private lastRemotePlayerCount = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    const deviceProfile = this.registry.get('deviceProfile') as DeviceProfile;
    this.session = this.registry.get('playerSession') as PlayerSession;

    const { terrain, objects } = generateWorldData();
    const map = new WorldMap(WORLD_WIDTH, WORLD_HEIGHT, terrain, objects);
    const interactables = new InteractableRegistry();
    const resourceNodes = new ResourceNodeRegistry();
    const npcs = new NpcRegistry();

    new WorldRenderer(this, map);

    const entityManager = new EntityManager();
    const spawn = this.session.mode === 'online'
      ? getSpawnPosition(this.session.userId)
      : DEFAULT_SPAWN;
    this.spawn = spawn;
    const player = createPlayer(entityManager, spawn.x, spawn.y);
    const gameState = createGameState(player.id);

    this.localPlayerLabel = this.add
      .text(spawn.x, spawn.y - 22, this.session.username, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(11);

    const context = new GameContext({
      entityManager,
      map,
      interactables,
      resourceNodes,
      npcs,
      gameState,
      deviceProfile,
      inputState: createInputState(),
      gatherableVisuals: null,
    });

    this.gameWorld = new GameWorld(context, this);

    initUiLayout();

    this.worldPointerInput = new WorldPointerInput(this);
    this.inputManager = new InputManager([this.worldPointerInput]);

    this.hud = new Hud(this, deviceProfile, this.session, () => {
      void this.handleSignOut();
    });

    this.chatPanel = new ChatPanel(this.session, async (text) => {
      if (this.session.mode === 'offline') {
        this.chatPanel?.addMessage({
          id: crypto.randomUUID(),
          userId: this.session.userId,
          username: this.session.username,
          text: text.trim(),
          timestamp: Date.now(),
        });
        return { error: null };
      }

      if (!this.realtime) {
        return { error: 'Chat unavailable.' };
      }
      const result = await this.realtime.sendChat(text);
      if (result.message) {
        this.chatPanel?.addMessage(result.message);
      }
      if (result.error) {
        this.chatPanel?.addSystemMessage(result.error);
      }
      return { error: result.error };
    });

    void this.initMultiplayer();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanup();
    });
  }

  update(time: number, delta: number): void {
    this.gameWorld.context.inputState = this.inputManager.poll();
    this.gameWorld.update(delta);
    this.hud.update(this.gameWorld.context);

    const position = this.gameWorld.context.getPlayerPosition();
    if (position && this.localPlayerLabel) {
      this.localPlayerLabel.setPosition(position.x, position.y - 22);
    }

    if (this.realtime?.isConnected && this.remotePlayers) {
      if (time - this.lastPresenceSync >= PRESENCE_SYNC_INTERVAL_MS) {
        if (position) {
          void this.realtime.updatePresence(position.x, position.y);
        }
        this.lastPresenceSync = time;
      }
      this.remotePlayers.update(delta / 1000);
    }
  }

  private async initMultiplayer(): Promise<void> {
    if (this.session.mode !== 'online') {
      return;
    }

    this.realtime = new RealtimeService(this.session);
    this.remotePlayers = new RemotePlayerManager(this, this.session.userId);

    this.realtime.onPresence((players) => {
      this.remotePlayers?.syncPresence(players);
      if (players.length !== this.lastRemotePlayerCount) {
        this.lastRemotePlayerCount = players.length;
        if (players.length > 0) {
          const names = players.map((player) => player.username).join(', ');
          this.chatPanel?.addSystemMessage(`${players.length} other player(s) nearby: ${names}`);
        }
      }
    });

    this.realtime.onChat((message) => {
      if (message.userId !== this.session.userId) {
        this.chatPanel?.addMessage(message);
      }
    });

    const result = await this.realtime.connect({
      x: this.spawn.x,
      y: this.spawn.y,
    });
    if (result.error) {
      this.chatPanel?.addSystemMessage(`Multiplayer: ${result.error}`);
      this.chatPanel?.addSystemMessage('Run supabase/migrations/002_realtime_policies.sql in Supabase SQL Editor.');
    } else {
      this.chatPanel?.addSystemMessage('Connected to world. Other players appear as blue characters.');
      const position = this.gameWorld.context.getPlayerPosition();
      if (position) {
        await this.realtime.updatePresence(position.x, position.y);
      }
    }
  }

  private async handleSignOut(): Promise<void> {
    await this.realtime?.disconnect();
    const authService = new AuthService();
    await authService.signOut();
    window.location.reload();
  }

  private cleanup(): void {
    void this.realtime?.disconnect();
    this.gameWorld.destroy();
    this.worldPointerInput.destroy();
    this.hud.destroy();
    this.localPlayerLabel?.destroy();
    this.remotePlayers?.destroy();
    this.chatPanel?.destroy();
  }
}
