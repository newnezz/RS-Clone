import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser } from './types';

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    );
  }

  return client;
}

export async function syncRealtimeAuth(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return false;
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    return false;
  }

  await supabase.realtime.setAuth(token);
  return true;
}

async function fetchProfile(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.username as string;
}

export async function resolveAuthUser(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  metadataUsername?: string,
): Promise<AuthUser | null> {
  const profileUsername = await fetchProfile(supabase, userId);
  const username = profileUsername ?? metadataUsername ?? email.split('@')[0];

  return { id: userId, email, username };
}

export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 16) {
    return 'Username must be 3–16 characters.';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return 'Username may only contain letters, numbers, and underscores.';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Enter a valid email address.';
  }
  return null;
}
