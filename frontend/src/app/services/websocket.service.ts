import { Injectable, signal } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client | null = null;
  private messageSubject$ = new Subject<{ topic: string; body: any }>();
  
  isConnected = signal<boolean>(false);

  constructor() {
    this.initStompClient();
  }

  private initStompClient(): void {
    try {
      this.client = new Client({
        webSocketFactory: () => {
          try {
            const Sock = (SockJS as any).default || SockJS;
            return new Sock('http://localhost:8080/ws');
          } catch {
            return new WebSocket('ws://localhost:8080/ws-raw');
          }
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: () => {},
        onConnect: () => {
          this.isConnected.set(true);
          console.log('[WebSocket] STOMP connected successfully');
        },
        onDisconnect: () => {
          this.isConnected.set(false);
        },
        onStompError: (frame) => {
          console.error('[WebSocket] STOMP error: ', frame.headers['message']);
          this.isConnected.set(false);
        }
      });

      this.client.activate();
    } catch (e) {
      console.warn('[WebSocket] STOMP activation deferred:', e);
    }
  }

  subscribeToTopic<T>(topic: string): Observable<T> {
    // If client is connected, subscribe immediately
    if (this.client && this.client.connected) {
      this.client.subscribe(topic, (message: IMessage) => {
        try {
          const body = JSON.parse(message.body);
          this.messageSubject$.next({ topic, body });
        } catch {
          this.messageSubject$.next({ topic, body: message.body });
        }
      });
    } else {
      // Re-try subscription once connected
      const checkAndSub = setInterval(() => {
        if (this.client && this.client.connected) {
          this.client.subscribe(topic, (message: IMessage) => {
            try {
              const body = JSON.parse(message.body);
              this.messageSubject$.next({ topic, body });
            } catch {
              this.messageSubject$.next({ topic, body: message.body });
            }
          });
          clearInterval(checkAndSub);
        }
      }, 1000);
    }

    return this.messageSubject$.asObservable().pipe(
      filter(msg => msg.topic === topic),
      map(msg => msg.body as T)
    );
  }
}
