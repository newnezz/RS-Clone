import type { EntityManager } from '../entities/EntityManager';
import type { ResourceNodeRegistry } from '../gathering/ResourceNodes';
import type { InteractableRegistry } from '../interaction/InteractableRegistry';
import { createInteractionState, type InteractionState } from '../interaction/InteractionState';
import type { NpcRegistry } from '../npcs/NpcRegistry';
import type { DeviceProfile } from '../platform/DeviceProfile';
import type { GameState } from '../state/GameState';
import type { InputState } from '../input/types';
import type { GatherableVisualAdapter } from '../world/GatherableVisualAdapter';
import type { WorldMap } from '../world/WorldMap';
import { EventBus, GameEvents } from './EventBus';
import type { WorldSnapshot } from './WorldSnapshot';

export class GameContext {
  readonly events: EventBus;
  readonly entityManager: EntityManager;
  readonly map: WorldMap;
  readonly interactables: InteractableRegistry;
  readonly resourceNodes: ResourceNodeRegistry;
  readonly npcs: NpcRegistry;
  readonly gameState: GameState;
  readonly deviceProfile: DeviceProfile;
  readonly interactionState: InteractionState;
  gatherableVisuals: GatherableVisualAdapter | null;
  inputState: InputState;

  constructor(options: {
    entityManager: EntityManager;
    map: WorldMap;
    interactables: InteractableRegistry;
    resourceNodes: ResourceNodeRegistry;
    npcs: NpcRegistry;
    gameState: GameState;
    deviceProfile: DeviceProfile;
    inputState: InputState;
    gatherableVisuals?: GatherableVisualAdapter | null;
    events?: EventBus;
  }) {
    this.events = options.events ?? new EventBus();
    this.entityManager = options.entityManager;
    this.map = options.map;
    this.interactables = options.interactables;
    this.resourceNodes = options.resourceNodes;
    this.npcs = options.npcs;
    this.gameState = options.gameState;
    this.deviceProfile = options.deviceProfile;
    this.interactionState = createInteractionState();
    this.gatherableVisuals = options.gatherableVisuals ?? null;
    this.inputState = options.inputState;
  }

  getPlayerPosition(): { x: number; y: number } | null {
    const player = this.entityManager.get(this.gameState.playerEntityId);
    const position = player?.components.position;
    if (!position) {
      return null;
    }

    return { x: position.x, y: position.y };
  }

  createSnapshot(): WorldSnapshot {
    const position = this.getPlayerPosition();

    return {
      tick: this.gameState.tick,
      player: {
        entityId: this.gameState.playerEntityId,
        x: position?.x ?? 0,
        y: position?.y ?? 0,
      },
    };
  }

  incrementTick(): void {
    this.gameState.tick++;
    this.events.emit(GameEvents.Tick, { tick: this.gameState.tick });
  }

  destroy(): void {
    this.events.clear();
  }
}
