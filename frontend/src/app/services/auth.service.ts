import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, Role, User } from '../models/queue.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  private readonly TOKEN_KEY = 'tr_auth_token';
  private readonly USER_KEY = 'tr_auth_user';

  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

  isAuthenticated = computed(() => !!this.currentUser() && !!this.token());
  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  isStaff = computed(() => this.currentUser()?.role === 'STAFF' || this.currentUser()?.role === 'ADMIN');
  isCustomer = computed(() => this.currentUser()?.role === 'CUSTOMER');

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.token.set(null);
  }

  // Fast 1-Click Demo Login
  quickDemoLogin(role: Role): Observable<AuthResponse> {
    let creds = { username: 'customer1', password: 'customer123' };
    if (role === 'ADMIN') {
      creds = { username: 'admin', password: 'admin123' };
    } else if (role === 'STAFF') {
      creds = { username: 'staff1', password: 'staff123' };
    }
    return this.login(creds);
  }

  private handleAuthSuccess(res: AuthResponse): void {
    const user: User = {
      id: res.id,
      username: res.username,
      fullName: res.fullName,
      email: res.email,
      phone: res.phone,
      role: res.role,
      storeId: res.storeId,
      storeName: res.storeName,
      active: true
    };
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.token.set(res.token);
    this.currentUser.set(user);
  }

  private getStoredUser(): User | null {
    const data = localStorage.getItem(this.USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return this.token() || localStorage.getItem(this.TOKEN_KEY);
  }
}
