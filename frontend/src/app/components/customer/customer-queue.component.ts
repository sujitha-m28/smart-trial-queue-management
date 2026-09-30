import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { QueueService } from '../../services/queue.service';
import { WebSocketService } from '../../services/websocket.service';
import { AudioNotificationService } from '../../services/audio.service';
import { AiChatService } from '../../services/ai-chat.service';
import { AuthService } from '../../services/auth.service';
import { JoinQueueRequest, QueueTicket, ServiceType, Store } from '../../models/queue.models';
import { AiAssistantDrawerComponent } from './ai-assistant-drawer.component';

@Component({
  selector: 'app-customer-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, AiAssistantDrawerComponent],
  template: `
    <div class="customer-container">
      <!-- Top Store Banner & QR Code Switcher -->
      <div class="store-banner glass-card">
        <div class="store-info">
          <div class="store-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
            <span>Retail Trial Room Queue</span>
          </div>
          <h1 class="store-title">{{ selectedStore()?.name || 'Grand Central Flagship' }}</h1>
          <p class="store-meta">{{ selectedStore()?.location }} &bull; Open Today: {{ selectedStore()?.openingHours }}</p>
        </div>

        <div class="store-switch">
          <div class="live-clock-badge">
            <span class="clock-time mono-font">{{ currentTime() }}</span>
          </div>
          <label class="switch-label">Select Store:</label>
          <select class="store-select" [ngModel]="selectedStore()?.id" (ngModelChange)="onStoreChange($event)">
            <option *ngFor="let s of stores()" [value]="s.id">{{ s.name }} ({{ s.location }})</option>
          </select>
        </div>
      </div>

      <!-- Main Content Area: Active Queue OR Join Queue -->
      <div class="main-content">
        
        <!-- CASE 1: ACTIVE DIGITAL TICKET -->
        <div *ngIf="queueService.activeTicket() as ticket; else joinFormTpl" class="ticket-view-wrapper">
          
          <!-- Turn Alert Banner if CALLED -->
          <div *ngIf="ticket.status === 'CALLED'" class="turn-alert-banner animate-pulse">
            <div class="turn-alert-content">
              <h2>YOUR TURN TO ENTER</h2>
              <p>Please proceed to <strong>{{ ticket.assignedRoomNumber || 'Trial Room 02' }}</strong>. Your fitting room is ready.</p>
            </div>
            <button class="btn btn-success" (click)="aiService.openChat()">Attendant Assistance</button>
          </div>

          <!-- In-Service Banner -->
          <div *ngIf="ticket.status === 'IN_SERVICE'" class="in-service-banner">
            <div>
              <h3>Fitting in Progress — {{ ticket.assignedRoomNumber || 'Trial Room' }}</h3>
              <p>Need another size or assistance? Tap the AI Assistant below to notify staff.</p>
            </div>
          </div>

          <!-- The Digital Queue Token Card (Matching User Specification) -->
          <div class="queue-card glass-card">
            <div class="queue-card-header">
              <span class="card-title">SMART TRIAL ROOM</span>
              <span class="badge" [ngClass]="'badge-' + ticket.status.toLowerCase()">{{ ticket.status }}</span>
            </div>

            <div class="queue-card-body">
              <!-- Token Display -->
              <div class="token-section">
                <span class="token-label">Your Token</span>
                <h1 class="token-value mono-font">{{ ticket.tokenNumber }}</h1>
                <span class="service-pill">{{ ticket.serviceTypeName || 'Standard Fitting' }} &bull; {{ ticket.garmentCount }} Garments</span>
              </div>

              <div class="divider"></div>

              <!-- Real-time Queue Stats Grid -->
              <div class="stats-grid">
                <div class="stat-box">
                  <span class="stat-label">People Ahead</span>
                  <span class="stat-value text-accent">{{ ticket.peopleAhead !== undefined ? ticket.peopleAhead : 3 }}</span>
                </div>
                <div class="stat-box">
                  <span class="stat-label">Estimated Wait</span>
                  <span class="stat-value text-primary">{{ ticket.estimatedWaitMinutes || 12 }} <small>min</small></span>
                </div>
              </div>

              <!-- Now Serving Indicator -->
              <div class="now-serving-box">
                <div class="now-serving-left">
                  <span class="now-serving-label">Now Serving:</span>
                  <span class="now-serving-value mono-font">{{ ticket.currentlyServingToken || 'MS-039' }}</span>
                </div>
                <div class="live-pulse-wrapper">
                  <span class="pulse-dot"></span>
                  <span class="live-tag">Live Feed</span>
                </div>
              </div>

              <!-- Position Indicator -->
              <div class="position-banner">
                <span>Your position: <strong>{{ (ticket.peopleAhead !== undefined ? ticket.peopleAhead : 3) + 1 }}</strong></span>
              </div>

              <div class="divider"></div>

              <!-- Customer Info Preview -->
              <div class="customer-preview">
                <span>Guest: <strong>{{ ticket.customerName }}</strong></span>
                <span *ngIf="ticket.assignedRoomNumber" class="text-accent">Room: <strong>{{ ticket.assignedRoomNumber }}</strong></span>
              </div>

              <!-- Actions -->
              <div class="card-actions">
                <button
                  *ngIf="ticket.status === 'WAITING' || ticket.status === 'CALLED'"
                  class="btn btn-danger btn-block"
                  (click)="cancelQueue(ticket.id)"
                  [disabled]="isCancelling"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  Cancel Queue Token
                </button>

                <button class="btn btn-secondary btn-block" (click)="aiService.openChat()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Chat with Attendant
                </button>
              </div>
            </div>
          </div>

          <!-- Feedback Card if Completed -->
          <div *ngIf="ticket.status === 'COMPLETED'" class="feedback-card glass-card">
            <div class="feedback-header">
              <h2>Fitting Complete — How was your service?</h2>
              <p>Your feedback helps us optimize trial room operations and queue efficiency.</p>
            </div>

            <div *ngIf="!feedbackSubmitted; else feedbackDoneTpl" class="feedback-form">
              <!-- Star Rating -->
              <div class="rating-stars">
                <button
                  *ngFor="let star of [1, 2, 3, 4, 5]"
                  class="star-btn"
                  [class.filled]="star <= feedbackRating"
                  (click)="feedbackRating = star"
                >
                  ★
                </button>
                <span class="rating-text">{{ getRatingLabel(feedbackRating) }}</span>
              </div>

              <div class="rating-criteria-grid">
                <div class="criteria-item">
                  <span>Wait Speed</span>
                  <div class="mini-stars">
                    <span *ngFor="let s of [1,2,3,4,5]" (click)="feedbackWait = s" [class.active]="s <= feedbackWait">★</span>
                  </div>
                </div>
                <div class="criteria-item">
                  <span>Staff Helpfulness</span>
                  <div class="mini-stars">
                    <span *ngFor="let s of [1,2,3,4,5]" (click)="feedbackStaff = s" [class.active]="s <= feedbackStaff">★</span>
                  </div>
                </div>
                <div class="criteria-item">
                  <span>Room Cleanliness</span>
                  <div class="mini-stars">
                    <span *ngFor="let s of [1,2,3,4,5]" (click)="feedbackClean = s" [class.active]="s <= feedbackClean">★</span>
                  </div>
                </div>
              </div>

              <textarea
                class="feedback-textarea"
                placeholder="Additional feedback or suggestions (Optional)"
                [(ngModel)]="feedbackComment"
                rows="3"
              ></textarea>

              <div class="feedback-actions">
                <button class="btn btn-primary btn-block" (click)="submitFeedback(ticket.id)">
                  Submit Feedback
                </button>
                <button class="btn btn-secondary btn-block" (click)="queueService.clearActiveTicket()">
                  Join New Queue
                </button>
              </div>
            </div>

            <ng-template #feedbackDoneTpl>
              <div class="feedback-done">
                <div class="done-icon">✓</div>
                <h3>Thank you for your feedback!</h3>
                <p>Enjoy your shopping experience at {{ ticket.storeName || 'our store' }}.</p>
                <button class="btn btn-primary" (click)="queueService.clearActiveTicket()">Join Another Queue</button>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- CASE 2: JOIN QUEUE FORM -->
        <ng-template #joinFormTpl>
          <div class="join-card glass-card">
            <div class="join-header">
              <div class="join-badge">Digital Queue Entry</div>
              <h2 class="join-title">Join Trial Room Queue</h2>
              <p class="join-subtitle">Skip the physical line. Receive live status updates and room notifications directly on your screen.</p>
            </div>

            <!-- Service Type Selector -->
            <div class="form-section">
              <label class="section-label">Select Fitting Preference:</label>
              <div class="service-type-grid">
                <div
                  *ngFor="let st of serviceTypes()"
                  class="service-card"
                  [class.selected]="selectedServiceType()?.id === st.id"
                  (click)="selectedServiceType.set(st)"
                >
                  <div class="st-header">
                    <span class="st-name">{{ st.name }}</span>
                    <span *ngIf="st.code === 'EXPRESS'" class="badge badge-express">Fastest</span>
                    <span *ngIf="st.code === 'VIP'" class="badge badge-vip">VIP</span>
                  </div>
                  <p class="st-desc">{{ st.description }}</p>
                  <div class="st-meta">
                    <span>Max {{ st.maxItems }} items</span>
                    <span>~{{ st.avgServiceMinutes }} min avg</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Garment Count Selector with Dynamic Calculation -->
            <div class="form-section">
              <div class="section-label-row">
                <label class="section-label">Number of Garments to Try:</label>
                <span class="garment-count-badge">{{ garmentCount }} items</span>
              </div>
              
              <div class="garment-stepper">
                <button class="step-btn" (click)="adjustGarments(-1)" [disabled]="garmentCount <= 1">-</button>
                <div class="garment-dots">
                  <span *ngFor="let i of [1,2,3,4,5,6]" class="g-dot" [class.filled]="i <= garmentCount" (click)="garmentCount = i">
                    {{ i }}
                  </span>
                </div>
                <button class="step-btn" (click)="adjustGarments(1)" [disabled]="garmentCount >= (selectedServiceType()?.maxItems || 6)">+</button>
              </div>

              <!-- Live Wait Estimation Preview -->
              <div class="wait-preview-box">
                <div class="preview-text">
                  <span>Intelligent Estimated Wait:</span>
                  <strong>~{{ calculatePreviewWait() }} minutes</strong>
                </div>
                <div class="preview-sub">Based on {{ garmentCount }} garments & current trial room turnover</div>
              </div>
            </div>

            <!-- Customer Details -->
            <div class="form-section">
              <label class="section-label">Your Details:</label>
              <div class="input-grid">
                <div class="input-group">
                  <label>Full Name *</label>
                  <input type="text" class="form-input" [(ngModel)]="customerName" required />
                </div>
                <div class="input-group">
                  <label>Mobile Number (10-Digit Indian Number)</label>
                  <div class="phone-input-wrapper">
                    <span class="phone-prefix">+91</span>
                    <input
                      type="tel"
                      class="form-input phone-input"
                      [class.invalid-input]="customerPhone.length > 0 && !isValidIndianPhone()"
                      [class.valid-input]="isValidIndianPhone()"
                      [(ngModel)]="customerPhone"
                      maxlength="10"
                    />
                  </div>
                  <span *ngIf="customerPhone.length > 0 && !isValidIndianPhone()" class="validation-hint error">
                    Must be a valid 10-digit Indian mobile number (starts with 6-9)
                  </span>
                  <span *ngIf="isValidIndianPhone()" class="validation-hint success">
                    ✓ Valid Indian Mobile Number
                  </span>
                </div>
              </div>
            </div>

            <!-- VIP Fast-Track Toggle -->
            <div class="vip-toggle-row">
              <label class="toggle-container">
                <input type="checkbox" [(ngModel)]="isVipMember" />
                <span class="toggle-slider"></span>
              </label>
              <div class="vip-label-box">
                <strong>Store VIP / Loyalty Member</strong>
                <span>Prioritizes trial room allocation and gives VIP lounge access</span>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              class="btn btn-primary btn-block btn-lg"
              [disabled]="!customerName.trim() || (customerPhone.trim().length > 0 && !isValidIndianPhone()) || isJoining"
              (click)="joinQueue()"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              {{ isJoining ? 'Generating Digital Token...' : 'Get Digital Token & Join Queue' }}
            </button>
          </div>
        </ng-template>

      </div>

      <!-- AI Assistant Drawer Component -->
      <app-ai-assistant-drawer></app-ai-assistant-drawer>
    </div>
  `,
  styles: [`
    .customer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 20px 80px;
    }
    .store-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      margin-bottom: 24px;
      gap: 20px;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .store-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #38bdf8;
      font-size: 0.8rem;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .store-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #f8fafc;
    }
    .store-meta {
      font-size: 0.825rem;
      color: #94a3b8;
      font-weight: 500;
    }
    .store-switch {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }
    .live-clock-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.9rem;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .switch-label {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 700;
    }
    .store-select {
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #f8fafc;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      outline: none;
    }
    
    /* Turn Alert Banner */
    .turn-alert-banner {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 95, 70, 0.4));
      border: 2px solid #10b981;
      border-radius: var(--radius-lg);
      padding: 20px 24px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.35);
    }
    .turn-alert-icon {
      font-size: 2rem;
    }
    .turn-alert-content h2 {
      font-size: 1.3rem;
      font-weight: 800;
      color: #34d399;
    }
    .turn-alert-content p {
      font-size: 0.9rem;
      color: #e2e8f0;
    }
    .in-service-banner {
      background: rgba(79, 70, 229, 0.2);
      border: 1px solid rgba(79, 70, 229, 0.4);
      border-radius: var(--radius-lg);
      padding: 16px 20px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    /* Queue Card */
    .queue-card {
      padding: 32px;
      border: 1px solid rgba(244, 114, 182, 0.4);
      box-shadow: 0 20px 50px rgba(236, 72, 153, 0.12);
      margin-bottom: 24px;
      background: rgba(255, 255, 255, 0.92);
    }
    .queue-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .card-title {
      font-size: 0.95rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #9d174d;
    }
    .token-section {
      text-align: center;
      padding: 10px 0;
    }
    .token-label {
      font-size: 0.85rem;
      color: #831843;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .token-value {
      font-size: 4.2rem;
      font-weight: 900;
      letter-spacing: 0.05em;
      background: linear-gradient(135deg, #db2777, #9d174d);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.1;
      margin: 8px 0;
    }
    .service-pill {
      display: inline-block;
      background: #fce7f3;
      padding: 4px 14px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #be185d;
      border: 1px solid #fbcfe8;
    }
    .divider {
      height: 1px;
      background: #fbcfe8;
      margin: 20px 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .stat-box {
      background: #fdf2f8;
      border: 1px solid #fbcfe8;
      border-radius: var(--radius-md);
      padding: 16px;
      text-align: center;
    }
    .stat-label {
      display: block;
      font-size: 0.8rem;
      color: #9d174d;
      margin-bottom: 4px;
      font-weight: 700;
    }
    .stat-value {
      font-size: 2.2rem;
      font-weight: 800;
      color: #4a044e;
    }
    .stat-value small {
      font-size: 1rem;
      font-weight: 600;
      color: #831843;
    }
    .text-accent { color: #fbbf24; }
    .text-primary { color: #818cf8; }

    /* Progress bar */
    .queue-progress-bar {
      margin: 20px 0;
    }
    .progress-track {
      height: 8px;
      background: var(--bg-subtle);
      border-radius: 9999px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4f46e5, #10b981);
      transition: width 0.5s ease;
    }
    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.725rem;
      color: var(--text-dim);
      font-weight: 600;
    }

    /* Now Serving */
    .now-serving-box {
      background: rgba(79, 70, 229, 0.12);
      border: 1px solid rgba(79, 70, 229, 0.3);
      border-radius: var(--radius-md);
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .now-serving-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-right: 8px;
    }
    .now-serving-value {
      font-size: 1.3rem;
      font-weight: 800;
      color: #38bdf8;
    }
    .position-banner {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: var(--radius-md);
      padding: 12px 18px;
      margin-top: 14px;
      font-size: 0.95rem;
      font-weight: 600;
      color: #34d399;
      display: flex;
      align-items: center;
    }
    .position-banner strong {
      font-size: 1.2rem;
      font-weight: 800;
      color: white;
      margin-left: 6px;
    }
    .live-pulse-wrapper {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .live-tag {
      font-size: 0.725rem;
      color: #34d399;
      font-weight: 700;
      text-transform: uppercase;
    }
    .customer-preview {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 24px;
    }
    .card-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .btn-block {
      width: 100%;
    }

    /* Feedback Card */
    .feedback-card {
      padding: 28px;
      margin-top: 24px;
    }
    .feedback-header h2 {
      font-size: 1.25rem;
      font-weight: 800;
      color: white;
    }
    .feedback-header p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .rating-stars {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 20px 0;
    }
    .star-btn {
      background: transparent;
      border: none;
      font-size: 2.2rem;
      color: #475569;
      cursor: pointer;
      transition: transform 0.15s, color 0.15s;
    }
    .star-btn.filled {
      color: #fbbf24;
      text-shadow: 0 0 12px rgba(251, 191, 36, 0.4);
    }
    .star-btn:hover {
      transform: scale(1.15);
    }
    .rating-text {
      font-size: 0.95rem;
      font-weight: 700;
      color: #f8fafc;
      margin-left: 10px;
    }
    .rating-criteria-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .criteria-item {
      background: rgba(15, 23, 42, 0.6);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.8rem;
    }
    .mini-stars span {
      font-size: 1.2rem;
      color: #475569;
      cursor: pointer;
      margin-right: 3px;
    }
    .mini-stars span.active {
      color: #fbbf24;
    }
    .feedback-textarea {
      width: 100%;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-sm);
      padding: 12px;
      color: white;
      font-size: 0.875rem;
      margin-bottom: 16px;
      resize: vertical;
      outline: none;
    }
    .feedback-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .feedback-done {
      text-align: center;
      padding: 24px;
    }
    .done-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #10b981;
      color: white;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    /* Join Form Card */
    .join-card {
      padding: 36px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(15, 23, 42, 0.75);
      border-radius: var(--radius-lg);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
    }
    .join-badge {
      display: inline-block;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .join-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #f8fafc;
    }
    .join-subtitle {
      font-size: 0.9rem;
      color: #94a3b8;
      margin-top: 4px;
      margin-bottom: 24px;
      font-weight: 500;
    }
    .form-section {
      margin-bottom: 24px;
    }
    .section-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 800;
      color: #f8fafc;
      margin-bottom: 10px;
    }
    .section-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .garment-count-badge {
      background: #4f46e5;
      color: white;
      font-size: 0.8rem;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 9999px;
    }
    .service-type-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }
    .service-card {
      background: rgba(30, 41, 59, 0.7);
      border: 1.5px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-md);
      padding: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .service-card:hover {
      border-color: rgba(99, 102, 241, 0.5);
      background: rgba(30, 41, 59, 0.95);
    }
    .service-card.selected {
      border-color: #6366f1;
      background: rgba(79, 70, 229, 0.25);
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
    }
    .st-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .st-name {
      font-weight: 800;
      font-size: 0.95rem;
      color: #f8fafc;
    }
    .st-desc {
      font-size: 0.78rem;
      color: #94a3b8;
      line-height: 1.35;
      margin-bottom: 10px;
      font-weight: 500;
    }
    .st-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.725rem;
      color: #cbd5e1;
      font-weight: 700;
    }
    .garment-stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(30, 41, 59, 0.7);
      border: 1.5px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-md);
      padding: 10px 16px;
      margin-bottom: 14px;
    }
    .step-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.8);
      color: #f8fafc;
      border: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 1.2rem;
      font-weight: 800;
      cursor: pointer;
    }
    .step-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .garment-dots {
      display: flex;
      gap: 10px;
    }
    .g-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 800;
      color: #94a3b8;
      background: rgba(15, 23, 42, 0.6);
      cursor: pointer;
      transition: all 0.15s;
    }
    .g-dot.filled {
      background: #4f46e5;
      border-color: #6366f1;
      color: white;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
    }
    .wait-preview-box {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .preview-text {
      flex: 1;
      display: flex;
      align-items: baseline;
      gap: 8px;
      font-size: 0.885rem;
      color: #cbd5e1;
      font-weight: 600;
    }
    .preview-text strong {
      color: #818cf8;
      font-size: 1.05rem;
      font-weight: 800;
    }
    .preview-sub {
      font-size: 0.72rem;
      color: #94a3b8;
      font-weight: 600;
    }
    .input-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .input-group label {
      display: block;
      font-size: 0.825rem;
      color: #cbd5e1;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .phone-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .phone-prefix {
      position: absolute;
      left: 14px;
      font-weight: 700;
      font-size: 0.95rem;
      color: #94a3b8;
      pointer-events: none;
      z-index: 2;
    }
    .phone-input-wrapper .form-input {
      padding-left: 48px !important;
    }
    .form-input {
      width: 100%;
      background: rgba(30, 41, 59, 0.8);
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-md);
      padding: 11px 16px;
      color: #f8fafc;
      font-size: 0.95rem;
      font-weight: 600;
      outline: none;
      transition: all 0.2s ease;
    }
    .form-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.25);
    }
    .vip-toggle-row {
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(234, 179, 8, 0.12);
      border: 1px solid rgba(234, 179, 8, 0.3);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      margin-bottom: 24px;
    }
    .toggle-container {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }
    .toggle-container input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background-color: rgba(255, 255, 255, 0.2);
      transition: .3s;
      border-radius: 24px;
    }
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }
    input:checked + .toggle-slider {
      background-color: #eab308;
    }
    input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }
    .vip-label-box {
      display: flex;
      flex-direction: column;
    }
    .vip-label-box strong {
      font-size: 0.885rem;
      color: #fef08a;
    }
    .vip-label-box span {
      font-size: 0.75rem;
      color: #fef9c3;
    }
    .btn-lg {
      padding: 14px 24px;
      font-size: 1.05rem;
    }
    @media (max-width: 640px) {
      .card-actions, .input-grid, .feedback-actions, .stats-grid {
        grid-template-columns: 1fr;
      }
      .token-value {
        font-size: 3.2rem;
      }
    }
  `]
})
export class CustomerQueueComponent implements OnInit, OnDestroy {
  queueService = inject(QueueService);
  wsService = inject(WebSocketService);
  audioService = inject(AudioNotificationService);
  aiService = inject(AiChatService);
  authService = inject(AuthService);

