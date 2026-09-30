import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { QueueService } from '../../services/queue.service';
import { WebSocketService } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { JoinQueueRequest, QueueSummary, QueueTicket, RoomCard, Store } from '../../models/queue.models';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="staff-container">
      <!-- Staff Top Header -->
      <div class="staff-header glass-card">
        <div class="header-left">
          <div class="staff-badge">
            <span class="badge badge-serving">STAFF CONTROL DESK</span>
            <span class="shift-time">Shift Active &bull; Store: <strong>{{ currentStore()?.name || 'Grand Central Flagship' }}</strong></span>
          </div>
          <h1 class="header-title">Trial Room Attendant Terminal</h1>
        </div>

        <div class="header-right">
          <div class="live-clock-badge">
            <span class="clock-time mono-font">{{ currentTime() }}</span>
          </div>
          <button class="btn btn-primary btn-sm" (click)="showWalkInModal = true">
            Issue Walk-In Token
          </button>
          <div class="store-selector-box">
            <label>Store Location:</label>
            <select class="store-dropdown" [ngModel]="currentStore()?.id" (ngModelChange)="onStoreChange($event)">
              <option *ngFor="let s of stores()" [value]="s.id">{{ s.name }} ({{ s.code }})</option>
            </select>
          </div>
          <button class="btn btn-secondary btn-sm" (click)="loadQueueSummary()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            Refresh Feed
          </button>
        </div>
      </div>

      <!-- Quick Shift Metric Badges -->
      <div class="shift-stats-grid">
        <div class="stat-card glass-card">
          <span class="stat-label">Currently Serving</span>
          <span class="stat-value text-accent mono-font">{{ summary()?.nowServingToken || 'None' }}</span>
          <span class="stat-sub">{{ summary()?.servingCount || 0 }} room(s) occupied</span>
        </div>
        <div class="stat-card glass-card">
          <span class="stat-label">Waiting in Queue</span>
          <span class="stat-value text-primary mono-font">{{ summary()?.waitingCount || 0 }}</span>
          <span class="stat-sub">~{{ summary()?.estimatedWaitMinutes || 0 }} min est. wait</span>
        </div>
        <div class="stat-card glass-card">
          <span class="stat-label">Up Next</span>
          <span class="stat-value text-info mono-font">{{ summary()?.nextToken || 'None' }}</span>
          <span class="stat-sub">Highest priority in line</span>
        </div>
        <div class="stat-card glass-card">
          <span class="stat-label">Served Today</span>
          <span class="stat-value text-success mono-font">{{ summary()?.completedToday || 0 }}</span>
          <span class="stat-sub">Completed customer fittings</span>
        </div>
      </div>

      <div class="dashboard-layout">
        
        <!-- LEFT COLUMN: PRIMARY STAFF QUEUE CONTROLLER (Exact user layout) -->
        <div class="controller-column">
          <div class="staff-controller-card glass-card">
            <div class="controller-header">
              <div class="controller-title-row">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
                <h2>STAFF DASHBOARD</h2>
              </div>
              <span class="live-indicator"><span class="pulse-dot"></span> Live Queue</span>
            </div>

            <!-- Dashboard Display Stats -->
            <div class="controller-display">
              <div class="display-row">
                <span class="d-label">Now Serving:</span>
                <span class="d-val text-accent mono-font">{{ summary()?.nowServingToken || 'None' }}</span>
              </div>
              <div class="display-row">
                <span class="d-label">Waiting:</span>
                <span class="d-val text-primary mono-font">{{ summary()?.waitingCount || 0 }}</span>
              </div>
              <div class="display-row">
                <span class="d-label">Next:</span>
                <span class="d-val text-info mono-font">{{ summary()?.nextToken || 'None' }}</span>
              </div>
            </div>

            <!-- Primary Action Buttons -->
            <div class="controller-actions">
              <!-- CALL NEXT -->
              <button
                class="btn btn-call-next btn-block"
                (click)="callNextCustomer()"
                [disabled]="isBusy || (summary()?.waitingCount === 0)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                CALL NEXT
              </button>

              <!-- START SERVICE & COMPLETE -->
              <div class="action-btn-row">
                <button
                  class="btn btn-start-service"
                  (click)="startFirstCalledService()"
                  [disabled]="isBusy || !hasCalledTicket()"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  START SERVICE
                </button>

                <button
                  class="btn btn-complete-service"
                  (click)="completeActiveService()"
                  [disabled]="isBusy || !hasServingTicket()"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  COMPLETE
                </button>
              </div>

              <!-- SKIP, RECALL, NO-SHOW -->
              <div class="secondary-btn-row">
                <button class="btn btn-skip" (click)="skipActiveTicket()" [disabled]="isBusy || !hasActiveTicket()">
                  SKIP
                </button>
                <button class="btn btn-recall" (click)="recallTicketPrompt()" [disabled]="isBusy">
                  RECALL
                </button>
                <button class="btn btn-noshow" (click)="markNoShowActive()" [disabled]="isBusy || !hasActiveTicket()">
                  NO-SHOW
                </button>
              </div>
            </div>

            <!-- Specific Token Call Bar -->
            <div class="manual-call-box">
              <label>Call Specific Token Number:</label>
              <div class="manual-call-input-group">
                <input
                  type="text"
                  class="manual-input mono-font"
                  placeholder="e.g. TR-042"
                  [(ngModel)]="specificTokenInput"
                  (keyup.enter)="callSpecificToken()"
                />
                <button class="btn btn-primary btn-sm" (click)="callSpecificToken()" [disabled]="!specificTokenInput.trim() || isBusy">
                  Call Token
                </button>
              </div>
            </div>
          </div>

          <!-- Active Trial Rooms Grid -->
          <div class="trial-rooms-section glass-card">
            <div class="section-title-row">
              <h3>Trial Rooms Status ({{ summary()?.rooms?.length || 0 }} Rooms)</h3>
              <span class="text-muted text-sm">Real-time room occupancy</span>
            </div>

            <div class="room-cards-grid">
              <div
                *ngFor="let room of summary()?.rooms"
                class="room-card"
                [ngClass]="'room-' + room.status.toLowerCase()"
              >
                <div class="room-card-header">
                  <span class="room-num">{{ room.roomNumber }}</span>
                  <span class="badge" [ngClass]="'badge-' + (room.status === 'OCCUPIED' ? 'serving' : (room.status === 'AVAILABLE' ? 'completed' : 'waiting'))">
                    {{ room.status }}
                  </span>
                </div>

                <div class="room-card-body">
                  <div *ngIf="room.currentTokenNumber; else roomEmptyTpl">
                    <div class="room-token mono-font">{{ room.currentTokenNumber }}</div>
                    <div class="room-guest">{{ room.customerName || 'Customer' }} &bull; {{ room.garmentCount || 3 }} items</div>
                    <div class="room-timer" *ngIf="room.serviceStartedAt">
                      ⏱️ Fitting: <strong>{{ room.elapsedMinutes || 0 }}m</strong>
                    </div>
                  </div>
                  <ng-template #roomEmptyTpl>
                    <div class="room-empty-label">Ready for Next Customer</div>
                  </ng-template>
                </div>

                <div class="room-card-actions">
                  <button
                    *ngIf="room.status === 'AVAILABLE'"
                    class="btn btn-sm btn-primary btn-block"
                    (click)="callNextCustomerToRoom(room.roomId)"
                    [disabled]="summary()?.waitingCount === 0"
                  >
                    Call to {{ room.roomNumber }}
                  </button>
                  <button
                    *ngIf="room.status === 'OCCUPIED' && room.currentTicketId"
                    class="btn btn-sm btn-success btn-block"
                    (click)="completeRoomService(room.currentTicketId)"
                  >
                    Finish Service
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: LIVE WAITING QUEUE TABLE -->
        <div class="queue-list-column">
          <div class="queue-table-card glass-card">
            <div class="table-header">
              <div>
                <h2>Live Waiting Queue ({{ summary()?.waitingList?.length || 0 }})</h2>
                <p class="text-muted text-sm">Customers waiting for trial room</p>
              </div>
              <span class="badge badge-waiting">Prioritized Order</span>
            </div>

            <div *ngIf="summary()?.waitingList && summary()!.waitingList.length > 0; else noWaitingTpl" class="table-responsive">
              <table class="queue-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Garments</th>
                    <th>Wait Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let t of summary()?.waitingList; let i = index" [class.highlight-row]="i === 0">
                    <td>
                      <span class="mono-font token-cell">{{ t.tokenNumber }}</span>
                    </td>
                    <td>
                      <div class="cust-info">
                        <strong>{{ t.customerName }}</strong>
                        <small *ngIf="t.customerPhone">{{ t.customerPhone }}</small>
                      </div>
                    </td>
                    <td>
                      <span *ngIf="t.priorityLevel > 1" class="badge" [ngClass]="t.priorityLevel === 3 ? 'badge-vip' : 'badge-express'">
                        {{ t.serviceTypeName }}
                      </span>
                      <span *ngIf="t.priorityLevel === 1" class="service-type-text">
                        {{ t.serviceTypeName }}
                      </span>
                    </td>
                    <td>
                      <span class="garment-pill">{{ t.garmentCount }} items</span>
                    </td>
                    <td>
                      <span class="wait-text">~{{ t.estimatedWaitMinutes }}m</span>
                    </td>
                    <td>
                      <button class="btn btn-primary btn-xs" (click)="callSpecificTicketDirect(t.id)">
                        Call Now
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ng-template #noWaitingTpl>
              <div class="empty-queue-box">
                <div class="empty-icon">✓</div>
                <h3>No Customers Waiting!</h3>
                <p>All trial room queues are currently clear.</p>
              </div>
            </ng-template>
          </div>
        </div>

      </div>

      <!-- ISSUE WALK-IN TOKEN MODAL -->
      <div *ngIf="showWalkInModal" class="modal-overlay">
        <div class="modal-card glass-card">
          <div class="modal-header">
            <h3>Issue Walk-In Customer Token</h3>
            <button class="btn-close" (click)="showWalkInModal = false">✕</button>
          </div>
          <p class="modal-subtitle">For customers without a mobile phone or QR scanner who arrive directly at the desk.</p>

          <form (ngSubmit)="issueWalkInToken()" class="modal-form">
            <div class="form-group">
              <label>Customer Name (Optional)</label>
              <input type="text" class="form-input" [(ngModel)]="walkInName" name="walkInName" />
            </div>

            <div class="form-group">
              <label>Customer Mobile (Optional - 10 Digit Indian Mobile)</label>
              <div class="phone-input-wrapper">
                <span class="phone-prefix">+91</span>
                <input
                  type="tel"
                  class="form-input"
                  [class.invalid-input]="walkInPhone.length > 0 && !isValidIndianPhone(walkInPhone)"
                  [class.valid-input]="isValidIndianPhone(walkInPhone)"
                  [(ngModel)]="walkInPhone"
                  name="walkInPhone"
                  maxlength="10"
                />
              </div>
              <span *ngIf="walkInPhone.length > 0 && !isValidIndianPhone(walkInPhone)" class="validation-hint error">
                Must be a valid 10-digit Indian mobile number
              </span>
            </div>

            <div class="form-group">
              <label>Number of Garments to Try</label>
              <select class="form-input" [(ngModel)]="walkInGarments" name="walkInGarments">
                <option [ngValue]="1">1 Garment</option>
                <option [ngValue]="2">2 Garments (Express)</option>
                <option [ngValue]="3">3 Garments</option>
                <option [ngValue]="4">4 Garments</option>
                <option [ngValue]="5">5 Garments</option>
                <option [ngValue]="6">6 Garments</option>
              </select>
            </div>

            <div class="form-group">
              <label>Fitting Service Type</label>
              <select class="form-input" [(ngModel)]="walkInServiceTypeId" name="walkInServiceTypeId">
                <option [ngValue]="1">Standard Trial Room</option>
                <option [ngValue]="2">Express Fitting (<= 2 Items)</option>
                <option [ngValue]="3">VIP Styling Lounge</option>
                <option [ngValue]="4">Accessible & Family Room</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="showWalkInModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="walkInPhone.trim().length > 0 && !isValidIndianPhone(walkInPhone)">
                Generate & Issue Token
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .staff-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 24px 20px 80px;
    }
    .staff-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      margin-bottom: 20px;
    }
    .staff-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }
    .shift-time {
      font-size: 0.8rem;
      color: #cbd5e1 !important;
    }
    .header-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #ffffff !important;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .live-clock-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399 !important;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.9rem;
      font-weight: 800;
    }
    .store-selector-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .store-selector-box label {
      font-size: 0.72rem;
      color: #9d174d;
      font-weight: 700;
    }
    .store-dropdown {
      background: #ffffff;
      border: 1px solid #f472b6;
      color: #4a044e;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      outline: none;
    }
    .shift-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.78rem;
      color: #831843;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .stat-value {
      font-size: 2.2rem;
      font-weight: 900;
      margin: 4px 0;
      color: #4a044e;
    }
    .stat-sub {
      font-size: 0.75rem;
      color: #9d174d;
      font-weight: 600;
    }
    .text-accent { color: #db2777; }
    .text-primary { color: #d97706; }
    .text-info { color: #9333ea; }
    .text-success { color: #059669; }

    .dashboard-layout {
      display: grid;
      grid-template-columns: 460px 1fr;
      gap: 24px;
    }

    /* Controller Card */
    .staff-controller-card {
      padding: 24px;
      margin-bottom: 24px;
      border: 2px solid #f472b6;
      box-shadow: 0 16px 40px rgba(236, 72, 153, 0.15);
      background: rgba(255, 255, 255, 0.92);
    }
    .controller-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .controller-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #be185d;
    }
    .controller-title-row h2 {
      font-size: 1.1rem;
      font-weight: 800;
      color: #4a044e;
      letter-spacing: 0.05em;
    }
    .live-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: #059669;
      font-weight: 800;
    }
    .controller-display {
      background: #fdf2f8;
      border: 1px solid #fbcfe8;
      border-radius: var(--radius-md);
      padding: 16px 20px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .display-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .d-label {
      font-size: 0.95rem;
      font-weight: 700;
      color: #831843;
    }
    .d-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: #be185d;
    }
    .controller-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }
    .btn-call-next {
      background: linear-gradient(135deg, #ec4899, #db2777);
      color: white;
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 16px;
      border-radius: var(--radius-md);
      box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
    }
    .btn-call-next:hover:not(:disabled) {
      background: linear-gradient(135deg, #db2777, #be185d);
      transform: translateY(-2px);
    }
    .action-btn-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .btn-start-service {
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      color: white;
      font-weight: 700;
      padding: 12px;
    }
    .btn-complete-service {
      background: linear-gradient(135deg, #059669, #10b981);
      color: white;
      font-weight: 700;
      padding: 12px;
    }
    .secondary-btn-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }
    .btn-skip {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
      font-weight: 700;
      font-size: 0.825rem;
    }
    .btn-recall {
      background: #f3e8ff;
      color: #7e22ce;
      border: 1px solid #d8b4fe;
      font-weight: 700;
      font-size: 0.825rem;
    }
    .btn-noshow {
      background: #ffe4e6;
      color: #e11d48;
      border: 1px solid #fecdd3;
      font-weight: 700;
      font-size: 0.825rem;
    }
    .manual-call-box {
      border-top: 1px solid #fbcfe8;
      padding-top: 16px;
    }
    .manual-call-box label {
      display: block;
      font-size: 0.78rem;
      color: #831843;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .manual-call-input-group {
      display: flex;
      gap: 8px;
    }
    .manual-input {
      flex: 1;
      background: #ffffff;
      border: 1px solid #f472b6;
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      color: #4a044e;
      font-size: 0.9rem;
      font-weight: 600;
      outline: none;
    }

    /* Trial Rooms Grid */
    .trial-rooms-section {
      padding: 20px;
    }
    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 16px;
    }
    .section-title-row h3 {
      font-size: 1.05rem;
      font-weight: 800;
      color: #4a044e;
    }
    .room-cards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .room-card {
      background: #ffffff;
      border: 1px solid #fbcfe8;
      border-radius: var(--radius-md);
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .room-occupied {
      border-color: #6ee7b7;
      background: #ecfdf5;
    }
    .room-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .room-num {
      font-weight: 800;
      font-size: 0.885rem;
      color: #4a044e;
    }
    .room-token {
      font-size: 1.4rem;
      font-weight: 800;
      color: #be185d;
    }
    .room-guest {
      font-size: 0.75rem;
      color: #831843;
      margin-top: 2px;
      font-weight: 600;
    }
    .room-timer {
      font-size: 0.75rem;
      color: #b45309;
      font-weight: 700;
      margin-top: 4px;
    }
    .room-empty-label {
      font-size: 0.78rem;
      color: #9d174d;
      font-style: italic;
      padding: 10px 0;
    }
    .room-card-actions {
      margin-top: 12px;
    }

    /* Queue Table */
    .queue-table-card {
      padding: 24px;
      background: rgba(255, 255, 255, 0.92);
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .table-header h2 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #4a044e;
    }
    .table-responsive {
      overflow-x: auto;
    }
    .queue-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .queue-table th {
      text-align: left;
      padding: 12px;
      color: #831843;
      border-bottom: 2px solid #fbcfe8;
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 800;
    }
    .queue-table td {
      padding: 14px 12px;
      border-bottom: 1px solid #fce7f3;
      color: #4a044e;
    }
    .highlight-row {
      background: #fdf2f8;
    }
    .token-cell {
      font-weight: 800;
      color: #be185d;
      font-size: 0.95rem;
    }
    .cust-info strong {
      display: block;
      color: #4a044e;
    }
    .cust-info small {
      color: #831843;
    }
    .garment-pill {
      background: #fce7f3;
      color: #be185d;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .wait-text {
      color: #b45309;
      font-weight: 700;
    }
    .service-type-text {
      font-size: 0.8rem;
      color: #831843;
      font-weight: 600;
    }
    .btn-xs {
      padding: 5px 10px;
      font-size: 0.75rem;
    }
    .empty-queue-box {
      text-align: center;
      padding: 48px 24px;
    }
    .empty-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #d1fae5;
      color: #047857;
      font-size: 1.6rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    .empty-queue-box h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: #4a044e;
    }
    .empty-queue-box p {
      font-size: 0.85rem;
      color: #831843;
      margin-top: 4px;
    }
    @media (max-width: 1024px) {
      .dashboard-layout {
        grid-template-columns: 1fr;
      }
    }

    /* Modal Overlay & Card */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(74, 4, 78, 0.4);
      backdrop-filter: blur(8px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      width: 100%;
      max-width: 480px;
      padding: 28px;
      background: #ffffff;
      border: 1.5px solid #f472b6;
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 50px rgba(236, 72, 153, 0.25);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #4a044e;
    }
    .btn-close {
      background: #fce7f3;
      border: none;
      color: #be185d;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-weight: 800;
      cursor: pointer;
    }
    .modal-subtitle {
      font-size: 0.825rem;
      color: #831843;
      margin-top: 4px;
      margin-bottom: 20px;
    }
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-group label {
      display: block;
      font-size: 0.8rem;
      color: #831843;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 10px;
    }
  `]
})
export class StaffDashboardComponent implements OnInit, OnDestroy {
  queueService = inject(QueueService);
  wsService = inject(WebSocketService);
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
      active: true
    }
  ]);
  currentStore = signal<Store | null>({
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
  summary = signal<QueueSummary | null>({
    storeId: 1,
    storeName: 'Grand Central Flagship',
    nowServingToken: 'TR-038',
    nextToken: 'TR-039',
    waitingCount: 4,
    servingCount: 2,
    completedToday: 128,
    estimatedWaitMinutes: 11,
    waitingList: [
      { id: 3, tokenNumber: 'TR-039', storeId: 1, customerName: 'Liam Johnson', customerPhone: '+1 (555) 901-2345', garmentCount: 3, status: 'WAITING', priorityLevel: 1, estimatedWaitMinutes: 3, peopleAhead: 0, serviceTypeName: 'Standard Trial Room', joinedAt: new Date().toISOString() },
      { id: 4, tokenNumber: 'VIP-008', storeId: 1, customerName: 'Alexander Wright', customerPhone: '+1 (555) 345-6789', garmentCount: 5, status: 'WAITING', priorityLevel: 3, estimatedWaitMinutes: 6, peopleAhead: 1, serviceTypeName: 'VIP Styling Lounge', joinedAt: new Date().toISOString() },
      { id: 5, tokenNumber: 'TR-040', storeId: 1, customerName: 'Olivia Martinez', customerPhone: '+1 (555) 456-7890', garmentCount: 4, status: 'WAITING', priorityLevel: 1, estimatedWaitMinutes: 9, peopleAhead: 2, serviceTypeName: 'Standard Trial Room', joinedAt: new Date().toISOString() },
      { id: 6, tokenNumber: 'TR-042', storeId: 1, customerName: 'Sophia Clark', customerPhone: '+1 (555) 234-5678', garmentCount: 3, status: 'WAITING', priorityLevel: 1, estimatedWaitMinutes: 12, peopleAhead: 3, serviceTypeName: 'Standard Trial Room', joinedAt: new Date().toISOString() }
    ],
    activeList: [
      { id: 1, tokenNumber: 'TR-038', storeId: 1, customerName: 'Marcus Vance', garmentCount: 4, status: 'IN_SERVICE', priorityLevel: 1, estimatedWaitMinutes: 0, peopleAhead: 0, assignedRoomNumber: 'Room 02', joinedAt: new Date().toISOString() },
      { id: 2, tokenNumber: 'EXP-019', storeId: 1, customerName: 'Jessica Taylor', garmentCount: 2, status: 'IN_SERVICE', priorityLevel: 2, estimatedWaitMinutes: 0, peopleAhead: 0, assignedRoomNumber: 'Room 01 (Express)', joinedAt: new Date().toISOString() }
    ],
    rooms: [
      { roomId: 1, roomNumber: 'Room 01 (Express)', roomType: 'EXPRESS', status: 'OCCUPIED', currentTokenNumber: 'EXP-019', customerName: 'Jessica Taylor', garmentCount: 2, elapsedMinutes: 4 },
      { roomId: 2, roomNumber: 'Room 02', roomType: 'REGULAR', status: 'OCCUPIED', currentTokenNumber: 'TR-038', customerName: 'Marcus Vance', garmentCount: 4, elapsedMinutes: 8 },
      { roomId: 3, roomNumber: 'Room 03', roomType: 'REGULAR', status: 'AVAILABLE' },
      { roomId: 4, roomNumber: 'Room 04', roomType: 'REGULAR', status: 'AVAILABLE' },
      { roomId: 5, roomNumber: 'Room 05 (Family)', roomType: 'ACCESSIBLE', status: 'AVAILABLE' },
      { roomId: 6, roomNumber: 'Room 06 (VIP)', roomType: 'VIP', status: 'AVAILABLE' }
    ]
  });

  specificTokenInput = '';
  isBusy = false;
  currentTime = signal<string>(new Date().toLocaleTimeString());

  // Walk-in Token Issue State
  showWalkInModal = false;
  walkInName = '';
  walkInPhone = '';
  walkInGarments = 3;
  walkInServiceTypeId = 1;
  walkInIsVip = false;

  private subs: Subscription[] = [];

  isValidIndianPhone(phone: string): boolean {
    const cleaned = phone.trim().replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(cleaned);
  }

  issueWalkInToken(): void {
    const store = this.currentStore();
    if (!store) return;

    const req: JoinQueueRequest = {
      storeId: store.id,
      customerName: this.walkInName.trim() || 'Walk-in Customer',
      customerPhone: this.walkInPhone.trim() ? '+91' + this.walkInPhone.trim() : '',
      customerEmail: '',
      garmentCount: this.walkInGarments,
      serviceTypeId: Number(this.walkInServiceTypeId),
      vip: this.walkInIsVip
    };

    this.queueService.joinQueue(req).subscribe({
      next: (ticket) => {
        this.showWalkInModal = false;
        this.walkInName = '';
        this.walkInPhone = '';
        this.walkInGarments = 3;
        this.loadQueueSummary();
        alert(`Token Issued Successfully!\n\nToken Number: ${ticket.tokenNumber}\nCustomer: ${ticket.customerName}\nService: ${ticket.serviceTypeName}\nGarments: ${ticket.garmentCount}\nEstimated Wait: ${ticket.estimatedWaitMinutes} mins`);
      },
      error: (err) => alert(err.error?.message || 'Error issuing token')
    });
  }

  ngOnInit(): void {
    this.loadStores();
    
    // Live clock update
    const clockSub = interval(1000).subscribe(() => {
      this.currentTime.set(new Date().toLocaleTimeString());
    });
    this.subs.push(clockSub);

    // Auto-refresh timer every 10 seconds in case of network latency
    const timerSub = interval(10000).subscribe(() => this.loadQueueSummary());
    this.subs.push(timerSub);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  loadStores(): void {
    this.queueService.getStores().subscribe(stores => {
      this.stores.set(stores);
      if (stores.length > 0) {
        // If staff user is assigned to a store, prefer that
        const userStoreId = this.authService.currentUser()?.storeId;
        const target = userStoreId ? stores.find(s => s.id === userStoreId) : stores[0];
        this.currentStore.set(target || stores[0]);
        this.loadQueueSummary();
        this.initStoreWebSocket();
      }
    });
  }

  onStoreChange(storeId: number): void {
    const store = this.stores().find(s => s.id === Number(storeId));
    if (store) {
      this.currentStore.set(store);
      this.loadQueueSummary();
      this.initStoreWebSocket();
    }
  }

  loadQueueSummary(): void {
    const store = this.currentStore();
    if (!store) return;
    this.queueService.getStoreQueueSummary(store.id).subscribe(res => {
      this.summary.set(res);
    });
  }

  // Primary Actions
  callNextCustomer(): void {
    const store = this.currentStore();
    if (!store) return;
    this.isBusy = true;
    this.queueService.callTicket(store.id).subscribe({
      next: () => {
        this.isBusy = false;
        this.loadQueueSummary();
      },
      error: (err) => {
        this.isBusy = false;
        alert(err.error?.message || 'Could not call next ticket');
      }
    });
  }

  callNextCustomerToRoom(roomId: number): void {
    const store = this.currentStore();
    if (!store) return;
    this.isBusy = true;
    this.queueService.callTicket(store.id, roomId).subscribe({
      next: () => {
        this.isBusy = false;
        this.loadQueueSummary();
      },
      error: (err) => {
        this.isBusy = false;
        alert(err.error?.message || 'Could not call ticket to room');
      }
    });
  }

  callSpecificToken(): void {
    const token = this.specificTokenInput.trim();
    if (!token) return;

    this.queueService.getTicketStatus(token).subscribe({
      next: (ticket) => {
        this.callSpecificTicketDirect(ticket.id);
        this.specificTokenInput = '';
      },
      error: () => {
        alert(`Token '${token}' not found in the system.`);
      }
    });
  }

  callSpecificTicketDirect(ticketId: number): void {
    const store = this.currentStore();
    if (!store) return;
    this.isBusy = true;
    this.queueService.callTicket(store.id, undefined, ticketId).subscribe({
      next: () => {
        this.isBusy = false;
        this.loadQueueSummary();
      },
      error: (err) => {
        this.isBusy = false;
        alert(err.error?.message || 'Failed calling ticket');
      }
    });
  }

  startFirstCalledService(): void {
    const calledTicket = this.summary()?.activeList.find(t => t.status === 'CALLED');
    if (!calledTicket) return;
    this.isBusy = true;
    this.queueService.startService(calledTicket.id, calledTicket.assignedRoomId).subscribe({
      next: () => {
        this.isBusy = false;
        this.loadQueueSummary();
      },
      error: () => { this.isBusy = false; }
    });
  }

  completeActiveService(): void {
    const servingTicket = this.summary()?.activeList.find(t => t.status === 'IN_SERVICE' || t.status === 'CALLED');
    if (!servingTicket) return;
    this.isBusy = true;
    this.queueService.completeService(servingTicket.id).subscribe({
      next: () => {
        this.isBusy = false;
        this.loadQueueSummary();
      },
      error: () => { this.isBusy = false; }
    });
  }

  completeRoomService(ticketId: number): void {
    this.isBusy = true;
    this.queueService.completeService(ticketId).subscribe({
      next: () => {
        this.isBusy = false;
        this.loadQueueSummary();
      },
      error: () => { this.isBusy = false; }
    });
  }

  skipActiveTicket(): void {
    const active = this.summary()?.activeList[0];
    if (!active) return;
    this.isBusy = true;
    this.queueService.skipTicket(active.id).subscribe({
      next: () => {
        this.isBusy = false;
        this.loadQueueSummary();
      },
      error: () => { this.isBusy = false; }
    });
  }

  recallTicketPrompt(): void {
    const token = prompt('Enter token number to recall (e.g. TR-038):');
    if (!token) return;
    this.queueService.getTicketStatus(token.trim()).subscribe({
      next: (t) => {
        this.queueService.recallTicket(t.id).subscribe(() => this.loadQueueSummary());
      },
      error: () => alert('Token not found')
    });
  }

  markNoShowActive(): void {
    const active = this.summary()?.activeList[0];
    if (!active) return;
    if (confirm(`Mark token ${active.tokenNumber} (${active.customerName}) as No-Show?`)) {
      this.isBusy = true;
      this.queueService.markNoShow(active.id).subscribe({
        next: () => {
          this.isBusy = false;
          this.loadQueueSummary();
        },
        error: () => { this.isBusy = false; }
      });
    }
  }

  hasCalledTicket(): boolean {
    return !!this.summary()?.activeList.some(t => t.status === 'CALLED');
  }

  hasServingTicket(): boolean {
    return !!this.summary()?.activeList.some(t => t.status === 'IN_SERVICE' || t.status === 'CALLED');
  }

  hasActiveTicket(): boolean {
    return (this.summary()?.activeList.length || 0) > 0;
  }

  private initStoreWebSocket(): void {
    const store = this.currentStore();
    if (!store) return;
    const wsSub = this.wsService.subscribeToTopic<QueueSummary>(`/topic/queue/${store.id}`).subscribe(summary => {
      this.summary.set(summary);
    });
    this.subs.push(wsSub);
  }
}
