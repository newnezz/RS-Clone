import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '../auth/supabaseClient';
import type { PlayerSession } from '../auth/types';
import {
  sanitizeChatMessage,
  WORLD_CHANNEL,
  type ChatMessage,
  type PlayerPresence,
} from './types';

type PresenceListener = (players: PlayerPresence[]) => void;
type ChatListener = (message: ChatMessage) => void;

export class RealtimeService {
  private channel: RealtimeChannel | null = null;
  private readonly session: PlayerSession;
  private presenceListener: PresenceListener | null = null;
  private chatListener: ChatListener | null = null;
  private connected = false;

  constructor(session: PlayerSession) {
    this.session = session;
  }

  get isConnected(): boolean {
    return this.connected;
  }

  onPresence(listener: PresenceListener): void {
    this.presenceListener = listener;
  }

  onChat(listener: ChatListener): void {
    this.chatListener = listener;
  }

  async connect(): Promise<{ error: string | null }> {
    if (this.session.mode !== 'online') {
      return { error: null };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: 'Supabase is not configured.' };
    }

    this.channel = supabase.channel(WORLD_CHANNEL, {
      config: { presence: { key: this.session.userId } },
    });

    this.channel
      .on('presence', { event: 'sync' }, () => this.emitPresence())
      .on('presence', { event: 'join' }, () => this.emitPresence())
      .on('presence', { event: 'leave' }, () => this.emitPresence())
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        const message = payload as ChatMessage;
        if (message?.text && message.username) {
          this.chatListener?.(message);
        }
      });

    return new Promise((resolve) => {
      this.channel!.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          this.connected = true;
          await this.channel?.track({
            userId: this.session.userId,
            username: this.session.username,
            x: 0,
            y: 0,
            updatedAt: Date.now(),
          });
          this.emitPresence();
          resolve({ error: null });
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          resolve({ error: `Could not connect to world (${status}).` });
        }
      });
    });
  }

  async updatePresence(x: number, y: number): Promise<void> {
    if (!this.channel || !this.connected) {
      return;
    }

    await this.channel.track({
      userId: this.session.userId,
      username: this.session.username,
      x: Math.round(x),
      y: Math.round(y),
      updatedAt: Date.now(),
    });
  }

  async sendChat(text: string): Promise<{ error: string | null; message: ChatMessage | null }> {
    if (!this.channel || !this.connected) {
      return { error: 'Not connected to world chat.', message: null };
    }

    const sanitized = sanitizeChatMessage(text);
    if (!sanitized) {
      return { error: 'Message cannot be empty.', message: null };
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      userId: this.session.userId,
      username: this.session.username,
      text: sanitized,
      timestamp: Date.now(),
    };

    const status = await this.channel.send({
      type: 'broadcast',
      event: 'chat',
      payload: message,
    });

    if (status !== 'ok') {
      return { error: 'Failed to send message.', message: null };
    }

    return { error: null, message };
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.untrack();
      await this.channel.unsubscribe();
      this.channel = null;
    }
    this.connected = false;
  }

  private emitPresence(): void {
    if (!this.channel || !this.presenceListener) {
      return;
    }

    const state = this.channel.presenceState<{
      userId: string;
      username: string;
      x: number;
      y: number;
      updatedAt: number;
    }>();

    const players: PlayerPresence[] = [];

    for (const presences of Object.values(state)) {
      const latest = presences[presences.length - 1];
      if (!latest || latest.userId === this.session.userId) {
        continue;
      }
      players.push({
        userId: latest.userId,
        username: latest.username,
        x: latest.x,
        y: latest.y,
        updatedAt: latest.updatedAt,
      });
    }

    this.presenceListener(players);
  }
}