  stores = signal<Store[]>([
    {
      id: 1,
      code: 'STR-NYC-01',
      name: 'Grand Central Flagship',
      location: 'New York, NY',
      address: '450 Lexington Ave, New York, NY 10017',
      contactPhone: '+1 (212) 555-0199',
      openingHours: '09:00 - 22:00',
      totalRooms: 6,
      active: true,
      currentWaiting: 4,
      currentServing: 2,
      avgRating: 5.0
    }
  ]);
  selectedStore = signal<Store | null>({
    id: 1,
    code: 'STR-NYC-01',
    name: 'Grand Central Flagship',
    location: 'New York, NY',
    address: '450 Lexington Ave, New York, NY 10017',
    contactPhone: '+1 (212) 555-0199',
    openingHours: '09:00 - 22:00',
    totalRooms: 6,
    active: true
  });
  serviceTypes = signal<ServiceType[]>([
    { id: 1, code: 'REGULAR', name: 'Standard Trial Room', description: 'Standard fitting room for up to 6 garments', maxItems: 6, avgServiceMinutes: 8, priorityLevel: 1, active: true },
    { id: 2, code: 'EXPRESS', name: 'Express Fitting (<= 2 Items)', description: 'Priority fast-track queue for 1 or 2 garments only', maxItems: 2, avgServiceMinutes: 4, priorityLevel: 2, active: true },
    { id: 3, code: 'VIP', name: 'VIP Styling Lounge', description: 'Luxury fitting suite with dedicated stylist assistance', maxItems: 10, avgServiceMinutes: 15, priorityLevel: 3, active: true },
    { id: 4, code: 'ACCESSIBLE', name: 'Accessible & Family Room', description: 'Spacious fitting room with wheelchair access', maxItems: 6, avgServiceMinutes: 10, priorityLevel: 1, active: true }
  ]);
  selectedServiceType = signal<ServiceType | null>({
    id: 1, code: 'REGULAR', name: 'Standard Trial Room', description: 'Standard fitting room for up to 6 garments', maxItems: 6, avgServiceMinutes: 8, priorityLevel: 1, active: true
  });

