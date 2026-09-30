import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/queue.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page-container">

      <div class="auth-card glass-card">
        <!-- Logo & Header -->
        <div class="auth-header">
          <div class="brand-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
            </svg>
          </div>
          <h2 class="auth-title">Staff & Admin Operations Portal</h2>
          <p class="auth-desc">Authorized personnel login. Walk-in customers scan the in-store QR code to receive a queue token.</p>
        </div>

        <!-- CUSTOMER WALK-IN PROMPT BANNER -->
        <div class="customer-walkin-banner">
          <div class="banner-text">
            <strong>Are you a Store Shopper?</strong>
            <span>No account required. Scan the entrance QR code or access the queue directly.</span>
          </div>
          <a routerLink="/customer" class="btn btn-secondary btn-sm">Customer Queue Access</a>
        </div>

        <!-- Auth Form -->
        <form class="auth-form" (ngSubmit)="onSubmit()">

          <div *ngIf="isRegisterMode" class="input-group">
            <label>Full Name</label>
            <input type="text" class="form-input" [(ngModel)]="fullName" name="fullName" placeholder="e.g. Sarah Jenkins" required />
          </div>

          <div class="input-group">
            <label>Username</label>
            <input type="text" class="form-input" [(ngModel)]="username" name="username" placeholder="Enter username" required />
          </div>

          <div *ngIf="isRegisterMode" class="input-group">
            <label>Email Address</label>
            <input type="email" class="form-input" [(ngModel)]="email" name="email" placeholder="sarah@example.com" />
          </div>

          <div class="input-group">
            <label>Password</label>
            <input type="password" class="form-input" [(ngModel)]="password" name="password" placeholder="Enter password" required />
          </div>

          <div *ngIf="errorMessage" class="error-banner">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="isLoading">
            {{ isLoading ? 'Authenticating...' : (isRegisterMode ? 'Create Account' : 'Sign In') }}
          </button>
        </form>

        <div class="auth-footer">
          <span *ngIf="!isRegisterMode">
            Don't have an account? <a (click)="isRegisterMode = true">Register here</a>
          </span>
          <span *ngIf="isRegisterMode">
            Already have an account? <a (click)="isRegisterMode = false">Sign In</a>
          </span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .auth-page-container {
      min-height: calc(100vh - 80px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      position: relative;
    }

    .auth-card {
      width: 460px;
      max-width: 100%;
      padding: 38px 34px;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      position: relative;
      z-index: 1;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 26px;
    }

    .brand-logo {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin: 0 auto 14px;
      box-shadow: 0 10px 24px rgba(16, 185, 129, 0.35);
    }

    .auth-header h2 {
      font-size: 1.45rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff !important;
    }

    .auth-header p {
      font-size: 0.875rem;
      color: #cbd5e1 !important;
      margin-top: 6px;
      font-weight: 500;
    }

    .customer-walkin-banner {
      background: rgba(30, 41, 59, 0.8);
      border: 1px dashed rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .banner-text {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .banner-text strong {
      font-size: 0.88rem;
      color: #ffffff;
    }
    .banner-text span {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .input-group label {
      display: block;
      font-size: 0.85rem;
      color: #ffffff !important;
      margin-bottom: 7px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .form-input {
      width: 100%;
      padding: 13px 16px;
      background: rgba(15, 23, 42, 0.95) !important;
      border: 1.5px solid rgba(255, 255, 255, 0.25) !important;
      border-radius: 14px;
      font-size: 0.95rem;
      font-family: inherit;
      color: #ffffff !important;
      transition: all 0.2s ease;
      outline: none;
    }
    .form-input::placeholder {
      color: #94a3b8 !important;
      font-weight: 400;
    }
    .form-input:focus {
      border-color: #10b981 !important;
      background: #0f172a !important;
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.25) !important;
    }

    .error-banner {
      background: rgba(127, 29, 29, 0.4);
      border: 1.5px solid #ef4444;
      color: #fca5a5;
      padding: 11px 14px;
      border-radius: 12px;
      font-size: 0.825rem;
      font-weight: 600;
      text-align: center;
    }

    .btn-block {
      width: 100%;
      padding: 14px 20px;
      font-size: 1rem;
      border-radius: 14px;
    }

    .auth-footer {
      text-align: center;
      margin-top: 22px;
      font-size: 0.875rem;
      color: #cbd5e1;
      font-weight: 500;
    }

    .auth-footer a {
      color: #10b981;
      font-weight: 800;
      cursor: pointer;
      text-decoration: none;
      border-bottom: 1.5px dashed rgba(16, 185, 129, 0.5);
      transition: all 0.2s ease;
      padding-bottom: 1px;
    }

    .auth-footer a:hover {
      color: #34d399;
      border-bottom-color: #34d399;
    }

    .btn-primary:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  isRegisterMode = false;
  username = '';
  password = '';
  fullName = '';
  email = '';
  isLoading = false;
  errorMessage = '';

  onSubmit(): void {
    this.errorMessage = '';
    this.isLoading = true;

    if (this.isRegisterMode) {
      this.authService.register({
        username: this.username,
        password: this.password,
        fullName: this.fullName,
        email: this.email,
        role: 'CUSTOMER'
      }).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/customer']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Registration failed';
        }
      });
    } else {
      this.authService.login({ username: this.username, password: this.password }).subscribe({
        next: (res) => {
          this.isLoading = false;
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          } else if (res.role === 'ADMIN') {
            this.router.navigate(['/admin']);
          } else if (res.role === 'STAFF') {
            this.router.navigate(['/staff']);
          } else {
            this.router.navigate(['/customer']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Invalid username or password';
        }
      });
    }
  }

  quickLogin(role: Role): void {
    this.isLoading = true;
    this.authService.quickDemoLogin(role).subscribe({
      next: () => {
        this.isLoading = false;
        if (role === 'ADMIN') this.router.navigate(['/admin']);
        else if (role === 'STAFF') this.router.navigate(['/staff']);
        else this.router.navigate(['/customer']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Demo login failed';
      }
    });
  }
}