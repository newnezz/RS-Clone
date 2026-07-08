import type { PlayerSession } from '../auth/types';
import type { ChatMessage } from '../network/types';
import { initUiLayout } from './UiLayout';

export class ChatPanel {
  private readonly root: HTMLElement;
  private readonly messagesEl: HTMLElement;
  private readonly form: HTMLFormElement;
  private readonly input: HTMLInputElement;
  private readonly onSend: (text: string) => Promise<{ error: string | null }>;
  private open: boolean;

  constructor(session: PlayerSession, onSend: (text: string) => Promise<{ error: string | null }>) {
    this.onSend = onSend;
    this.open = true;

    const element = document.getElementById('chat-root');
    if (!element) {
      throw new Error('Missing #chat-root element');
    }
    this.root = element;

    const offlineHint = session.mode === 'offline' ? ' (offline — local only)' : '';

    this.root.innerHTML = `
      <div class="chat-panel ${this.open ? '' : 'chat-collapsed'}">
        <div class="chat-header">
          <span>World Chat</span>
          <button type="button" id="chat-toggle" aria-label="Toggle chat">${this.open ? '−' : '+'}</button>
        </div>
        <div id="chat-messages" class="chat-messages"></div>
        <form id="chat-form" class="chat-form">
          <input id="chat-input" type="text" maxlength="200" placeholder="Type a message…${offlineHint}" autocomplete="off" enterkeyhint="send" />
          <button type="submit">Send</button>
        </form>
      </div>
    `;

    this.messagesEl = this.root.querySelector('#chat-messages') as HTMLElement;
    this.form = this.root.querySelector('#chat-form') as HTMLFormElement;
    this.input = this.root.querySelector('#chat-input') as HTMLInputElement;

    this.root.querySelector('#chat-toggle')?.addEventListener('click', () => {
      this.open = !this.open;
      this.root.querySelector('.chat-panel')?.classList.toggle('chat-collapsed', !this.open);
      const toggle = this.root.querySelector('#chat-toggle');
      if (toggle) {
        toggle.textContent = this.open ? '−' : '+';
      }
      initUiLayout();
    });

    this.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const text = this.input.value;
      if (!text.trim()) {
        return;
      }

      const result = await this.onSend(text);
      if (!result.error) {
        this.input.value = '';
      }
    });

    initUiLayout();

    if (session.mode === 'online') {
      this.addSystemMessage(`Logged in as ${session.username}. Say hello!`);
    } else {
      this.addSystemMessage(`Playing offline as ${session.username}. Chat is local only.`);
    }
  }

  addMessage(message: ChatMessage): void {
    const line = document.createElement('div');
    line.className = 'chat-line';
    line.innerHTML = `<strong>${escapeHtml(message.username)}:</strong> ${escapeHtml(message.text)}`;
    this.messagesEl.appendChild(line);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

    while (this.messagesEl.children.length > 50) {
      this.messagesEl.firstChild?.remove();
    }
  }

  addSystemMessage(text: string): void {
    const line = document.createElement('div');
    line.className = 'chat-line chat-system';
    line.textContent = text;
    this.messagesEl.appendChild(line);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  destroy(): void {
    this.root.innerHTML = '';
  }
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
