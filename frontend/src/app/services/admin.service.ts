import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog, DashboardStats, Feedback, QueueRule, Store, TrialRoom, User } from '../models/queue.models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_URL = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) {}

  getDashboardStats(storeId?: number): Observable<DashboardStats> {
    let params: Record<string, string> = {};
    if (storeId) {
      params['storeId'] = storeId.toString();
    }
    return this.http.get<DashboardStats>(`${this.API_URL}/stats`, { params });
  }

  // Store Management
  createStore(store: Partial<Store>): Observable<Store> {
    return this.http.post<Store>(`${this.API_URL}/stores`, store);
  }

  updateStore(id: number, store: Partial<Store>): Observable<Store> {
    return this.http.put<Store>(`${this.API_URL}/stores/${id}`, store);
  }

  deleteStore(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/stores/${id}`);
  }

  // Room Management
  createRoom(room: Partial<TrialRoom>): Observable<TrialRoom> {
    return this.http.post<TrialRoom>(`${this.API_URL}/rooms`, room);
  }

  // User & Staff Management
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users`);
  }

  getStaffUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/staff`);
  }

  createStaff(staffData: any): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/staff`, staffData);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/users/${id}`);
  }

  // Queue Rules
  getQueueRule(storeId: number): Observable<QueueRule> {
    return this.http.get<QueueRule>(`${this.API_URL}/rules/${storeId}`);
  }

  updateQueueRule(storeId: number, rule: QueueRule): Observable<QueueRule> {
    return this.http.put<QueueRule>(`${this.API_URL}/rules/${storeId}`, rule);
  }

  // Feedbacks
  getAllFeedbacks(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.API_URL}/feedbacks`);
  }

  // Audit Logs
  getAuditLogs(storeId?: number): Observable<AuditLog[]> {
    let params: Record<string, string> = {};
    if (storeId) {
      params['storeId'] = storeId.toString();
    }
    return this.http.get<AuditLog[]>(`${this.API_URL}/audit-logs`, { params });
  }
}
