import { Component, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService } from '../../services/ai-chat.service';
import { QueueService } from '../../services/queue.service';

@Component({
  selector: 'app-ai-assistant-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating Trigger Bubble -->
    <button *ngIf="!aiService.isOpen()" class="chat-floating-btn animate-float" (click)="aiService.openChat()" title="AI Queue Assistant">
      <div class="chat-icon-pulse"></div>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <line x1="9" y1="10" x2="15" y2="10"/>
        <line x1="12" y1="7" x2="12" y2="13"/>
      </svg>
      <span class="chat-btn-label">AI Fitting Assistant</span>
    </button>

    <!-- Chat Drawer Window -->
    <div *ngIf="aiService.isOpen()" class="chat-window-backdrop" (click)="aiService.closeChat()">
      <div class="chat-window glass-card" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="ai-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M12 2a8 8 0 0 0-8 8c0 3.36 2.06 6.24 5 7.42V20a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2.58c2.94-1.18 5-4.06 5-7.42a8 8 0 0 0-8-8z"/>
              </svg>
            </div>
            <div>
              <h3 class="chat-title">AI Queue & Fit Assistant</h3>
              <span class="chat-status">🟢 Online • Instant Response</span>
            </div>
          </div>
          <button class="btn-close-chat" (click)="aiService.closeChat()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Chat Messages Container -->
        <div class="chat-messages" #scrollContainer>
          <div *ngFor="let msg of aiService.messages()" class="message-wrapper" [ngClass]="msg.sender">
            <div class="message-bubble" [ngClass]="msg.sender === 'ai' ? 'ai-bubble' : 'user-bubble'">
              <div class="msg-content" [innerHTML]="formatMessage(msg.text)"></div>
              <span class="msg-time">{{ msg.timestamp | date:'shortTime' }}</span>

              <!-- Quick action chips if provided -->
              <div *ngIf="msg.quickActions && msg.quickActions.length > 0" class="quick-actions-row">
                <button *ngFor="let action of msg.quickActions" class="action-chip" (click)="sendQuickAction(action)">
                  {{ action }}
                </button>
              </div>
            </div>
          </div>

          <!-- Loading typing indicator -->
          <div *ngIf="aiService.isLoading()" class="message-wrapper ai">
            <div class="message-bubble ai-bubble typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="chat-input-area">
          <input
            type="text"
            class="chat-input"
            placeholder="Ask about wait time, limits, size exchange..."
            [(ngModel)]="userInput"
            (keyup.enter)="sendMessage()"
            [disabled]="aiService.isLoading()"
          />
          <button class="btn-send" (click)="sendMessage()" [disabled]="!userInput.trim() || aiService.isLoading()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-floating-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99;
      background: linear-gradient(135deg, #4f46e5, #0ea5e9);
      color: white;
      border: none;
      border-radius: 9999px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      box-shadow: 0 10px 30px rgba(79, 70, 229, 0.45);
      font-weight: 700;
      font-size: 0.9rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .chat-floating-btn:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 14px 35px rgba(79, 70, 229, 0.6);
    }
    .chat-window-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
      padding: 24px;
    }
    .chat-window {
      width: 420px;
      max-width: 95vw;
      height: 600px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(255, 255, 255, 0.15);
      overflow: hidden;
      animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(40px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .chat-header {
      padding: 16px 20px;
      background: rgba(15, 23, 42, 0.85);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .chat-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ai-avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #4f46e5, #0ea5e9);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .chat-title {
      font-size: 0.95rem;
      font-weight: 700;
    }
    .chat-status {
      font-size: 0.72rem;
      color: #34d399;
      font-weight: 500;
    }
    .btn-close-chat {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
    }
    .btn-close-chat:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .message-wrapper {
      display: flex;
      flex-direction: column;
    }
    .message-wrapper.user {
      align-items: flex-end;
    }
    .message-wrapper.ai {
      align-items: flex-start;
    }
    .message-bubble {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 0.885rem;
      line-height: 1.45;
      position: relative;
    }
    .user-bubble {
      background: #4f46e5;
      color: white;
      border-bottom-right-radius: 4px;
    }
    .ai-bubble {
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid var(--border);
      color: var(--text-main);
      border-bottom-left-radius: 4px;
    }
    .msg-time {
      font-size: 0.65rem;
      opacity: 0.6;
      display: block;
      margin-top: 6px;
      text-align: right;
    }
    .quick-actions-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }
    .action-chip {
      background: rgba(79, 70, 229, 0.15);
      border: 1px solid rgba(79, 70, 229, 0.35);
      color: #a5b4fc;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .action-chip:hover {
      background: rgba(79, 70, 229, 0.3);
      color: white;
    }
    .typing-indicator span {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: var(--text-muted);
      border-radius: 50%;
      margin-right: 4px;
      animation: blink 1.4s infinite both;
    }
    .typing-indicator span:nth-child(2) { animation-delay: .2s; }
    .typing-indicator span:nth-child(3) { animation-delay: .4s; }
    @keyframes blink {
      0%, 80%, 100% { opacity: 0; }
      40% { opacity: 1; }
    }
    .chat-input-area {
      padding: 12px 16px;
      background: rgba(15, 23, 42, 0.9);
      border-top: 1px solid var(--border);
      display: flex;
      gap: 8px;
    }
    .chat-input {
      flex: 1;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      padding: 10px 14px;
      color: white;
      font-size: 0.875rem;
      outline: none;
    }
    .chat-input:focus {
      border-color: var(--primary);
    }
    .btn-send {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: var(--primary);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-send:hover:not(:disabled) {
      background: var(--primary-hover);
    }
    .btn-send:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `]
})
export class AiAssistantDrawerComponent implements AfterViewChecked {
  aiService = inject(AiChatService);
  queueService = inject(QueueService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  userInput = '';

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  sendMessage(): void {
    if (!this.userInput.trim()) return;
    const text = this.userInput;
    this.userInput = '';

    const active = this.queueService.activeTicket();
    this.aiService.sendMessage(
      text,
      active?.tokenNumber,
      active?.storeId,
      active?.customerName
    ).subscribe();
  }

  sendQuickAction(action: string): void {
    const active = this.queueService.activeTicket();
    this.aiService.sendMessage(
      action,
      active?.tokenNumber,
      active?.storeId,
      active?.customerName
    ).subscribe();
  }

  formatMessage(text: string): string {
    // Basic Markdown formatting for bold and bullets
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/• /g, '&bull; ');
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch {}
  }
}
