import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { QueueService } from '../../services/queue.service';
import { WebSocketService } from '../../services/websocket.service';
import { AudioNotificationService } from '../../services/audio.service';
import { PublicDisplayData } from '../../models/queue.models';

@Component({
  selector: 'app-public-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="display-wrapper" [class.fullscreen]="isFullscreen">
      <!-- Top TV Header -->
      <header class="display-header">
        <div class="store-branding">
          <div class="store-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
          </div>
          <div>
            <h1 class="store-name">{{ data()?.storeName || 'Grand Central Flagship' }}</h1>
            <span class="sub-label">SMART TRIAL ROOM QUEUE MONITOR</span>
          </div>
        </div>

        <div class="header-center">
          <div class="live-tag-tv">
            <span class="pulse-dot"></span>
            LIVE QUEUE BOARD
          </div>
        </div>

        <div class="header-right">
          <div class="clock-box mono-font">
            {{ currentTime | date:'hh:mm:ss a' }}
          </div>
          <button class="btn-fullscreen" (click)="toggleFullscreen()" title="Toggle Fullscreen">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          </button>
        </div>
      </header>

      <!-- Main Display Board -->
      <main class="display-main">
        
        <!-- LEFT: NOW SERVING TRIAL ROOMS GRID -->
        <section class="serving-section">
          <div class="section-title-bar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <h2>NOW SERVING &bull; PROCEED TO TRIAL ROOM</h2>
          </div>

          <div class="rooms-tv-grid">
            <div
              *ngFor="let room of data()?.activeRooms"
              class="room-tv-card"
              [class.room-tv-occupied]="room.status === 'OCCUPIED'"
            >
              <div class="room-tv-header">
                <span class="room-tv-number">{{ room.roomNumber }}</span>
                <span class="badge" [ngClass]="room.status === 'OCCUPIED' ? 'badge-serving' : 'badge-completed'">
                  {{ room.status }}
                </span>
              </div>

              <div class="room-tv-body">
                <div *ngIf="room.currentTokenNumber; else roomFreeTpl">
                  <div class="room-tv-token mono-font">{{ room.currentTokenNumber }}</div>
                  <div class="room-tv-guest">{{ room.customerName || 'Customer Fitting' }}</div>
                </div>
                <ng-template #roomFreeTpl>
                  <div class="room-tv-free">
                    <span class="free-text">AVAILABLE</span>
                    <span class="free-sub">Calling Next Guest...</span>
                  </div>
                </ng-template>
              </div>
            </div>
          </div>
        </section>

        <!-- RIGHT: UP NEXT WAITING QUEUE -->
        <section class="waiting-section">
          <div class="section-title-bar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
            <h2>UP NEXT IN LINE</h2>
          </div>

          <div class="waiting-tv-list">
            <div *ngFor="let ticket of data()?.upNextTokens; let i = index" class="waiting-tv-item" [class.first-in-line]="i === 0">
              <div class="queue-pos mono-font">#{{ i + 1 }}</div>
              <div class="queue-token mono-font">{{ ticket.tokenNumber }}</div>
              <div class="queue-type">{{ ticket.serviceTypeName }}</div>
              <div class="queue-wait text-accent mono-font">~{{ ticket.estimatedWaitMinutes }}m</div>
            </div>

            <div *ngIf="(!data()?.upNextTokens || data()!.upNextTokens.length === 0)" class="no-wait-tv">
              <div class="check-icon">✓</div>
              <span>No Wait! Scan QR code to step in immediately.</span>
            </div>
          </div>

          <!-- Bottom Summary Ticker -->
          <div class="tv-bottom-stats">
            <div class="tv-stat-item">
              <span class="tv-stat-label">Total Waiting</span>
              <span class="tv-stat-val mono-font">{{ data()?.totalWaiting || 0 }}</span>
            </div>
            <div class="tv-stat-item">
              <span class="tv-stat-label">Average Wait</span>
              <span class="tv-stat-val mono-font text-accent">~{{ data()?.averageWaitMinutes || 8 }} min</span>
            </div>
          </div>
        </section>

      </main>

      <!-- Bottom Audio Enabled Banner / Help -->
      <footer class="display-footer">
        <span>👗 Scan the QR Code at the entrance with your phone camera to join the queue</span>
        <span>🔔 Audio announcements enabled on customer turn calls</span>
      </footer>
    </div>
  `,
  styles: [`
    .display-wrapper {
      min-height: 100vh;
      background: #090d16;
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 24px 32px;
      box-sizing: border-box;
    }
    .display-wrapper.fullscreen {
      position: fixed;
      inset: 0;
      z-index: 9999;
    }
    .display-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    }
    .store-branding {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .store-icon {
      width: 54px;
      height: 54px;
      border-radius: 16px;
      background: linear-gradient(135deg, #4f46e5, #0ea5e9);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .store-name {
      font-size: 1.8rem;
      font-weight: 900;
      letter-spacing: -0.02em;
    }
    .sub-label {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #38bdf8;
    }
    .live-tag-tv {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 2px solid rgba(16, 185, 129, 0.4);
      padding: 8px 18px;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 800;
      color: #34d399;
      letter-spacing: 0.05em;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .clock-box {
      font-size: 1.5rem;
      font-weight: 800;
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.05);
      padding: 8px 16px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .btn-fullscreen {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      padding: 10px;
      border-radius: 10px;
      cursor: pointer;
    }

    /* Main Grid */
    .display-main {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 32px;
      margin: 24px 0;
      flex: 1;
    }
    .section-title-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(30, 41, 59, 0.8);
      padding: 14px 20px;
      border-radius: 12px;
      margin-bottom: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .section-title-bar h2 {
      font-size: 1.1rem;
      font-weight: 900;
      letter-spacing: 0.05em;
    }

    /* Rooms Grid */
    .rooms-tv-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    .room-tv-card {
      background: rgba(30, 41, 59, 0.6);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 180px;
    }
    .room-tv-occupied {
      background: linear-gradient(135deg, rgba(79, 70, 229, 0.25), rgba(14, 165, 233, 0.15));
      border-color: #6366f1;
      box-shadow: 0 0 25px rgba(99, 102, 241, 0.35);
      animation: pulse-border 2s infinite;
    }
    .room-tv-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .room-tv-number {
      font-size: 1.1rem;
      font-weight: 800;
      color: #94a3b8;
    }
    .room-tv-token {
      font-size: 2.8rem;
      font-weight: 900;
      color: #38bdf8;
      line-height: 1.1;
      margin: 6px 0;
    }
    .room-tv-guest {
      font-size: 0.95rem;
      font-weight: 600;
      color: #f1f5f9;
    }
    .room-tv-free {
      padding: 16px 0;
      text-align: center;
    }
    .free-text {
      display: block;
      font-size: 1.6rem;
      font-weight: 800;
      color: #10b981;
    }
    .free-sub {
      font-size: 0.85rem;
      color: var(--text-dim);
    }

    /* Waiting Section */
    .waiting-tv-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    .waiting-tv-item {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .first-in-line {
      border-color: #fbbf24;
      background: rgba(245, 158, 11, 0.1);
    }
    .queue-pos {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text-muted);
      width: 40px;
    }
    .queue-token {
      font-size: 1.6rem;
      font-weight: 900;
      color: white;
    }
    .queue-type {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .queue-wait {
      font-size: 1.1rem;
      font-weight: 800;
    }
    .no-wait-tv {
      text-align: center;
      padding: 40px;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 12px;
      border: 1px dashed #10b981;
    }
    .check-icon {
      font-size: 2rem;
      color: #10b981;
      margin-bottom: 8px;
    }

    /* Bottom stats */
    .tv-bottom-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .tv-stat-item {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tv-stat-label {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .tv-stat-val {
      font-size: 1.4rem;
      font-weight: 800;
    }

    /* Footer */
    .display-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 0.85rem;
      color: var(--text-muted);
    }
  `]
})
export class PublicDisplayComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  queueService = inject(QueueService);
  wsService = inject(WebSocketService);
  audioService = inject(AudioNotificationService);

  storeCode = 'STR-NYC-01';
  data = signal<PublicDisplayData | null>(null);
  currentTime = new Date();
  isFullscreen = false;

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const code = params.get('storeCode');
      if (code) {
        this.storeCode = code;
        this.loadDisplayData();
        this.initWebSocket();
      }
    });

    const clockSub = interval(1000).subscribe(() => {
      this.currentTime = new Date();
    });
    this.subs.push(clockSub);

    const pollingSub = interval(8000).subscribe(() => {
      this.loadDisplayData();
    });
    this.subs.push(pollingSub);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  loadDisplayData(): void {
    this.queueService.getPublicDisplay(this.storeCode).subscribe(res => {
      this.data.set(res);
    });
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      this.isFullscreen = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        this.isFullscreen = false;
      }
    }
  }

  private initWebSocket(): void {
    const wsSub = this.wsService.subscribeToTopic<PublicDisplayData>(`/topic/public/${this.storeCode}`).subscribe(updated => {
      this.data.set(updated);
      this.audioService.playTurnBell();
    });
    this.subs.push(wsSub);
  }
}
