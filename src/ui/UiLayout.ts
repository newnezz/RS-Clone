import type Phaser from 'phaser';

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const UI_LAYOUT_EVENT = 'ui-layout-change';

let initialized = false;
let bottomChromeHeight = 0;
let hudBottomY = 0;

function readSafeAreaInset(side: keyof SafeAreaInsets): number {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--safe-area-${side}`)
    .trim();
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function measureBottomChrome(): number {
  const panel = document.querySelector('#chat-root .chat-panel') as HTMLElement | null;
  if (!panel) {
    return 0;
  }

  const rect = panel.getBoundingClientRect();
  const margin = Number.parseFloat(getComputedStyle(panel).marginBottom) || 0;
  return rect.height + margin;
}

function publishLayoutChange(): void {
  bottomChromeHeight = measureBottomChrome();
  document.documentElement.style.setProperty(
    '--bottom-chrome-height',
    `${bottomChromeHeight}px`,
  );
  window.dispatchEvent(new CustomEvent(UI_LAYOUT_EVENT));
}

export function initUiLayout(): void {
  if (initialized) {
    publishLayoutChange();
    return;
  }

  initialized = true;

  const chatRoot = document.getElementById('chat-root');
  if (chatRoot) {
    const observer = new ResizeObserver(() => publishLayoutChange());
    observer.observe(chatRoot);

    const mutationObserver = new MutationObserver(() => {
      const panel = chatRoot.querySelector('.chat-panel');
      if (panel) {
        observer.observe(panel);
        publishLayoutChange();
      }
    });
    mutationObserver.observe(chatRoot, { childList: true, subtree: true });
  }

  window.addEventListener('resize', publishLayoutChange);
  window.addEventListener('orientationchange', () => {
    window.setTimeout(publishLayoutChange, 150);
  });

  publishLayoutChange();
}

export function onUiLayoutChange(callback: () => void): () => void {
  window.addEventListener(UI_LAYOUT_EVENT, callback);
  return () => window.removeEventListener(UI_LAYOUT_EVENT, callback);
}

export function getSafeAreaInsets(): SafeAreaInsets {
  const top = readSafeAreaInset('top');
  const right = readSafeAreaInset('right');
  const bottom = readSafeAreaInset('bottom');
  const left = readSafeAreaInset('left');

  return {
    top: Math.max(top, isCompactLayout() ? 4 : 0),
    right: Math.max(right, 0),
    bottom: Math.max(bottom, 0),
    left: Math.max(left, 0),
  };
}

export function getBottomChromeHeight(): number {
  return bottomChromeHeight;
}

export function getTotalBottomInset(): number {
  return getSafeAreaInsets().bottom + bottomChromeHeight;
}

export function getHudMargin(): number {
  return isCompactLayout() ? 6 : 10;
}

export function setHudBottomY(y: number): void {
  hudBottomY = y;
}

export function getHudBottomY(): number {
  return hudBottomY;
}

export function isCompactLayout(): boolean {
  return window.innerWidth <= 430 || window.innerHeight <= 520;
}

export function isLandscapePhone(): boolean {
  return window.innerWidth > window.innerHeight && window.innerHeight <= 520;
}

export function getMaxPanelWidth(side: 'left' | 'right', screenWidth: number): number {
  const margin = getHudMargin();
  const safe = getSafeAreaInsets();
  const usable = screenWidth - safe.left - safe.right - margin * 2;

  if (isLandscapePhone()) {
    return Math.min(usable * 0.42, side === 'left' ? 200 : 180);
  }

  if (isCompactLayout()) {
    return Math.min(usable * 0.55, side === 'left' ? 220 : 200);
  }

  return side === 'left' ? 280 : 240;
}

export function getTopChromeHeight(): number {
  if (isLandscapePhone()) {
    return 28;
  }
  return isCompactLayout() ? 32 : 44;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function worldToScreen(
  scene: Phaser.Scene,
  worldX: number,
  worldY: number,
): { x: number; y: number } {
  const camera = scene.cameras.main;
  return {
    x: (worldX - camera.scrollX) * camera.zoom,
    y: (worldY - camera.scrollY) * camera.zoom,
  };
}

export function getPlayableBounds(scene: Phaser.Scene): {
  left: number;
  top: number;
  right: number;
  bottom: number;
} {
  const safe = getSafeAreaInsets();
  const margin = getHudMargin();
  return {
    left: safe.left + margin,
    top: safe.top + margin + getTopChromeHeight(),
    right: scene.scale.width - safe.right - margin,
    bottom: scene.scale.height - getTotalBottomInset() - margin,
  };
}
