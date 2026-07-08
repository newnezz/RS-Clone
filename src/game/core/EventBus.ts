type EventHandler<T> = (payload: T) => void;

export class EventBus {
  private readonly listeners = new Map<string, Set<EventHandler<unknown>>>();

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const handlers = this.listeners.get(event)!;
    handlers.add(handler as EventHandler<unknown>);

    return () => {
      handlers.delete(handler as EventHandler<unknown>);
    };
  }

  emit<T>(event: string, payload: T): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      handler(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const GameEvents = {
  Tick: 'game:tick',
  PlayerMoved: 'player:moved',
  InteractionSelected: 'interaction:selected',
  InteractionPerformed: 'interaction:performed',
  SkillXpGained: 'skill:xp_gained',
  ItemGained: 'item:gained',
  ResourceDepleted: 'resource:depleted',
  QuestStarted: 'quest:started',
  QuestCompleted: 'quest:completed',
} as const;
