import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { FeedbackRequest, JoinQueueRequest, PublicDisplayData, QueueSummary, QueueTicket, ServiceType, Store } from '../models/queue.models';

@Injectable({
  providedIn: 'root'
})
export class QueueService {
  private readonly API_URL = 'http://localhost:8080/api';
  private readonly ACTIVE_TOKEN_KEY = 'tr_active_token';

  activeTicket = signal<QueueTicket | null>(null);
  activeTokenNumber = signal<string | null>(localStorage.getItem(this.ACTIVE_TOKEN_KEY));
  currentStore = signal<Store | null>(null);

  constructor(private http: HttpClient) {
    const savedToken = localStorage.getItem(this.ACTIVE_TOKEN_KEY);
    if (savedToken) {
      this.refreshTicketStatus(savedToken);
    }
  }

  // Stores & Service types
  getStores(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.API_URL}/stores`);
  }

  getStoreByCode(code: string): Observable<Store> {
    return this.http.get<Store>(`${this.API_URL}/stores/code/${code}`);
  }

  getServiceTypes(): Observable<ServiceType[]> {
    return this.http.get<ServiceType[]>(`${this.API_URL}/service-types`);
  }

  // Customer Queue Actions
  joinQueue(request: JoinQueueRequest): Observable<QueueTicket> {
    return this.http.post<QueueTicket>(`${this.API_URL}/queue/join`, request).pipe(
      tap(ticket => {
        this.setActiveTicket(ticket);
      })
    );
  }

  getTicketStatus(tokenNumber: string): Observable<QueueTicket> {
    return this.http.get<QueueTicket>(`${this.API_URL}/queue/status/${tokenNumber}`).pipe(
      tap(ticket => {
        this.activeTicket.set(ticket);
      })
    );
  }

  cancelTicket(ticketId: number, reason?: string): Observable<QueueTicket> {
    let params: Record<string, string> = {};
    if (reason) {
      params['reason'] = reason;
    }
    return this.http.post<QueueTicket>(`${this.API_URL}/queue/cancel/${ticketId}`, {}, { params }).pipe(
      tap(() => {
        this.clearActiveTicket();
      })
    );
  }

  submitFeedback(request: FeedbackRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/customer/feedback`, request);
  }

  // Staff & Display Queue Actions
  getStoreQueueSummary(storeId: number): Observable<QueueSummary> {
    return this.http.get<QueueSummary>(`${this.API_URL}/queue/store/${storeId}/summary`);
  }

  getPublicDisplay(storeCode: string): Observable<PublicDisplayData> {
    return this.http.get<PublicDisplayData>(`${this.API_URL}/public/display/${storeCode}`);
  }

  callTicket(storeId: number, roomId?: number, ticketId?: number): Observable<QueueTicket> {
    return this.http.post<QueueTicket>(`${this.API_URL}/queue/call`, { storeId, roomId, ticketId });
  }

  startService(ticketId: number, roomId?: number): Observable<QueueTicket> {
    let params: Record<string, string> = {};
    if (roomId) {
      params['roomId'] = roomId.toString();
    }
    return this.http.post<QueueTicket>(`${this.API_URL}/queue/start-service/${ticketId}`, {}, { params });
  }

  completeService(ticketId: number): Observable<QueueTicket> {
    return this.http.post<QueueTicket>(`${this.API_URL}/queue/complete/${ticketId}`, {});
  }

  skipTicket(ticketId: number): Observable<QueueTicket> {
    return this.http.post<QueueTicket>(`${this.API_URL}/queue/skip/${ticketId}`, {});
  }

  recallTicket(ticketId: number): Observable<QueueTicket> {
    return this.http.post<QueueTicket>(`${this.API_URL}/queue/recall/${ticketId}`, {});
  }

  markNoShow(ticketId: number): Observable<QueueTicket> {
    return this.http.post<QueueTicket>(`${this.API_URL}/queue/no-show/${ticketId}`, {});
  }

  // State Management
  setActiveTicket(ticket: QueueTicket): void {
    localStorage.setItem(this.ACTIVE_TOKEN_KEY, ticket.tokenNumber);
    this.activeTokenNumber.set(ticket.tokenNumber);
    this.activeTicket.set(ticket);
  }

  clearActiveTicket(): void {
    localStorage.removeItem(this.ACTIVE_TOKEN_KEY);
    this.activeTokenNumber.set(null);
    this.activeTicket.set(null);
  }

  refreshTicketStatus(tokenNumber?: string): void {
    const token = tokenNumber || this.activeTokenNumber();
    if (token) {
      this.getTicketStatus(token).subscribe({
        next: (t) => {
          if (t.status === 'COMPLETED' || t.status === 'CANCELLED' || t.status === 'NO_SHOW') {
            // Keep ticket for feedback or completion screen
            this.activeTicket.set(t);
          }
        },
        error: () => {
          this.clearActiveTicket();
        }
      });
    }
  }
}
