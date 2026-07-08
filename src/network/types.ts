export interface PlayerPresence {
  userId: string;
  username: string;
  x: number;
  y: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

export const WORLD_CHANNEL = 'world:main';
export const PRESENCE_SYNC_INTERVAL_MS = 100;
export const MAX_CHAT_LENGTH = 200;

export function sanitizeChatMessage(text: string): string {
  return text.trim().slice(0, MAX_CHAT_LENGTH);
}
