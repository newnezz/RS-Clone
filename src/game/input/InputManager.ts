import { createInputState, mergeInputStates, type InputIntent, type InputState, toInputIntent } from './types';
import type { InputProvider } from './InputProvider';

export class InputManager {
  private readonly providers: InputProvider[];

  constructor(providers: InputProvider[]) {
    this.providers = [...providers].sort((a, b) => b.priority - a.priority);
  }

  poll(): InputState {
    const states = this.providers.map((provider) => provider.poll());
    return mergeInputStates([createInputState(), ...states]);
  }

  getActiveProvider(): InputProvider | null {
    return this.providers.find((provider) => provider.isActive()) ?? null;
  }

  createIntent(tick: number): InputIntent {
    return toInputIntent(tick, this.poll());
  }
}