  customerName = '';
  customerPhone = '';
  customerEmail = '';
  garmentCount = 3;
  isVipMember = false;

  isJoining = false;
  isCancelling = false;

  feedbackRating = 5;
  feedbackWait = 5;
  feedbackStaff = 5;
  feedbackClean = 5;
  feedbackComment = '';
  feedbackSubmitted = false;

  currentTime = signal<string>(new Date().toLocaleTimeString());

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.loadStoresAndServices();
    this.initWebSocketSubscription();
    
    // Live clock update
    const clockSub = interval(1000).subscribe(() => {
      this.currentTime.set(new Date().toLocaleTimeString());
    });
    this.subs.push(clockSub);

    // Auto-populate customer profile if logged in
    const user = this.authService.currentUser();
    if (user) {
      this.customerName = user.fullName || user.username;
      this.customerPhone = user.phone || '';
      this.customerEmail = user.email || '';
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  loadStoresAndServices(): void {
    this.queueService.getStores().subscribe(stores => {
      this.stores.set(stores);
      if (stores.length > 0) {
        this.selectedStore.set(stores[0]);
      }
    });

    this.queueService.getServiceTypes().subscribe(types => {
      this.serviceTypes.set(types);
      if (types.length > 0) {
        this.selectedServiceType.set(types[0]);
      }
    });
  }

  onStoreChange(storeId: number): void {
    const store = this.stores().find(s => s.id === Number(storeId));
    if (store) {
      this.selectedStore.set(store);
    }
  }

  adjustGarments(delta: number): void {
    const max = this.selectedServiceType()?.maxItems || 6;
    const next = this.garmentCount + delta;
    if (next >= 1 && next <= max) {
      this.garmentCount = next;
    }
  }

  calculatePreviewWait(): number {
    const base = Math.max(this.garmentCount * 2.2, 4);
    return Math.round(base);
  }

  isValidIndianPhone(): boolean {
    const cleaned = this.customerPhone.trim().replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(cleaned);
  }

  joinQueue(): void {
    const store = this.selectedStore();
    if (!store || !this.customerName.trim()) return;

    this.isJoining = true;
    const req: JoinQueueRequest = {
      storeId: store.id,
      serviceTypeId: this.selectedServiceType()?.id,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerEmail: this.customerEmail,
      garmentCount: this.garmentCount,
      vip: this.isVipMember
    };

    this.queueService.joinQueue(req).subscribe({
      next: (ticket) => {
        this.isJoining = false;
        this.audioService.playApproachingChime();
      },
      error: (err) => {
        this.isJoining = false;
        alert('Could not join queue: ' + (err.error?.message || err.message));
      }
    });
  }

  cancelQueue(ticketId: number): void {
    if (confirm('Are you sure you want to cancel your spot in the trial room queue?')) {
      this.isCancelling = true;
      this.queueService.cancelTicket(ticketId, 'Customer voluntarily left queue').subscribe({
        next: () => {
          this.isCancelling = false;
        },
        error: () => {
          this.isCancelling = false;
        }
      });
    }
  }

  submitFeedback(ticketId: number): void {
    const req = {
      queueTicketId: ticketId,
      rating: this.feedbackRating,
      waitTimeSatisfaction: this.feedbackWait,
      staffHelpfulness: this.feedbackStaff,
      roomCleanliness: this.feedbackClean,
      comment: this.feedbackComment
    };

    this.queueService.submitFeedback(req).subscribe({
      next: () => {
        this.feedbackSubmitted = true;
      }
    });
  }

  getRatingLabel(r: number): string {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent! ⭐'];
    return labels[r] || 'Good';
  }

  getProgressPercentage(ticket: QueueTicket): number {
    if (ticket.status === 'IN_SERVICE') return 100;
    if (ticket.status === 'CALLED') return 90;
    if (ticket.peopleAhead === 0) return 75;
    if (ticket.peopleAhead === 1) return 55;
    if (ticket.peopleAhead === 2) return 35;
    return 20;
  }

  private initWebSocketSubscription(): void {
    // Listen for personal ticket updates
    const token = this.queueService.activeTokenNumber();
    if (token) {
      const ticketSub = this.wsService.subscribeToTopic<QueueTicket>(`/topic/ticket/${token}`).subscribe(ticket => {
        if (ticket.status === 'CALLED') {
          this.audioService.playTurnBell();
        }
        this.queueService.activeTicket.set(ticket);
      });
      this.subs.push(ticketSub);
    }
  }
}
