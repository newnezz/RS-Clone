import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  resolveAuthUser,
  syncRealtimeAuth,
  validateEmail,
  validatePassword,
  validateUsername,
} from './supabaseClient';
import type { AuthUser } from './types';

export class AuthService {
  private user: AuthUser | null = null;
  private unsubscribe: (() => void) | null = null;

  get isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  get currentUser(): AuthUser | null {
    return this.user;
  }

  async initSession(): Promise<AuthUser | null> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return null;
    }

    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      this.user = await this.userFromSession(data.session);
      await syncRealtimeAuth();
    }

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          this.user = await this.userFromSession(session);
          await syncRealtimeAuth();
        } else {
          this.user = null;
        }
      },
    );

    this.unsubscribe = () => listener.subscription.unsubscribe();
    return this.user;
  }

  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { user: null, error: 'Online login is not configured.' };
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return { user: null, error: emailError };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, error: 'Sign in failed.' };
    }

    this.user = await this.userFromSession(data.session!);
    return { user: this.user, error: null };
  }

  async signUp(
    email: string,
    password: string,
    username: string,
  ): Promise<{ user: AuthUser | null; error: string | null; needsConfirmation: boolean }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { user: null, error: 'Online registration is not configured.', needsConfirmation: false };
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return { user: null, error: emailError, needsConfirmation: false };
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return { user: null, error: passwordError, needsConfirmation: false };
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      return { user: null, error: usernameError, needsConfirmation: false };
    }

    const trimmedUsername = username.trim();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: trimmedUsername },
      },
    });

    if (error) {
      return { user: null, error: error.message, needsConfirmation: false };
    }

    if (!data.user) {
      return { user: null, error: 'Registration failed.', needsConfirmation: false };
    }

    const needsConfirmation = !data.session;

    if (data.session) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: trimmedUsername,
      });

      this.user = await resolveAuthUser(
        supabase,
        data.user.id,
        data.user.email ?? email,
        trimmedUsername,
      );
      return { user: this.user, error: null, needsConfirmation: false };
    }

    return {
      user: null,
      error: null,
      needsConfirmation,
    };
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: 'Password reset is not configured.' };
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return { error: emailError };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });

    return { error: error?.message ?? null };
  }

  async signOut(): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    this.user = null;
  }

  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private async userFromSession(session: Session): Promise<AuthUser | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !session.user) {
      return null;
    }

    const metadataUsername =
      typeof session.user.user_metadata?.username === 'string'
        ? session.user.user_metadata.username
        : undefined;

    return resolveAuthUser(supabase, session.user.id, session.user.email ?? '', metadataUsername);
  }
}
