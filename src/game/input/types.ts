export interface InputVector {
  x: number;
  y: number;
}

export interface WorldPointer {
  worldX: number;
  worldY: number;
}

export interface InputState {
  movement: InputVector;
  pointer: WorldPointer | null;
  selectPressed: boolean;
  interactPressed: boolean;
}

export function createInputState(overrides?: Partial<InputState>): InputState {
  return {
    movement: { x: 0, y: 0, ...overrides?.movement },
    pointer: overrides?.pointer ?? null,
    selectPressed: overrides?.selectPressed ?? false,
    interactPressed: overrides?.interactPressed ?? false,
  };
}

export function normalizeInputVector(vector: InputVector): InputVector {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return { x: vector.x / length, y: vector.y / length };
}

export function mergeMovementVectors(primary: InputVector, fallback: InputVector): InputVector {
  const primaryActive = primary.x !== 0 || primary.y !== 0;
  if (primaryActive) {
    return { ...primary };
  }

  return { ...fallback };
}

export function mergeInputStates(states: InputState[]): InputState {
  const merged = createInputState();

  for (const state of states) {
    merged.movement = mergeMovementVectors(state.movement, merged.movement);
    if (state.pointer) {
      merged.pointer = state.pointer;
    }
    merged.selectPressed = merged.selectPressed || state.selectPressed;
    merged.interactPressed = merged.interactPressed || state.interactPressed;
  }

  return merged;
}

/**
 * Serializable player intent — the shape we will eventually send to a server.
 */
export interface InputIntent {
  tick: number;
  movement: InputVector;
  selectPressed: boolean;
  interactPressed: boolean;
}

export function toInputIntent(tick: number, input: InputState): InputIntent {
  return {
    tick,
    movement: normalizeInputVector(input.movement),
    selectPressed: input.selectPressed,
    interactPressed: input.interactPressed,
  };
}
