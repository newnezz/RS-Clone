import type { GameContext } from '../core/GameContext';

export interface GameSystem {
  readonly name: string;
  update(context: GameContext, deltaSeconds: number): void;
}

export class SystemPipeline {
  private readonly systems: GameSystem[] = [];

  add(system: GameSystem): this {
    this.systems.push(system);
    return this;
  }

  update(context: GameContext, deltaSeconds: number): void {
    for (const system of this.systems) {
      system.update(context, deltaSeconds);
    }
  }
}
