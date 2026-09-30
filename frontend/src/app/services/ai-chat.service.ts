import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ChatMessage } from '../models/queue.models';

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private readonly API_URL = 'http://localhost:8080/api/ai';

  messages = signal<ChatMessage[]>([
    {
      sender: 'ai',
      text: "👋 Hi! I'm your **Smart Trial Room AI Assistant**.\n\nAsk me anything about your wait time, garment limits, trial room policies, or requesting a different size!",
      quickActions: ['How long is my wait?', 'Garment limits?', 'Store Fitting Policy', 'Request Size Help'],
      timestamp: new Date()
    }
  ]);

  isOpen = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  toggleChat(): void {
    this.isOpen.set(!this.isOpen());
  }

  openChat(): void {
    this.isOpen.set(true);
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  sendMessage(text: string, tokenNumber?: string, storeId?: number, customerName?: string): Observable<any> {
    const userMsg: ChatMessage = {
      sender: 'user',
      text,
      timestamp: new Date()
    };
    this.messages.update(msgs => [...msgs, userMsg]);
    this.isLoading.set(true);

    const payload: any = { message: text };
    if (tokenNumber) payload.tokenNumber = tokenNumber;
    if (storeId) payload.storeId = storeId;
    if (customerName) payload.customerName = customerName;

    return this.http.post<any>(`${this.API_URL}/chat`, payload).pipe(
      tap({
        next: (res) => {
          this.isLoading.set(false);
          const aiMsg: ChatMessage = {
            sender: 'ai',
            text: res.reply,
            intent: res.intent,
            quickActions: res.quickActions,
            estimatedRemainingMinutes: res.estimatedRemainingMinutes,
            timestamp: new Date()
          };
          this.messages.update(msgs => [...msgs, aiMsg]);
        },
        error: () => {
          this.isLoading.set(false);
          const errorMsg: ChatMessage = {
            sender: 'ai',
            text: "I'm having a brief connection hiccup. Please ask our trial room staff if you need immediate assistance!",
            timestamp: new Date()
          };
          this.messages.update(msgs => [...msgs, errorMsg]);
        }
      })
    );
  }
}
