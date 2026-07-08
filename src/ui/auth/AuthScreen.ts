import { AuthService } from '../../auth/AuthService';
import { isSupabaseConfigured } from '../../auth/supabaseClient';
import { authUserToSession, createOfflineSession, type PlayerSession } from '../../auth/types';

type AuthView = 'login' | 'register' | 'forgot';

export interface AuthScreenOptions {
  onStart: (session: PlayerSession) => void;
}

export class AuthScreen {
  private readonly authService: AuthService;
  private readonly overlay: HTMLElement;
  private readonly options: AuthScreenOptions;
  private view: AuthView = 'login';

  constructor(authService: AuthService, options: AuthScreenOptions) {
    this.authService = authService;
    this.options = options;
    const element = document.getElementById('auth-overlay');
    if (!element) {
      throw new Error('Missing #auth-overlay element');
    }
    this.overlay = element;
    this.render();
  }

  show(): void {
    this.overlay.classList.remove('hidden');
  }

  hide(): void {
    this.overlay.classList.add('hidden');
  }

  private render(): void {
    const configured = isSupabaseConfigured();

    this.overlay.innerHTML = `
      <div class="auth-card">
        <h1>Smallwoods</h1>
        <p class="auth-subtitle">A browser RPG for everyone</p>
        ${configured ? '' : '<p class="auth-notice">Supabase is not configured. Copy <code>.env.example</code> to <code>.env</code> to enable online play.</p>'}
        <div class="auth-tabs">
          <button type="button" data-view="login" class="${this.view === 'login' ? 'active' : ''}">Login</button>
          <button type="button" data-view="register" class="${this.view === 'register' ? 'active' : ''}">Register</button>
          <button type="button" data-view="forgot" class="${this.view === 'forgot' ? 'active' : ''}">Forgot</button>
        </div>
        <div id="auth-error" class="auth-error hidden"></div>
        <div id="auth-success" class="auth-success hidden"></div>
        <form id="auth-form" class="auth-form"></form>
        <button type="button" id="auth-offline" class="auth-secondary">Play Offline (solo)</button>
      </div>
    `;

    this.overlay.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click', () => {
        this.view = (button as HTMLElement).dataset.view as AuthView;
        this.render();
      });
    });

    this.renderForm(configured);
    this.overlay.querySelector('#auth-offline')?.addEventListener('click', () => {
      this.hide();
      this.options.onStart(createOfflineSession());
    });
  }

  private renderForm(configured: boolean): void {
    const form = this.overlay.querySelector('#auth-form') as HTMLFormElement;
    const errorEl = this.overlay.querySelector('#auth-error') as HTMLElement;
    const successEl = this.overlay.querySelector('#auth-success') as HTMLElement;

    const showError = (message: string) => {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
      successEl.classList.add('hidden');
    };

    const showSuccess = (message: string) => {
      successEl.textContent = message;
      successEl.classList.remove('hidden');
      errorEl.classList.add('hidden');
    };

    if (this.view === 'login') {
      form.innerHTML = `
        <label>Email<input type="email" name="email" autocomplete="email" required ${configured ? '' : 'disabled'} /></label>
        <label>Password<input type="password" name="password" autocomplete="current-password" required ${configured ? '' : 'disabled'} /></label>
        <button type="submit" ${configured ? '' : 'disabled'}>Login</button>
      `;

      form.onsubmit = async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const result = await this.authService.signIn(
          String(data.get('email') ?? ''),
          String(data.get('password') ?? ''),
        );
        if (result.error || !result.user) {
          showError(result.error ?? 'Login failed.');
          return;
        }
        this.hide();
        this.options.onStart(authUserToSession(result.user));
      };
      return;
    }

    if (this.view === 'register') {
      form.innerHTML = `
        <label>Username<input type="text" name="username" autocomplete="username" minlength="3" maxlength="16" required ${configured ? '' : 'disabled'} /></label>
        <label>Email<input type="email" name="email" autocomplete="email" required ${configured ? '' : 'disabled'} /></label>
        <label>Password<input type="password" name="password" autocomplete="new-password" minlength="6" required ${configured ? '' : 'disabled'} /></label>
        <button type="submit" ${configured ? '' : 'disabled'}>Create Account</button>
      `;

      form.onsubmit = async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const result = await this.authService.signUp(
          String(data.get('email') ?? ''),
          String(data.get('password') ?? ''),
          String(data.get('username') ?? ''),
        );
        if (result.error) {
          showError(result.error);
          return;
        }
        if (result.needsConfirmation) {
          showSuccess('Account created! Check your email to confirm, then log in.');
          return;
        }
        if (result.user) {
          this.hide();
          this.options.onStart(authUserToSession(result.user));
        }
      };
      return;
    }

    form.innerHTML = `
      <label>Email<input type="email" name="email" autocomplete="email" required ${configured ? '' : 'disabled'} /></label>
      <button type="submit" ${configured ? '' : 'disabled'}>Send Reset Link</button>
    `;

    form.onsubmit = async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const result = await this.authService.resetPassword(String(data.get('email') ?? ''));
      if (result.error) {
        showError(result.error);
        return;
      }
      showSuccess('Password reset link sent. Check your email.');
    };
  }
}
