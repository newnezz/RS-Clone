import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
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

interface ConnectOptions {
  x: number;
  y: number;
}

export class RealtimeService {
  private channel: RealtimeChannel | null = null;
  private readonly session: PlayerSession;
  private presenceListener: PresenceListener | null = null;
  private chatListener: ChatListener | null = null;
  private connected = false;
  private authUnsubscribe: (() => void) | null = null;

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

  async connect(options: ConnectOptions): Promise<{ error: string | null }> {
    if (this.session.mode !== 'online') {
      return { error: null };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: 'Supabase is not configured.' };
    }

    const authReady = await this.ensureRealtimeAuth(supabase);
    if (!authReady) {
      return { error: 'Not authenticated for multiplayer. Try signing out and back in.' };
    }

    this.bindAuthListener(supabase);

    let result = await this.subscribeToChannel(supabase, true, options);
    if (result.error) {
      result = await this.subscribeToChannel(supabase, false, options);
    }

    if (result.error) {
      return result;
    }

    const trackResult = await this.channel!.track({
      userId: this.session.userId,
      username: this.session.username,
      x: Math.round(options.x),
      y: Math.round(options.y),
      updatedAt: Date.now(),
    });

    if (trackResult !== 'ok') {
      return { error: 'Connected but failed to announce your presence.' };
    }

    this.emitPresence();
    return { error: null };
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
      return { error: 'Failed to send message. Check your connection.', message: null };
    }

    return { error: null, message };
  }

  async disconnect(): Promise<void> {
    this.authUnsubscribe?.();
    this.authUnsubscribe = null;

    const supabase = getSupabaseClient();
    if (this.channel) {
      await this.channel.untrack();
      await this.channel.unsubscribe();
      supabase?.removeChannel(this.channel);
      this.channel = null;
    }
    this.connected = false;
  }

  private bindAuthListener(supabase: SupabaseClient): void {
    this.authUnsubscribe?.();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        void supabase.realtime.setAuth(session.access_token);
      }
    });
    this.authUnsubscribe = () => authListener.subscription.unsubscribe();
  }

  private async subscribeToChannel(
    supabase: SupabaseClient,
    isPrivate: boolean,
    _options: ConnectOptions,
  ): Promise<{ error: string | null }> {
    await this.teardownChannel(supabase);

    this.channel = supabase.channel(WORLD_CHANNEL, {
      config: {
        presence: { key: this.session.userId },
        private: isPrivate,
        broadcast: { self: false },
      },
    });

    this.channel
      .on('presence', { event: 'sync' }, () => this.emitPresence())
      .on('presence', { event: 'join' }, () => this.emitPresence())
      .on('presence', { event: 'leave' }, () => this.emitPresence())
      .on('broadcast', { event: 'chat' }, (envelope) => {
        const message = this.parseChatEnvelope(envelope);
        if (message) {
          this.chatListener?.(message);
        }
      });

    return this.waitForSubscribe(isPrivate);
  }

  private waitForSubscribe(isPrivate: boolean): Promise<{ error: string | null }> {
    return new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        resolve({
          error: `Connection timed out (${isPrivate ? 'private' : 'public'} channel).`,
        });
      }, 12_000);

      this.channel!.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          window.clearTimeout(timeout);
          this.connected = true;
          resolve({ error: null });
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          window.clearTimeout(timeout);
          const detail = err?.message ? `: ${err.message}` : '';
          resolve({
            error: `Could not connect (${isPrivate ? 'private' : 'public'}${detail}).`,
          });
        }
      });
    });
  }

  private async teardownChannel(supabase: SupabaseClient): Promise<void> {
    if (!this.channel) {
      return;
    }

    await this.channel.unsubscribe();
    supabase.removeChannel(this.channel);
    this.channel = null;
    this.connected = false;
  }

  private async ensureRealtimeAuth(
    supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  ): Promise<boolean> {
    const refreshed = await supabase.auth.refreshSession();
    const token =
      refreshed.data.session?.access_token ??
      (await supabase.auth.getSession()).data.session?.access_token;

    if (!token) {
      return false;
    }

    await supabase.realtime.setAuth(token);
    return true;
  }

  private parseChatEnvelope(envelope: Record<string, unknown>): ChatMessage | null {
    const nested = envelope.payload;
    const candidate =
      nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : envelope;

    if (
      typeof candidate.text !== 'string' ||
      typeof candidate.username !== 'string' ||
      typeof candidate.userId !== 'string'
    ) {
      return null;
    }

    return {
      id: typeof candidate.id === 'string' ? candidate.id : crypto.randomUUID(),
      userId: candidate.userId,
      username: candidate.username,
      text: candidate.text,
      timestamp: typeof candidate.timestamp === 'number' ? candidate.timestamp : Date.now(),
    };
  }

  private emitPresence(): void {
    if (!this.channel || !this.presenceListener) {
      return;
    }

    const state = this.channel.presenceState<{
      userId?: string;
      username?: string;
      x?: number;
      y?: number;
      updatedAt?: number;
    }>();

    const players: PlayerPresence[] = [];

    for (const [presenceKey, presences] of Object.entries(state)) {
      if (presenceKey === this.session.userId) {
        continue;
      }

      const latest = presences[presences.length - 1];
      if (!latest) {
        continue;
      }

      players.push({
        userId: latest.userId ?? presenceKey,
        username: latest.username ?? 'Player',
        x: latest.x ?? 0,
        y: latest.y ?? 0,
        updatedAt: latest.updatedAt ?? Date.now(),
      });
    }

    this.presenceListener(players);
  }
}
