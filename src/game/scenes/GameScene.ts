import Phaser from 'phaser';
import { AuthService } from '../../auth/AuthService';
import type { PlayerSession } from '../../auth/types';
import { GameContext } from '../core/GameContext';
import { EntityManager } from '../entities/EntityManager';
import { createNpc } from '../entities/NpcFactory';
import { createPlayer } from '../entities/PlayerFactory';
import { GATHERING_BY_OBJECT } from '../gathering/types';
import { buildResourceNodeRegistry } from '../gathering/ResourceNodes';
import { buildInteractableRegistry } from '../interaction/InteractableRegistry';
import { InputManager } from '../input/InputManager';
import { createInputState } from '../input/types';
import { NPC_DEFINITIONS } from '../npcs/npcData';
import { spawnNpcs } from '../npcs/NpcRegistry';
import type { DeviceProfile } from '../platform/DeviceProfile';
import { createGameState } from '../state/GameState';
import { GameWorld } from '../systems/GameWorld';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
import { GatherableVisuals } from '../world/GatherableVisuals';
import { WorldMap } from '../world/WorldMap';
import { WorldRenderer } from '../world/WorldRenderer';
import { DEFAULT_SPAWN, generateWorldData } from '../world/mapData';
import { ObjectType } from '../world/TileTypes';
import { RealtimeService } from '../../network/RealtimeService';
import { RemotePlayerManager } from '../../network/RemotePlayerManager';
import { PRESENCE_SYNC_INTERVAL_MS } from '../../network/types';
import { KeyboardInput } from '../../ui/KeyboardInput';
import { TouchControls } from '../../ui/TouchControls';
import { WorldPointerInput } from '../../ui/WorldPointerInput';
import { ActionPanel, InteractionHighlight } from '../../ui/InteractionUI';
import { ChatPanel } from '../../ui/ChatPanel';
import { Hud, InventoryPanel, QuestLog } from '../../ui/Hud';

export class GameScene extends Phaser.Scene {
  private gameWorld!: GameWorld;
  private inputManager!: InputManager;
  private hud!: Hud;
  private inventoryPanel!: InventoryPanel;
  private questLog!: QuestLog;
  private touchControls!: TouchControls;
  private worldPointerInput!: WorldPointerInput;
  private interactionHighlight!: InteractionHighlight;
  private actionPanel!: ActionPanel;
  private gatherableVisuals!: GatherableVisuals;
  private session!: PlayerSession;
  private realtime: RealtimeService | null = null;
  private remotePlayers: RemotePlayerManager | null = null;
  private chatPanel: ChatPanel | null = null;
  private lastPresenceSync = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    const deviceProfile = this.registry.get('deviceProfile') as DeviceProfile;
    this.session = this.registry.get('playerSession') as PlayerSession;

    const { terrain, objects } = generateWorldData();
    const map = new WorldMap(WORLD_WIDTH, WORLD_HEIGHT, terrain, objects);
    const interactables = buildInteractableRegistry(map);
    const resourceNodes = buildResourceNodeRegistry(map, {
      [ObjectType.Tree]: GATHERING_BY_OBJECT[ObjectType.Tree]!.hitsToDeplete,
      [ObjectType.Rock]: GATHERING_BY_OBJECT[ObjectType.Rock]!.hitsToDeplete,
    });

    new WorldRenderer(this, map);
    this.gatherableVisuals = new GatherableVisuals(this, map);

    const entityManager = new EntityManager();
    const player = createPlayer(entityManager, DEFAULT_SPAWN.x, DEFAULT_SPAWN.y);
    const npcs = spawnNpcs(entityManager, NPC_DEFINITIONS, createNpc);
    const gameState = createGameState(player.id);

    const context = new GameContext({
      entityManager,
      map,
      interactables,
      resourceNodes,
      npcs,
      gameState,
      deviceProfile,
      inputState: createInputState(),
      gatherableVisuals: this.gatherableVisuals,
    });

    this.gameWorld = new GameWorld(context, this);

    this.touchControls = new TouchControls(this, deviceProfile);
    this.actionPanel = new ActionPanel(this, deviceProfile, (action) => {
      this.gameWorld.requestAction(action);
    });
    this.worldPointerInput = new WorldPointerInput(
      this,
      deviceProfile,
      this.touchControls,
      this.actionPanel,
    );

    const keyboardInput = new KeyboardInput(this);
    this.inputManager = new InputManager([
      this.touchControls,
      this.worldPointerInput,
      keyboardInput,
    ]);

    this.interactionHighlight = new InteractionHighlight(this);
    this.hud = new Hud(this, deviceProfile, this.session, () => {
      void this.handleSignOut();
    });
    this.inventoryPanel = new InventoryPanel(this, deviceProfile);
    this.questLog = new QuestLog(this, deviceProfile);

    this.chatPanel = new ChatPanel(this.session, async (text) => {
      if (!this.realtime) {
        return { error: 'Chat unavailable.' };
      }
      const result = await this.realtime.sendChat(text);
      if (result.message) {
        this.chatPanel?.addMessage(result.message);
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
    this.interactionHighlight.update(this.gameWorld.context);
    this.actionPanel.update(this.gameWorld.context);
    this.hud.update(this.gameWorld.context);
    this.inventoryPanel.update(this.gameWorld.context);
    this.questLog.update(this.gameWorld.context);

    if (this.realtime?.isConnected && this.remotePlayers) {
      if (time - this.lastPresenceSync >= PRESENCE_SYNC_INTERVAL_MS) {
        const position = this.gameWorld.context.getPlayerPosition();
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
    });

    this.realtime.onChat((message) => {
      if (message.userId !== this.session.userId) {
        this.chatPanel?.addMessage(message);
      }
    });

    const result = await this.realtime.connect();
    if (result.error) {
      this.chatPanel?.addSystemMessage(`Multiplayer: ${result.error}`);
    } else {
      this.chatPanel?.addSystemMessage('Connected to world. Other players may appear nearby.');
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
    this.touchControls.destroy();
    this.worldPointerInput.destroy();
    this.interactionHighlight.destroy();
    this.actionPanel.destroy();
    this.gatherableVisuals.destroy();
    this.hud.destroy();
    this.inventoryPanel.destroy();
    this.questLog.destroy();
    this.remotePlayers?.destroy();
    this.chatPanel?.destroy();
  }
}
