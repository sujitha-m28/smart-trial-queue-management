import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { QueueService } from '../../services/queue.service';
import { AuditLog, DashboardStats, Feedback, QueueRule, ServiceType, Store, User } from '../../models/queue.models';
import * as QRCode from 'qrcode';

type AdminTab = 'analytics' | 'users' | 'staff' | 'stores' | 'services' | 'rules' | 'qr' | 'audit';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      
      <!-- Top Header -->
      <div class="admin-header glass-card">
        <div>
          <div class="badge badge-called">SYSTEM ADMINISTRATION</div>
          <h1 class="header-title">Retail Trial Room Operations Hub</h1>
          <p class="header-sub">Enterprise multi-store queue intelligence, rule orchestration, and real-time audit logs</p>
        </div>

        <div class="header-actions">
          <div class="live-clock-badge">
            <span class="clock-icon">⏰</span>
            <span class="clock-time mono-font">{{ currentTime() }}</span>
          </div>
          <button class="btn btn-primary btn-sm" (click)="loadAllData()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Refresh Dashboard
          </button>
        </div>
      </div>

      <!-- Executive KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card glass-card">
          <div class="kpi-content">
            <span class="kpi-label">Users</span>
            <span class="kpi-value mono-font">{{ stats()?.totalUsers || 0 }}</span>
            <span class="kpi-meta">Registered system accounts</span>
          </div>
        </div>

        <div class="kpi-card glass-card">
          <div class="kpi-content">
            <span class="kpi-label">Staff</span>
            <span class="kpi-value mono-font">{{ stats()?.totalStaff || 0 }}</span>
            <span class="kpi-meta">Active attendants</span>
          </div>
        </div>

        <div class="kpi-card glass-card">
          <div class="kpi-content">
            <span class="kpi-label">Active Queues</span>
            <span class="kpi-value mono-font text-info">{{ stats()?.activeQueues || 0 }}</span>
            <span class="kpi-meta">Live store locations</span>
          </div>
        </div>

        <div class="kpi-card glass-card">
          <div class="kpi-content">
            <span class="kpi-label">Today's Customers</span>
            <span class="kpi-value mono-font text-accent">{{ stats()?.todayCustomers || 0 }}</span>
            <span class="kpi-meta">{{ stats()?.todayCompleted || 0 }} fittings completed</span>
          </div>
        </div>

        <div class="kpi-card glass-card">
          <div class="kpi-content">
            <span class="kpi-label">Avg Wait Time</span>
            <span class="kpi-value mono-font text-primary">{{ stats()?.averageWaitMinutes || 0 }}m</span>
            <span class="kpi-meta">Fitting: {{ stats()?.averageServiceMinutes || 0 }}m</span>
          </div>
        </div>

        <div class="kpi-card glass-card">
          <div class="kpi-content">
            <span class="kpi-label">Customer CSAT</span>
            <span class="kpi-value mono-font text-success">{{ stats()?.customerSatisfactionScore || 5.0 }} <small>/ 5.0</small></span>
            <span class="kpi-meta">Live rating average</span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-nav-bar glass-card">
        <button class="tab-btn" [class.active]="activeTab === 'analytics'" (click)="activeTab = 'analytics'">
          Reports & Analytics
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'users'" (click)="activeTab = 'users'">
          Users Management
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'staff'" (click)="activeTab = 'staff'">
          Staff Management
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'stores'" (click)="activeTab = 'stores'">
          Store Management
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'services'" (click)="activeTab = 'services'">
          Service Management
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'rules'" (click)="activeTab = 'rules'">
          Queue Settings
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'qr'" (click)="activeTab = 'qr'">
          QR Code Generator
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'audit'" (click)="activeTab = 'audit'">
          Audit Logs
        </button>
      </div>

      <!-- TAB CONTENT PANELS -->

      <!-- 1. REPORTS & ANALYTICS -->
      <div *ngIf="activeTab === 'analytics'" class="tab-pane">
        
        <!-- AI Intelligence Recommendations Banner -->
        <div *ngIf="stats()?.aiInsights as ai" class="ai-insight-card glass-card">
          <div class="ai-card-header">
            <div class="ai-badge">Generative AI Queue Intelligence</div>
            <span class="text-sm text-muted">Predictive Retail Model</span>
          </div>
          <h3 class="ai-summary">{{ ai.recommendationSummary }}</h3>
          <div class="ai-meta-grid">
            <div class="ai-meta-item">
              <span>Predicted Peak Rush:</span>
              <strong>{{ ai.predictedPeakHour }}</strong>
            </div>
            <div class="ai-meta-item">
              <span>Recommended Staff:</span>
              <strong>{{ ai.recommendedStaffCount }} fitting attendants</strong>
            </div>
            <div class="ai-meta-item">
              <span>Identified Bottleneck:</span>
              <strong>{{ ai.bottleneckRoom }}</strong>
            </div>
          </div>
          <div class="ai-tips">
            <h4>Actionable Recommendations:</h4>
            <ul>
              <li *ngFor="let tip of ai.actionableTips">{{ tip }}</li>
            </ul>
          </div>
        </div>

        <!-- Hourly Traffic Heatmap / Bar Visual -->
        <div class="analytics-row">
          <div class="chart-card glass-card">
            <h3>Hourly Customer Arrivals vs. Completions</h3>
            <div class="bar-chart-container">
              <div *ngFor="let h of stats()?.hourlyTraffic" class="chart-col">
                <div class="bars-pair">
                  <div class="bar bar-arrival" [style.height.px]="h.arrivals * 3" [title]="h.arrivals + ' arrivals'"></div>
                  <div class="bar bar-completed" [style.height.px]="h.completed * 3" [title]="h.completed + ' completed'"></div>
                </div>
                <span class="col-label">{{ h.hour }}</span>
              </div>
            </div>
            <div class="chart-legend">
              <span class="legend-item"><span class="dot dot-arrival"></span> Arrivals (Customers Joined)</span>
              <span class="legend-item"><span class="dot dot-completed"></span> Completed Fittings</span>
            </div>
          </div>

          <!-- Room Utilization -->
          <div class="chart-card glass-card">
            <h3>Trial Room Utilization & Throughput</h3>
            <div class="util-list">
              <div *ngFor="let r of stats()?.roomUtilization" class="util-item">
                <div class="util-header">
                  <strong>{{ r.roomNumber }} ({{ r.roomType }})</strong>
                  <span>{{ r.utilizationPercentage }}% Active</span>
                </div>
                <div class="util-bar-track">
                  <div class="util-bar-fill" [style.width.%]="r.utilizationPercentage"></div>
                </div>
                <div class="util-sub">
                  <span>{{ r.customersServed }} customers served</span>
                  <span>{{ r.activeMinutes }} mins total fitting</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Customer Feedback -->
        <div class="feedback-table-card glass-card">
          <div class="section-header-row">
            <h3>Recent Customer Satisfaction Feedback</h3>
            <span class="badge badge-vip">CSAT {{ stats()?.customerSatisfactionScore || 4.8 }}/5.0</span>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Customer</th>
                  <th>Overall Rating</th>
                  <th>Wait Speed</th>
                  <th>Staff Rating</th>
                  <th>Cleanliness</th>
                  <th>Feedback Comment</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let f of feedbacks()">
                  <td><span class="mono-font text-info">{{ f.tokenNumber }}</span></td>
                  <td><strong>{{ f.customerName }}</strong></td>
                  <td>
                    <span class="star-rating">
                      <span *ngFor="let s of [1,2,3,4,5]" [class.gold]="s <= f.rating">★</span>
                    </span>
                  </td>
                  <td>{{ f.waitTimeSatisfaction }}/5</td>
                  <td>{{ f.staffHelpfulness }}/5</td>
                  <td>{{ f.roomCleanliness }}/5</td>
                  <td class="comment-cell">{{ f.comment || 'No comment provided' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 2. USERS MANAGEMENT -->
      <div *ngIf="activeTab === 'users'" class="tab-pane">
        <div class="glass-card pane-card">
          <div class="pane-header">
            <div>
              <h2>Users Management ({{ users().length }} Accounts)</h2>
              <p class="text-muted text-sm">Manage customers, staff credentials, and administrative accounts</p>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Assigned Store</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of users()">
                  <td>#{{ u.id }}</td>
                  <td><strong class="mono-font">{{ u.username }}</strong></td>
                  <td>{{ u.fullName }}</td>
                  <td>{{ u.email || '—' }}</td>
                  <td>
                    <span class="badge" [ngClass]="'badge-' + u.role.toLowerCase()">{{ u.role }}</span>
                  </td>
                  <td>{{ u.storeName || 'All Stores' }}</td>
                  <td>
                    <span class="badge" [ngClass]="u.active ? 'badge-serving' : 'badge-completed'">
                      {{ u.active ? 'ACTIVE' : 'INACTIVE' }}
                    </span>
                  </td>
                  <td>
                    <button *ngIf="u.role !== 'ADMIN'" class="btn btn-danger btn-xs" (click)="deleteUser(u.id)">
                      Deactivate
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 3. STAFF MANAGEMENT -->
      <div *ngIf="activeTab === 'staff'" class="tab-pane">
        <div class="glass-card pane-card">
          <div class="pane-header">
            <div>
              <h2>Staff Management & Shift Leaderboard</h2>
              <p class="text-muted text-sm">Create and assign trial room attendants and monitor fitting efficiency</p>
            </div>
            <button class="btn btn-primary btn-sm" (click)="showCreateStaffModal = true">
              + Add New Staff Member
            </button>
          </div>

          <!-- Staff Performance Leaderboard -->
          <div class="staff-leaderboard-grid">
            <div *ngFor="let sp of stats()?.staffPerformance" class="staff-perf-card">
              <div class="staff-perf-avatar">{{ sp.staffName.charAt(0) }}</div>
              <div class="staff-perf-info">
                <h4>{{ sp.staffName }}</h4>
                <div class="staff-perf-stats">
                  <span>👗 <strong>{{ sp.customersServed }}</strong> fittings</span>
                  <span>⏱️ <strong>{{ sp.avgFittingDurationMinutes }}m</strong> avg time</span>
                  <span>⭐ <strong>{{ sp.rating }}</strong> rating</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Staff Table -->
          <div class="table-responsive" style="margin-top: 24px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Username</th>
                  <th>Phone</th>
                  <th>Assigned Store</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of staffList()">
                  <td><strong>{{ s.fullName }}</strong></td>
                  <td class="mono-font">{{ s.username }}</td>
                  <td>{{ s.phone || '—' }}</td>
                  <td>{{ s.storeName || 'Grand Central Flagship' }}</td>
                  <td><span class="badge badge-staff">STAFF</span></td>
                  <td>
                    <button class="btn btn-danger btn-xs" (click)="deleteUser(s.id)">Remove</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 4. STORE MANAGEMENT -->
      <div *ngIf="activeTab === 'stores'" class="tab-pane">
        <div class="glass-card pane-card">
          <div class="pane-header">
            <div>
              <h2>Store Management ({{ stores().length }} Locations)</h2>
              <p class="text-muted text-sm">Configure retail branches, trial room counts, and operating hours</p>
            </div>
            <button class="btn btn-primary btn-sm" (click)="showCreateStoreModal = true">
              + Add New Store
            </button>
          </div>

          <div class="stores-grid">
            <div *ngFor="let s of stores()" class="store-admin-card">
              <div class="store-card-header">
                <div>
                  <span class="mono-font text-info">{{ s.code }}</span>
                  <h3>{{ s.name }}</h3>
                </div>
                <span class="badge badge-serving">{{ s.active ? 'OPERATIONAL' : 'INACTIVE' }}</span>
              </div>
              <p class="store-addr">📍 {{ s.address }} ({{ s.location }})</p>
              <div class="store-kpis">
                <div>🚪 <strong>{{ s.totalRooms }}</strong> Rooms</div>
                <div>🕒 <strong>{{ s.openingHours }}</strong></div>
                <div>⭐ <strong>{{ s.avgRating }}</strong> Rating</div>
              </div>
              <div class="store-card-actions">
                <button class="btn btn-secondary btn-xs" (click)="generateQrForStore(s)">Generate QR Poster</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. SERVICE MANAGEMENT -->
      <div *ngIf="activeTab === 'services'" class="tab-pane">
        <div class="glass-card pane-card">
          <div class="pane-header">
            <div>
              <h2>Service & Trial Room Types</h2>
              <p class="text-muted text-sm">Configure standard fitting, express lines, VIP styling, and accessible rooms</p>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Service Name</th>
                  <th>Description</th>
                  <th>Max Garments</th>
                  <th>Avg Service Duration</th>
                  <th>Priority Tier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let st of serviceTypes()">
                  <td><span class="mono-font text-accent">{{ st.code }}</span></td>
                  <td><strong>{{ st.name }}</strong></td>
                  <td>{{ st.description }}</td>
                  <td><span class="garment-pill">{{ st.maxItems }} items max</span></td>
                  <td>~{{ st.avgServiceMinutes }} minutes</td>
                  <td>
                    <span class="badge" [ngClass]="st.priorityLevel === 3 ? 'badge-vip' : (st.priorityLevel === 2 ? 'badge-express' : 'badge-waiting')">
                      Tier {{ st.priorityLevel }}
                    </span>
                  </td>
                  <td><span class="badge badge-serving">ACTIVE</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 6. QUEUE SETTINGS -->
      <div *ngIf="activeTab === 'rules'" class="tab-pane">
        <div class="glass-card pane-card" style="max-width: 800px;">
          <div class="pane-header">
            <div>
              <h2>Queue Rules & Priority Engine Configuration</h2>
              <p class="text-muted text-sm">Fine-tune automated wait calculation parameters and fairness policies</p>
            </div>
          </div>

          <div class="rules-form">
            <div class="rule-item">
              <label>Maximum Garments Allowed Per Person</label>
              <p class="rule-desc">Prevents trial room hoarding during peak traffic periods</p>
              <input type="number" class="form-input" [(ngModel)]="currentRule.maxGarmentsPerPerson" min="1" max="15" />
            </div>

            <div class="rule-item">
              <label>Room Turnover Buffer Time (Minutes)</label>
              <p class="rule-desc">Extra buffer allotted for sanitation and garment return inspection</p>
              <input type="number" class="form-input" [(ngModel)]="currentRule.bufferTimeMinutes" min="0" max="10" />
            </div>

            <div class="rule-item">
              <label>Auto-No-Show Timeout (Minutes)</label>
              <p class="rule-desc">Grace period before a called customer is automatically marked as No-Show</p>
              <input type="number" class="form-input" [(ngModel)]="currentRule.autoNoShowMinutes" min="1" max="20" />
            </div>

            <div class="rule-item">
              <label>VIP Priority Queue Multiplier</label>
              <p class="rule-desc">Wait reduction factor applied to loyalty/VIP trial room queue requests</p>
              <input type="number" step="0.1" class="form-input" [(ngModel)]="currentRule.vipPriorityMultiplier" min="1.0" max="3.0" />
            </div>

            <div class="rule-item">
              <label class="toggle-label">
                <input type="checkbox" [(ngModel)]="currentRule.enableAiOptimization" />
                <span>Enable Generative AI Wait Time Optimization Engine</span>
              </label>
            </div>

            <div class="rule-item">
              <label class="toggle-label">
                <input type="checkbox" [(ngModel)]="currentRule.sendSmsNotifications" />
                <span>Send SMS Turn Notifications to Customers</span>
              </label>
            </div>

            <button class="btn btn-primary btn-block" (click)="saveQueueRules()">
              Save Queue Policy Settings
            </button>
          </div>
        </div>
      </div>

      <!-- 7. QR CODE GENERATOR -->
      <div *ngIf="activeTab === 'qr'" class="tab-pane">
        <div class="glass-card pane-card">
          <div class="pane-header">
            <div>
              <h2>Store QR Code Generator & Signage Poster</h2>
              <p class="text-muted text-sm">Generate printable high-resolution QR codes for trial room entrance kiosks</p>
            </div>
          </div>

          <div class="qr-gen-layout">
            <div class="qr-preview-poster">
              <div class="poster-header">
                <h3>🛍️ SMART TRIAL ROOM</h3>
                <span>SCAN TO JOIN DIGITAL QUEUE</span>
              </div>

              <div class="qr-image-wrapper">
                <img *ngIf="qrDataUrl" [src]="qrDataUrl" alt="Store QR Code" class="qr-image" />
              </div>

              <div class="poster-footer">
                <strong>{{ selectedQrStore()?.name }}</strong>
                <p>Track your position & estimated wait live on your phone!</p>
              </div>
            </div>

            <div class="qr-controls">
              <label>Target Store Branch:</label>
              <select class="store-dropdown" [ngModel]="selectedQrStore()?.id" (ngModelChange)="onQrStoreChange($event)">
                <option *ngFor="let s of stores()" [value]="s.id">{{ s.name }} ({{ s.code }})</option>
              </select>

              <div class="qr-url-box">
                <label>Direct Customer Queue URL:</label>
                <input type="text" class="form-input mono-font" [value]="getStoreQueueUrl()" readonly />
              </div>

              <div class="qr-actions">
                <a [href]="qrDataUrl" download="trial-room-qr.png" class="btn btn-primary btn-block">
                  ⬇️ Download High-Res QR Code Image
                </a>
                <button class="btn btn-secondary btn-block" (click)="printQrPoster()">
                  🖨️ Print Store Entrance Poster
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 8. AUDIT LOGS -->
      <div *ngIf="activeTab === 'audit'" class="tab-pane">
        <div class="glass-card pane-card">
          <div class="pane-header">
            <div>
              <h2>System Activity & Audit Logs</h2>
              <p class="text-muted text-sm">Immutable timestamped logs of all queue actions, staff calls, and system events</p>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let log of auditLogs()">
                  <td class="mono-font text-sm">{{ log.timestamp | date:'short' }}</td>
                  <td><strong>{{ log.actorUsername }}</strong></td>
                  <td><span class="badge" [ngClass]="'badge-' + log.actorRole.toLowerCase()">{{ log.actorRole }}</span></td>
                  <td><span class="badge badge-waiting">{{ log.action }}</span></td>
                  <td class="mono-font">{{ log.entityName }} {{ log.entityId ? '#' + log.entityId : '' }}</td>
                  <td>{{ log.details }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- CREATE STAFF MODAL -->
      <div *ngIf="showCreateStaffModal" class="modal-backdrop" (click)="showCreateStaffModal = false">
        <div class="modal-card glass-card" (click)="$event.stopPropagation()">
          <h3>Create New Staff Account</h3>
          <div class="modal-form">
            <div class="input-group">
              <label>Full Name *</label>
              <input type="text" class="form-input" [(ngModel)]="newStaffName" placeholder="e.g. Michael Scott" />
            </div>
            <div class="input-group">
              <label>Username *</label>
              <input type="text" class="form-input" [(ngModel)]="newStaffUsername" placeholder="e.g. staff_michael" />
            </div>
            <div class="input-group">
              <label>Password *</label>
              <input type="password" class="form-input" [(ngModel)]="newStaffPassword" placeholder="Minimum 6 characters" />
            </div>
            <div class="input-group">
              <label>Assigned Store *</label>
              <select class="store-dropdown" [(ngModel)]="newStaffStoreId">
                <option *ngFor="let s of stores()" [value]="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showCreateStaffModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="createStaffMember()" [disabled]="!newStaffUsername || !newStaffPassword || !newStaffName">
              Create Staff Account
            </button>
          </div>
        </div>
      </div>

      <!-- CREATE STORE MODAL -->
      <div *ngIf="showCreateStoreModal" class="modal-backdrop" (click)="showCreateStoreModal = false">
        <div class="modal-card glass-card" (click)="$event.stopPropagation()">
          <h3>Add New Retail Store Branch</h3>
          <div class="modal-form">
            <div class="input-group">
              <label>Store Code (Unique) *</label>
              <input type="text" class="form-input mono-font" [(ngModel)]="newStoreCode" placeholder="e.g. STR-SF-04" />
            </div>
            <div class="input-group">
              <label>Store Name *</label>
              <input type="text" class="form-input" [(ngModel)]="newStoreName" placeholder="e.g. Union Square Flagship" />
            </div>
            <div class="input-group">
              <label>City / Location *</label>
              <input type="text" class="form-input" [(ngModel)]="newStoreLocation" placeholder="e.g. San Francisco, CA" />
            </div>
            <div class="input-group">
              <label>Full Address</label>
              <input type="text" class="form-input" [(ngModel)]="newStoreAddress" placeholder="e.g. 865 Market St" />
            </div>
            <div class="input-group">
              <label>Total Trial Rooms</label>
              <input type="number" class="form-input" [(ngModel)]="newStoreRooms" min="1" max="20" />
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showCreateStoreModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="createStore()" [disabled]="!newStoreCode || !newStoreName">
              Create Store
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 24px 20px 80px;
    }
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 28px;
      margin-bottom: 24px;
    }
    .header-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #ffffff !important;
      margin-top: 6px;
    }
    .header-sub {
      font-size: 0.85rem;
      color: #cbd5e1 !important;
      font-weight: 500;
    }
    .header-actions {
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
    
    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .kpi-content {
      display: flex;
      flex-direction: column;
    }
    .kpi-label {
      font-size: 0.75rem;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 800;
    }
    .kpi-value {
      font-size: 1.8rem;
      font-weight: 900;
      line-height: 1.1;
      margin: 2px 0;
      color: #ffffff;
    }
    .kpi-meta {
      font-size: 0.7rem;
      color: #cbd5e1;
      font-weight: 600;
    }

    /* Tabs Bar */
    .tabs-nav-bar {
      display: flex;
      gap: 6px;
      padding: 8px;
      margin-bottom: 24px;
      overflow-x: auto;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .tab-btn {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      font-size: 0.875rem;
      font-weight: 700;
      padding: 10px 18px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: #ffffff;
      background: rgba(30, 41, 59, 0.95);
    }
    .tab-btn.active {
      background: #10b981;
      color: white;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
      border-color: #059669;
    }

    /* Tab Pane */
    .pane-card {
      padding: 24px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .pane-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .pane-header h2 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
    }

    /* AI Insight Card */
    .ai-insight-card {
      padding: 24px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(16, 185, 129, 0.3);
      margin-bottom: 24px;
      border-radius: var(--radius-lg);
    }
    .ai-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .ai-badge {
      background: linear-gradient(135deg, #10b981, #0284c7);
      color: white;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .ai-summary {
      font-size: 1.15rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 16px;
    }
    .ai-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .ai-meta-item {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.825rem;
      color: #cbd5e1;
    }
    .ai-meta-item strong {
      color: #34d399;
      font-size: 0.95rem;
    }
    .ai-tips h4 {
      font-size: 0.85rem;
      font-weight: 800;
      color: #fbbf24;
      margin-bottom: 6px;
    }
    .ai-tips ul {
      padding-left: 20px;
      font-size: 0.85rem;
      color: #cbd5e1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    /* Analytics Chart */
    .analytics-row {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    .chart-card {
      padding: 24px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .chart-card h3 {
      font-size: 1.05rem;
      font-weight: 800;
      color: #4a044e;
      margin-bottom: 20px;
    }
    .bar-chart-container {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      height: 200px;
      padding-bottom: 24px;
      border-bottom: 1px solid #fbcfe8;
    }
    .chart-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
    }
    .bars-pair {
      display: flex;
      gap: 4px;
      align-items: flex-end;
    }
    .bar {
      width: 12px;
      border-radius: 4px 4px 0 0;
      transition: height 0.3s;
    }
    .bar-arrival { background: #ec4899; }
    .bar-completed { background: #10b981; }
    .col-label {
      font-size: 0.68rem;
      color: #9d174d;
      font-weight: 600;
      margin-top: 8px;
    }
    .chart-legend {
      display: flex;
      gap: 20px;
      margin-top: 16px;
      font-size: 0.8rem;
      color: #831843;
      font-weight: 700;
    }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot-arrival { background: #ec4899; }
    .dot-completed { background: #10b981; }

    /* Utilization list */
    .util-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .util-item {
      background: #fdf2f8;
      border: 1px solid #fbcfe8;
      padding: 12px;
      border-radius: var(--radius-sm);
      color: #4a044e;
    }
    .util-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-bottom: 6px;
    }
    .util-bar-track {
      height: 6px;
      background: var(--bg-subtle);
      border-radius: 9999px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .util-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #4f46e5, #0ea5e9);
    }
    .util-sub {
      display: flex;
      justify-content: space-between;
      font-size: 0.725rem;
      color: var(--text-dim);
    }

    /* Staff leaderboard */
    .staff-leaderboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }
    .staff-perf-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .staff-perf-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #ec4899);
      color: white;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }
    .staff-perf-stats {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Stores grid */
    .stores-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }
    .store-admin-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .store-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }
    .store-card-header h3 {
      font-size: 1.1rem;
      font-weight: 800;
      color: white;
    }
    .store-addr {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 14px;
    }
    .store-kpis {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      background: rgba(0, 0, 0, 0.2);
      padding: 10px;
      border-radius: var(--radius-sm);
      margin-bottom: 16px;
    }

    /* Rules form */
    .rules-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .rule-item label {
      display: block;
      font-weight: 700;
      font-size: 0.9rem;
      color: white;
      margin-bottom: 2px;
    }
    .rule-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .toggle-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }

    /* QR Generator layout */
    .qr-gen-layout {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 32px;
      align-items: center;
    }
    .qr-preview-poster {
      background: white;
      color: black;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .poster-header h3 {
      font-size: 1.1rem;
      font-weight: 900;
      color: #1e1b4b;
    }
    .poster-header span {
      font-size: 0.7rem;
      font-weight: 700;
      color: #4f46e5;
      letter-spacing: 0.05em;
    }
    .qr-image-wrapper {
      margin: 16px auto;
      display: flex;
      justify-content: center;
    }
    .qr-image {
      width: 200px;
      height: 200px;
    }
    .poster-footer strong {
      font-size: 0.9rem;
      color: #1e293b;
    }
    .poster-footer p {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 4px;
    }
    .qr-controls {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .qr-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
    }

    /* Table styles */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .data-table th {
      text-align: left;
      padding: 12px;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      font-size: 0.725rem;
      text-transform: uppercase;
      font-weight: 700;
    }
    .data-table td {
      padding: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .star-rating .gold { color: #fbbf24; }
    .comment-cell {
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(6px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      width: 480px;
      max-width: 95vw;
      padding: 28px;
    }
    .modal-card h3 {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 20px;
    }
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 24px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    @media (max-width: 1024px) {
      .analytics-row, .qr-gen-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  adminService = inject(AdminService);
  queueService = inject(QueueService);

  activeTab: AdminTab = 'analytics';

  stats = signal<DashboardStats | null>({
    totalUsers: 4,
    totalStaff: 2,
    activeQueues: 2,
    todayCustomers: 142,
    todayCompleted: 128,
    todayNoShows: 6,
    todayCancelled: 8,
    averageWaitMinutes: 9.4,
    averageServiceMinutes: 7.8,
    customerSatisfactionScore: 4.8,
    hourlyTraffic: [
      { hour: '10:00', arrivals: 4, completed: 3, averageWaitMinutes: 3 },
      { hour: '11:00', arrivals: 12, completed: 10, averageWaitMinutes: 6 },
      { hour: '12:00', arrivals: 28, completed: 24, averageWaitMinutes: 9 },
      { hour: '13:00', arrivals: 35, completed: 32, averageWaitMinutes: 12 },
      { hour: '14:00', arrivals: 42, completed: 39, averageWaitMinutes: 14 },
      { hour: '15:00', arrivals: 38, completed: 36, averageWaitMinutes: 11 },
      { hour: '16:00', arrivals: 48, completed: 44, averageWaitMinutes: 15 },
      { hour: '17:00', arrivals: 55, completed: 51, averageWaitMinutes: 18 },
      { hour: '18:00', arrivals: 62, completed: 58, averageWaitMinutes: 21 },
      { hour: '19:00', arrivals: 45, completed: 42, averageWaitMinutes: 16 },
      { hour: '20:00', arrivals: 30, completed: 28, averageWaitMinutes: 10 },
      { hour: '21:00', arrivals: 14, completed: 12, averageWaitMinutes: 5 }
    ],
    roomUtilization: [
      { roomNumber: 'Room 01', roomType: 'EXPRESS', customersServed: 32, activeMinutes: 160, utilizationPercentage: 88.5 },
      { roomNumber: 'Room 02', roomType: 'REGULAR', customersServed: 24, activeMinutes: 192, utilizationPercentage: 82.0 },
      { roomNumber: 'Room 03', roomType: 'REGULAR', customersServed: 22, activeMinutes: 176, utilizationPercentage: 75.4 },
      { roomNumber: 'Room 04', roomType: 'REGULAR', customersServed: 20, activeMinutes: 160, utilizationPercentage: 70.2 },
      { roomNumber: 'Room 05', roomType: 'ACCESSIBLE', customersServed: 14, activeMinutes: 140, utilizationPercentage: 62.5 },
      { roomNumber: 'Room 06', roomType: 'VIP', customersServed: 10, activeMinutes: 150, utilizationPercentage: 58.0 }
    ],
    staffPerformance: [
      { staffId: 2, staffName: 'Emma Watson', customersServed: 48, avgFittingDurationMinutes: 6.2, rating: 4.9 },
      { staffId: 3, staffName: 'James Miller', customersServed: 42, avgFittingDurationMinutes: 7.1, rating: 4.8 }
    ],
    aiInsights: {
      predictedPeakHour: '18:00 - 19:30 (Evening Rush)',
      recommendedStaffCount: 4,
      bottleneckRoom: 'Room 02 & Room 03 (Regular Rooms)',
      recommendationSummary: 'High customer traffic anticipated between 17:00 - 20:00. Allocating 1 additional staff member to express fittings will reduce average queue wait by 28%.',
      actionableTips: [
        'Enforce strict 5-item garment limit during 17:00-19:00 peak hours',
        'Designate Room 01 as dedicated Express Fitting (<= 2 items)',
        'Pre-notify customers when 2 people remain ahead to minimize room idle turnover time'
      ]
    }
  });
  users = signal<User[]>([
    { id: 1, username: 'admin', fullName: 'System Administrator', email: 'admin@smartqueue.com', role: 'ADMIN', active: true },
    { id: 2, username: 'staff1', fullName: 'Emma Watson', email: 'emma.staff@smartqueue.com', role: 'STAFF', storeName: 'Grand Central Flagship', active: true },
    { id: 3, username: 'staff2', fullName: 'James Miller', email: 'james.staff@smartqueue.com', role: 'STAFF', storeName: 'Westfield Century City', active: true },
    { id: 4, username: 'customer1', fullName: 'Sophia Clark', email: 'sophia.clark@example.com', role: 'CUSTOMER', active: true }
  ]);
  staffList = signal<User[]>([
    { id: 2, username: 'staff1', fullName: 'Emma Watson', email: 'emma.staff@smartqueue.com', phone: '+1 (212) 555-0122', role: 'STAFF', storeName: 'Grand Central Flagship', active: true },
    { id: 3, username: 'staff2', fullName: 'James Miller', email: 'james.staff@smartqueue.com', phone: '+1 (310) 555-0133', role: 'STAFF', storeName: 'Westfield Century City', active: true }
  ]);
  stores = signal<Store[]>([
    { id: 1, code: 'STR-NYC-01', name: 'Grand Central Flagship', location: 'New York, NY', address: '450 Lexington Ave', contactPhone: '+1 (212) 555-0199', openingHours: '09:00 - 22:00', totalRooms: 6, active: true, avgRating: 5.0 },
    { id: 2, code: 'STR-LA-02', name: 'Westfield Century City', location: 'Los Angeles, CA', address: '10250 Santa Monica Blvd', contactPhone: '+1 (310) 555-0144', openingHours: '10:00 - 21:00', totalRooms: 4, active: true, avgRating: 4.8 }
  ]);
  serviceTypes = signal<ServiceType[]>([
    { id: 1, code: 'REGULAR', name: 'Standard Trial Room', description: 'Standard fitting room for up to 6 garments', maxItems: 6, avgServiceMinutes: 8, priorityLevel: 1, active: true },
    { id: 2, code: 'EXPRESS', name: 'Express Fitting (<= 2 Items)', description: 'Priority fast-track queue for 1 or 2 garments only', maxItems: 2, avgServiceMinutes: 4, priorityLevel: 2, active: true },
    { id: 3, code: 'VIP', name: 'VIP Styling Lounge', description: 'Luxury fitting suite with dedicated stylist assistance', maxItems: 10, avgServiceMinutes: 15, priorityLevel: 3, active: true },
    { id: 4, code: 'ACCESSIBLE', name: 'Accessible & Family Room', description: 'Spacious fitting room with wheelchair access', maxItems: 6, avgServiceMinutes: 10, priorityLevel: 1, active: true }
  ]);
  feedbacks = signal<Feedback[]>([
    { id: 1, queueTicketId: 7, tokenNumber: 'TR-036', storeId: 1, rating: 5, waitTimeSatisfaction: 5, staffHelpfulness: 5, roomCleanliness: 5, comment: 'Super smooth queue system! Loved browsing while waiting instead of standing in line.', customerName: 'David Chen', submittedAt: new Date().toISOString() },
    { id: 2, queueTicketId: 8, tokenNumber: 'TR-037', storeId: 1, rating: 5, waitTimeSatisfaction: 4, staffHelpfulness: 5, roomCleanliness: 5, comment: 'The AI assistant answered my question about garment limits immediately. Very convenient!', customerName: 'Emily Davis', submittedAt: new Date().toISOString() }
  ]);
  auditLogs = signal<AuditLog[]>([
    { id: 1, actorUsername: 'SYSTEM', actorRole: 'SYSTEM', action: 'SYSTEM_INIT', entityName: 'App', entityId: '', details: 'System seed data loaded', timestamp: new Date().toISOString() },
    { id: 2, actorUsername: 'staff1', actorRole: 'STAFF', action: 'CALL_TICKET', entityName: 'QueueTicket', entityId: 'TR-038', details: 'Called customer Marcus Vance to Room 02', timestamp: new Date().toISOString() },
    { id: 3, actorUsername: 'staff1', actorRole: 'STAFF', action: 'START_SERVICE', entityName: 'QueueTicket', entityId: 'EXP-019', details: 'Started express fitting in Room 01', timestamp: new Date().toISOString() }
  ]);

  selectedQrStore = signal<Store | null>(null);
  qrDataUrl = '';

  currentRule: QueueRule = {
    storeId: 1,
    maxGarmentsPerPerson: 6,
    bufferTimeMinutes: 2,
    autoNoShowMinutes: 5,
    vipPriorityMultiplier: 1.5,
    enableAiOptimization: true,
    sendSmsNotifications: true
  };

  // Modal States
  showCreateStaffModal = false;
  newStaffName = '';
  newStaffUsername = '';
  newStaffPassword = '';
  newStaffStoreId = 1;

  showCreateStoreModal = false;
  newStoreCode = '';
  newStoreName = '';
  newStoreLocation = '';
  newStoreAddress = '';
  newStoreRooms = 6;

  currentTime = signal<string>(new Date().toLocaleTimeString());

  ngOnInit(): void {
    this.loadAllData();
    interval(1000).subscribe(() => {
      this.currentTime.set(new Date().toLocaleTimeString());
    });
  }

  loadAllData(): void {
    this.adminService.getDashboardStats().subscribe(stats => this.stats.set(stats));
    this.adminService.getAllUsers().subscribe(u => this.users.set(u));
    this.adminService.getStaffUsers().subscribe(s => this.staffList.set(s));
    this.queueService.getStores().subscribe(stores => {
      this.stores.set(stores);
      if (stores.length > 0) {
        this.selectedQrStore.set(stores[0]);
        this.generateQrCodeForStore(stores[0]);
        this.loadQueueRule(stores[0].id);
      }
    });
    this.queueService.getServiceTypes().subscribe(types => this.serviceTypes.set(types));
    this.adminService.getAllFeedbacks().subscribe(f => this.feedbacks.set(f));
    this.adminService.getAuditLogs().subscribe(logs => this.auditLogs.set(logs));
  }

  loadQueueRule(storeId: number): void {
    this.adminService.getQueueRule(storeId).subscribe(rule => {
      this.currentRule = rule;
    });
  }

  saveQueueRules(): void {
    const storeId = this.selectedQrStore()?.id || 1;
    this.adminService.updateQueueRule(storeId, this.currentRule).subscribe(() => {
      alert('Queue rules & priority policies updated successfully!');
    });
  }

  // Staff Creation
  createStaffMember(): void {
    const data = {
      fullName: this.newStaffName,
      username: this.newStaffUsername,
      password: this.newStaffPassword,
      storeId: Number(this.newStaffStoreId)
    };

    this.adminService.createStaff(data).subscribe({
      next: () => {
        this.showCreateStaffModal = false;
        this.newStaffName = '';
        this.newStaffUsername = '';
        this.newStaffPassword = '';
        this.loadAllData();
        alert('Staff account created successfully!');
      },
      error: (err) => alert(err.error?.message || 'Error creating staff')
    });
  }

  // Store Creation
  createStore(): void {
    const data = {
      code: this.newStoreCode,
      name: this.newStoreName,
      location: this.newStoreLocation,
      address: this.newStoreAddress,
      totalRooms: Number(this.newStoreRooms)
    };

    this.adminService.createStore(data).subscribe({
      next: () => {
        this.showCreateStoreModal = false;
        this.newStoreCode = '';
        this.newStoreName = '';
        this.newStoreLocation = '';
        this.newStoreAddress = '';
        this.loadAllData();
        alert('Store created successfully!');
      },
      error: (err) => alert(err.error?.message || 'Error creating store')
    });
  }

  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to deactivate this account?')) {
      this.adminService.deleteUser(userId).subscribe(() => {
        this.loadAllData();
      });
    }
  }

  // QR Code Generation
  generateQrForStore(store: Store): void {
    this.selectedQrStore.set(store);
    this.generateQrCodeForStore(store);
    this.activeTab = 'qr';
  }

  onQrStoreChange(storeId: number): void {
    const store = this.stores().find(s => s.id === Number(storeId));
    if (store) {
      this.selectedQrStore.set(store);
      this.generateQrCodeForStore(store);
    }
  }

  getStoreQueueUrl(): string {
    const store = this.selectedQrStore();
    const code = store ? store.code : 'STR-NYC-01';
    return `http://localhost:4200/customer?store=${code}`;
  }

  private generateQrCodeForStore(store: Store): void {
    const url = `http://localhost:4200/customer?store=${store.code}`;
    QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(dataUrl => {
        this.qrDataUrl = dataUrl;
      })
      .catch(err => {
        console.error('QR generation error:', err);
      });
  }

  printQrPoster(): void {
    window.print();
  }
}
