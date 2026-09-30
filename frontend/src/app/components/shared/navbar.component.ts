import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar-wrapper">
      <div class="nav-container">
        <!-- Brand / Store Title -->
        <div class="brand-link">
          <div class="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
            </svg>
          </div>
          <div class="brand-info">
            <span class="brand-title">Smart Trial Room</span>
            <span class="brand-sub">{{ authService.currentUser()?.storeName || 'Queue Management Platform' }}</span>
          </div>
        </div>

        <!-- Right Side: User Profile & Logout -->
        <div class="nav-actions">
          <div *ngIf="authService.currentUser() as user; else guestTpl" class="user-menu">
            <div class="avatar-badge">{{ user.fullName.charAt(0) }}</div>
            <div class="user-details">
              <span class="user-name">{{ user.fullName }}</span>
              <span class="user-role badge" [ngClass]="'badge-' + user.role.toLowerCase()">{{ user.role }}</span>
            </div>
            <button class="btn-logout" (click)="logout()" title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" x2="9" y1="12" y2="12"/>
              </svg>
              <span>Logout</span>
            </button>
          </div>

          <ng-template #guestTpl>
            <a routerLink="/login" class="btn btn-primary btn-sm">Login / Register</a>
          </ng-template>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar-wrapper {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 12px 0;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
    }
    .nav-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    .brand-link {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;
    }
    .brand-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4f46e5, #0284c7);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
    }
    .brand-info {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #0f172a;
    }
    .brand-sub {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .user-menu {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar-badge {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #3b82f6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.95rem;
      box-shadow: 0 3px 10px rgba(79, 70, 229, 0.3);
    }
    .user-details {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: #0f172a;
    }
    .user-role {
      font-size: 0.65rem;
      padding: 2px 8px;
      align-self: flex-start;
    }
    .btn-logout {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      cursor: pointer;
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.825rem;
      font-weight: 700;
      transition: all 0.2s ease;
    }
    .btn-logout:hover {
      background: #fee2e2;
      color: #b91c1c;
      border-color: #fca5a5;
    }
    .btn-sm {
      padding: 6px 14px;
      font-size: 0.825rem;
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
