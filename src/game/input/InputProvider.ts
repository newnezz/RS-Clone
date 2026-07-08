import type { InputState } from './types';

export interface InputProvider {
  readonly id: string;
  readonly priority: number;
  poll(): InputState;
  isActive(): boolean;
}
