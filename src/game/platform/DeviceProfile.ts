export type InputMode = 'keyboard' | 'touch' | 'hybrid';

export interface DeviceProfile {
  inputMode: InputMode;
  isTouchPrimary: boolean;
  isLowEnd: boolean;
  cameraZoom: number;
  targetFps: number;
  preferLowPowerGpu: boolean;
  safeAreaInsets: { top: number; right: number; bottom: number; left: number };
}

function readSafeAreaInset(side: 'top' | 'right' | 'bottom' | 'left'): number {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--safe-area-${side}`)
    .trim();

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function detectInputMode(): InputMode {
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const touchPoints = navigator.maxTouchPoints ?? 0;

  if (touchPoints > 0 && coarsePointer && !finePointer) {
    return 'touch';
  }

  if (touchPoints > 0 && finePointer) {
    return 'hybrid';
  }

  return 'keyboard';
}

function detectLowEnd(): boolean {
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const dpr = window.devicePixelRatio ?? 1;

  return cores <= 2 || memory <= 2 || (dpr >= 3 && cores <= 4);
}

export function createDeviceProfile(): DeviceProfile {
  const inputMode = detectInputMode();
  const isLowEnd = detectLowEnd();
  const isTouchPrimary = inputMode === 'touch' || inputMode === 'hybrid';

  return {
    inputMode,
    isTouchPrimary,
    isLowEnd,
    cameraZoom: isLowEnd ? 1.25 : isTouchPrimary ? 1.5 : 1.75,
    targetFps: isLowEnd ? 30 : 60,
    preferLowPowerGpu: isLowEnd || isTouchPrimary,
    safeAreaInsets: {
      top: readSafeAreaInset('top'),
      right: readSafeAreaInset('right'),
      bottom: readSafeAreaInset('bottom'),
      left: readSafeAreaInset('left'),
    },
  };
}
